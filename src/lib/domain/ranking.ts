import type {
  Cafe,
  CafeBadge,
  CafeUnseenLink,
  CoffeeOffering,
  DataProvenance,
  GeoPoint,
  LocalizedText,
  ParsedTravelerRequest,
  RankedCafe,
  RouteEstimate,
  ScoreBreakdown,
  ScoreComponent,
  TransportMode,
} from "./types";

export const RANKING_ALGORITHM_VERSION = "transparent-fit-v1.0.0";

export const SCORE_WEIGHTS = Object.freeze({
  routeAreaFit: 20,
  timeFit: 10,
  tasteFit: 20,
  detourFit: 15,
  availability: 15,
  badges: 10,
  workationFit: 10,
} as const);

export interface RankCafesOptions {
  limit?: number;
  cafeUnseenLinks?: readonly CafeUnseenLink[];
}

interface TravelContext {
  minutes?: number;
  route?: RouteEstimate;
  anchorName?: LocalizedText;
  basis: "stored-route" | "straight-line-estimate" | "area-match" | "unknown";
}

interface OfferingMatch {
  offering?: CoffeeOffering;
  requestedDimensions: number;
  matchedDimensions: number;
}

const BADGE_LABELS: Record<CafeBadge, LocalizedText> = {
  "nan-grown-beans": { th: "เมล็ดปลูกในน่าน", en: "Nan-grown beans" },
  "nan-roasted": { th: "คั่วในน่าน", en: "Nan-roasted" },
  "workation-friendly": { th: "เหมาะกับเวิร์กเคชัน", en: "Workation Friendly" },
  "new-discovery": { th: "ร้านค้นพบใหม่", en: "New discovery" },
};

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value * 10) / 10));
}

function component(
  key: ScoreComponent["key"],
  score: number,
  maxScore: number,
  reason: LocalizedText,
  evidenceIds: string[] = [],
): ScoreComponent {
  return { key, score: clampScore(score, maxScore), maxScore, reason, evidenceIds };
}

function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function speedKmPerHour(transport: TransportMode): number {
  switch (transport) {
    case "walk":
      return 4.5;
    case "bicycle":
      return 12;
    case "motorcycle":
      return 22;
    case "car":
      return 20;
    case "public-transport":
      return 14;
    default:
      return 4.5;
  }
}

function makeLocationEstimate(
  cafe: Cafe,
  request: ParsedTravelerRequest,
  distanceKm: number,
): RouteEstimate | undefined {
  if (request.transport === "unknown") return undefined;
  const estimatedMinutes = Math.max(1, Math.round((distanceKm / speedKmPerHour(request.transport)) * 60));
  const provenance: DataProvenance = {
    kind: cafe.provenance.kind,
    displayLabel: { th: "ระยะเส้นตรงโดยประมาณ ไม่ใช่เส้นทางสด", en: "Approximate straight-line estimate, not live routing" },
    sourceName: "Nan Coffee deterministic demo estimator",
    capturedAt: cafe.provenance.capturedAt,
    isFictional: cafe.provenance.isFictional,
    disclaimer: {
      th: "เวลาเดินทางคำนวณเพื่อสาธิตจากระยะเส้นตรง โปรดตรวจสอบแผนที่จริง",
      en: "Travel time is a deterministic straight-line demo estimate; check a live map before travel.",
    },
  };
  return {
    anchorId: "consented-location",
    anchorName: { th: "ตำแหน่งที่อนุญาต", en: "Consented location" },
    transport: request.transport,
    estimatedMinutes,
    estimatedDistanceKm: Math.round(distanceKm * 10) / 10,
    provenance,
  };
}

function resolveTravelContext(cafe: Cafe, request: ParsedTravelerRequest): TravelContext {
  const anchors = [request.startPoint, ...request.destinations].filter(
    (place): place is NonNullable<typeof place> => Boolean(place),
  );
  const anchorIds = new Set(anchors.map((place) => place.id).filter((id): id is string => Boolean(id)));
  const routeCandidates = cafe.routeEstimates.filter(
    (route) => anchorIds.has(route.anchorId) && (request.transport === "unknown" || route.transport === request.transport),
  );
  routeCandidates.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes || a.anchorId.localeCompare(b.anchorId));
  if (routeCandidates[0]) {
    return {
      minutes: routeCandidates[0].estimatedMinutes,
      route: routeCandidates[0],
      anchorName: routeCandidates[0].anchorName,
      basis: "stored-route",
    };
  }

  if (request.location.consent === "granted" && request.location.coordinates) {
    const distance = haversineKm(request.location.coordinates, cafe.coordinates);
    const route = makeLocationEstimate(cafe, request, distance);
    if (route) {
      return { minutes: route.estimatedMinutes, route, anchorName: route.anchorName, basis: "straight-line-estimate" };
    }
  }

  if (anchors.some((place) => place.id === cafe.areaId)) {
    return { basis: "area-match" };
  }
  return { basis: "unknown" };
}

function scoreRoute(travel: TravelContext, cafe: Cafe): ScoreComponent {
  if (travel.minutes !== undefined) {
    const score = travel.minutes <= 5 ? 20 : travel.minutes <= 10 ? 17 : travel.minutes <= 20 ? 12 : travel.minutes <= 30 ? 7 : 3;
    return component(
      "route-area-fit",
      score,
      SCORE_WEIGHTS.routeAreaFit,
      {
        th: `มีข้อมูลประมาณการ ${travel.minutes} นาทีจาก${travel.anchorName?.th ?? "จุดในแผน"}`,
        en: `Has a ${travel.minutes}-minute estimate from ${travel.anchorName?.en ?? "a place in the plan"}.`,
      },
      travel.route ? [`route:${cafe.id}:${travel.route.anchorId}:${travel.route.transport}`] : [],
    );
  }
  if (travel.basis === "area-match") {
    return component(
      "route-area-fit",
      15,
      SCORE_WEIGHTS.routeAreaFit,
      { th: "ร้านอยู่ในย่านที่ระบุ แต่ไม่มีเวลาเดินทางสด", en: "The cafe is in the requested area, but no live travel time is available." },
      [cafe.areaId],
    );
  }
  return component(
    "route-area-fit",
    8,
    SCORE_WEIGHTS.routeAreaFit,
    { th: "ยังไม่มีหลักฐานเส้นทางที่ตรงกับคำขอ", en: "No stored route evidence matches this request yet." },
  );
}

function scoreTime(request: ParsedTravelerRequest, cafe: Cafe, travel: TravelContext): ScoreComponent {
  if (request.availableTimeMinutes === undefined) {
    if (request.useCases.includes("quick-takeaway")) {
      const score = cafe.recommendedVisitMinutes <= 30 ? 10 : cafe.recommendedVisitMinutes <= 45 ? 7 : 2;
      return component(
        "time-fit",
        score,
        SCORE_WEIGHTS.timeFit,
        {
          th: `เลือกแวะรับเร็ว; ร้านแนะนำเวลา ${cafe.recommendedVisitMinutes} นาที (ข้อมูลสาธิต)` ,
          en: `Quick takeaway was selected; the stored suggested visit is ${cafe.recommendedVisitMinutes} minutes (demo data).`,
        },
        [cafe.id],
      );
    }
    return component(
      "time-fit",
      5,
      SCORE_WEIGHTS.timeFit,
      { th: "ยังไม่ได้ระบุเวลา จึงให้คะแนนกลาง", en: "Available time was not provided, so this receives a neutral score." },
    );
  }
  const travelMinutes = travel.minutes === undefined ? 0 : travel.minutes * 2;
  const estimatedTotal = cafe.recommendedVisitMinutes + travelMinutes;
  const margin = request.availableTimeMinutes - estimatedTotal;
  const score = margin >= 0 ? 10 : margin >= -15 ? 7 : margin >= -30 ? 4 : 1;
  return component(
    "time-fit",
    score,
    SCORE_WEIGHTS.timeFit,
    {
      th: `เวลาแนะนำรวมประมาณ ${estimatedTotal} นาที เทียบกับเวลาที่มี ${request.availableTimeMinutes} นาที`,
      en: `Estimated visit plus return travel is ${estimatedTotal} minutes versus ${request.availableTimeMinutes} minutes available.`,
    },
    [cafe.id],
  );
}

function countOfferingMatches(request: ParsedTravelerRequest, offering: CoffeeOffering): OfferingMatch {
  let requestedDimensions = 0;
  let matchedDimensions = 0;
  if (request.tasteProfiles.length > 0) {
    requestedDimensions += 1;
    if (request.tasteProfiles.some((profile) => offering.tasteProfiles.includes(profile))) matchedDimensions += 1;
  }
  if (request.roastLevels.length > 0) {
    requestedDimensions += 1;
    if (request.roastLevels.includes(offering.roastLevel)) matchedDimensions += 1;
  }
  if (request.brewMethods.length > 0) {
    requestedDimensions += 1;
    if (request.brewMethods.some((method) => offering.brewMethods.includes(method))) matchedDimensions += 1;
  }
  return { offering, requestedDimensions, matchedDimensions };
}

function findBestOffering(request: ParsedTravelerRequest, cafe: Cafe): OfferingMatch {
  const eligible = cafe.offerings.filter(
    (offering) => offering.approvedForPublic && offering.availability.status !== "unavailable",
  );
  const matches = eligible.map((offering) => countOfferingMatches(request, offering));
  matches.sort((a, b) => {
    const ratioA = a.requestedDimensions === 0 ? 0 : a.matchedDimensions / a.requestedDimensions;
    const ratioB = b.requestedDimensions === 0 ? 0 : b.matchedDimensions / b.requestedDimensions;
    return ratioB - ratioA || b.matchedDimensions - a.matchedDimensions || (a.offering?.id ?? "").localeCompare(b.offering?.id ?? "");
  });
  return matches[0] ?? { requestedDimensions: 0, matchedDimensions: 0 };
}

function scoreTaste(match: OfferingMatch): ScoreComponent {
  if (match.requestedDimensions === 0) {
    return component(
      "taste-fit",
      10,
      SCORE_WEIGHTS.tasteFit,
      { th: "ยังไม่ได้เลือกโทนรส ระดับคั่ว หรือวิธีชง จึงให้คะแนนกลาง", en: "No taste, roast, or brew preference was selected, so this receives a neutral score." },
      match.offering ? [match.offering.id] : [],
    );
  }
  const ratio = match.matchedDimensions / match.requestedDimensions;
  const score = ratio === 0 ? 1 : ratio * SCORE_WEIGHTS.tasteFit;
  return component(
    "taste-fit",
    score,
    SCORE_WEIGHTS.tasteFit,
    {
      th: match.offering
        ? `${match.offering.name.th} ตรง ${match.matchedDimensions} จาก ${match.requestedDimensions} ด้านที่เลือก`
        : "ไม่พบเมล็ดที่อนุมัติและพร้อมเสิร์ฟซึ่งตรงกับความชอบ",
      en: match.offering
        ? `${match.offering.name.en} matches ${match.matchedDimensions} of ${match.requestedDimensions} selected preference dimensions.`
        : "No approved, available offering matches the selected preferences.",
    },
    match.offering ? [match.offering.id] : [],
  );
}

function scoreDetour(travel: TravelContext): ScoreComponent {
  if (travel.minutes === undefined) {
    return component(
      "detour-fit",
      5,
      SCORE_WEIGHTS.detourFit,
      { th: "ไม่มีเวลาเดินทางที่ตรงกัน จึงยังยืนยันระยะอ้อมไม่ได้", en: "No matching travel estimate is stored, so the detour cannot be confirmed." },
    );
  }
  const score = travel.minutes <= 5 ? 15 : travel.minutes <= 10 ? 12 : travel.minutes <= 15 ? 9 : travel.minutes <= 25 ? 5 : 1;
  return component(
    "detour-fit",
    score,
    SCORE_WEIGHTS.detourFit,
    {
      th: `ระยะอ้อมประมาณ ${travel.minutes} นาทีต่อเที่ยว (${travel.basis === "stored-route" ? "ข้อมูลสาธิตที่บันทึกไว้" : "คำนวณเส้นตรง"})`,
      en: `Estimated detour is ${travel.minutes} minutes each way (${travel.basis === "stored-route" ? "stored demo estimate" : "straight-line estimate"}).`,
    },
    travel.route ? [travel.route.anchorId] : [],
  );
}

function scoreAvailability(cafe: Cafe, offering?: CoffeeOffering): ScoreComponent {
  if (cafe.opening.snapshotStatus === "scheduled-closed") {
    return component(
      "availability",
      2,
      SCORE_WEIGHTS.availability,
      { th: "สแนปช็อตสาธิตระบุว่าร้านปิดตามตาราง โปรดตรวจสอบก่อนเดินทาง", en: "The demo snapshot says the cafe is scheduled closed; recheck before travel." },
      [cafe.id],
    );
  }
  const status = offering?.availability.status ?? "unknown";
  const score = status === "available" ? 15 : status === "limited" ? 11 : status === "unknown" ? 5 : 0;
  const statusTh = status === "available" ? "พร้อมเสิร์ฟ" : status === "limited" ? "มีจำนวนจำกัด" : status === "unavailable" ? "หมด" : "ไม่ทราบ";
  return component(
    "availability",
    score,
    SCORE_WEIGHTS.availability,
    {
      th: `สถานะเมล็ดในสแนปช็อต: ${statusTh}${offering ? ` (${offering.availability.asOf})` : ""}`,
      en: `Offering snapshot status: ${status}${offering ? ` (as of ${offering.availability.asOf})` : ""}.`,
    },
    offering ? [offering.id] : [],
  );
}

function scoreBadges(cafe: Cafe): ScoreComponent {
  const badgePoints: Record<CafeBadge, number> = {
    "nan-grown-beans": 4,
    "nan-roasted": 2,
    "workation-friendly": 2,
    "new-discovery": 2,
  };
  const score = cafe.badges.reduce((sum, badge) => sum + badgePoints[badge], 0);
  const labels = cafe.badges.map((badge) => BADGE_LABELS[badge]);
  return component(
    "badges",
    score,
    SCORE_WEIGHTS.badges,
    labels.length > 0
      ? { th: `ป้ายจากข้อมูลที่เก็บไว้: ${labels.map((label) => label.th).join(", ")}`, en: `Stored-data badges: ${labels.map((label) => label.en).join(", ")}.` }
      : { th: "ยังไม่มีป้ายที่ผ่านเกณฑ์ข้อมูล", en: "No data-backed badges are present." },
    cafe.badges.map((badge) => `badge:${cafe.id}:${badge}`),
  );
}

function scoreWorkation(request: ParsedTravelerRequest, cafe: Cafe): ScoreComponent {
  if (!request.useCases.includes("work")) {
    return component(
      "workation-fit",
      5,
      SCORE_WEIGHTS.workationFit,
      { th: "ไม่ได้เลือกการทำงาน จึงให้คะแนนด้านเวิร์กเคชันเป็นกลาง", en: "Work was not selected, so workation fit receives a neutral score." },
    );
  }
  const details = cafe.workation;
  if (!details) {
    return component(
      "workation-fit",
      0,
      SCORE_WEIGHTS.workationFit,
      { th: "ร้านยังไม่มีรายละเอียดเวิร์กเคชันครบถ้วน", en: "The cafe does not have complete workation details." },
    );
  }
  let score = 0;
  if (details.wifi.availability === "available") score += 3;
  if (details.outlets === "at-most-seats" || details.outlets === "some") score += 2;
  if (details.workSeating === "good") score += 2;
  else if (details.workSeating === "possible") score += 1;
  if (details.videoCalls === "good" || details.videoCalls === "possible") score += 1;
  if (details.speedReports.length > 0) score += 1;
  if (details.communityWorkVerifiedAt) score += 1;
  return component(
    "workation-fit",
    score,
    SCORE_WEIGHTS.workationFit,
    {
      th: `มีข้อมูล Wi-Fi (${details.wifi.availability}) ปลั๊ก (${details.outlets}) และที่นั่งทำงาน (${details.workSeating}); ความเร็วที่รายงานไม่ใช่การรับประกัน`,
      en: `Has Wi-Fi (${details.wifi.availability}), outlet (${details.outlets}), and work-seating (${details.workSeating}) data; reported speed is not a guarantee.`,
    },
    [`workation:${cafe.id}`, ...details.speedReports.map((report) => report.id)],
  );
}

function buildWhy(
  request: ParsedTravelerRequest,
  cafe: Cafe,
  match: OfferingMatch,
  travel: TravelContext,
): LocalizedText[] {
  const reasons: LocalizedText[] = [];
  if (match.offering && match.matchedDimensions > 0) {
    reasons.push({
      th: `${match.offering.name.th} ตรงกับความชอบ ${match.matchedDimensions} ด้าน และสถานะคือ ${match.offering.availability.status} ณ ${match.offering.availability.asOf}`,
      en: `${match.offering.name.en} matches ${match.matchedDimensions} preference dimensions and was marked ${match.offering.availability.status} as of ${match.offering.availability.asOf}.`,
    });
  }
  if (travel.minutes !== undefined) {
    reasons.push({
      th: `ใช้เวลาประมาณ ${travel.minutes} นาทีจาก${travel.anchorName?.th ?? "จุดในแผน"} ตาม${travel.basis === "stored-route" ? "ค่าประมาณสาธิต" : "การคำนวณเส้นตรง"}`,
      en: `It is about ${travel.minutes} minutes from ${travel.anchorName?.en ?? "a planned stop"} using a ${travel.basis === "stored-route" ? "stored demo" : "straight-line"} estimate.`,
    });
  }
  if (request.useCases.includes("work") && cafe.workation) {
    reasons.push({
      th: `มีรายละเอียดการทำงาน: Wi-Fi ${cafe.workation.wifi.availability}, ปลั๊ก ${cafe.workation.outlets}, ที่นั่ง ${cafe.workation.workSeating}`,
      en: `Work details are present: Wi-Fi ${cafe.workation.wifi.availability}, outlets ${cafe.workation.outlets}, seating ${cafe.workation.workSeating}.`,
    });
  }
  if (cafe.badges.includes("nan-grown-beans")) {
    reasons.push({
      th: "สแนปช็อตข้อมูลสมมติมีเมล็ดที่ระบุว่าปลูกในน่าน (ไม่ใช่ข้อเท็จจริงของร้านจริง)",
      en: "The fictional snapshot includes a bean marked Nan-grown (not a claim about a real cafe).",
    });
  }
  if (cafe.badges.includes("new-discovery")) {
    reasons.push({ th: "ป้ายร้านค้นพบใหม่ช่วยให้ร้านที่ยังไม่มีรีวิวจำนวนมากไม่เสียเปรียบ", en: "The New discovery badge prevents low review volume from becoming a penalty." });
  }
  return reasons.slice(0, 4);
}

function buildCautions(cafe: Cafe, travel: TravelContext): LocalizedText[] {
  const cautions: LocalizedText[] = [];
  if (cafe.provenance.isFictional) cautions.push(cafe.provenance.disclaimer ?? cafe.provenance.displayLabel);
  cautions.push({
    th: `เวลาเปิดและความพร้อมเป็นสแนปช็อต ณ ${cafe.opening.statusAsOf} ไม่ใช่สถานะสด`,
    en: `Hours and availability are a snapshot as of ${cafe.opening.statusAsOf}, not live status.`,
  });
  if (travel.route) cautions.push(travel.route.provenance.disclaimer ?? travel.route.provenance.displayLabel);
  if (cafe.workation?.speedReports.some((report) => report.trust === "merchant-reported")) {
    cautions.push({ th: "ความเร็วอินเทอร์เน็ตที่ร้านรายงานไม่ใช่การรับประกันความเสถียร", en: "Merchant-reported internet speed is not a stability guarantee." });
  }
  return cautions;
}

function rankOne(
  request: ParsedTravelerRequest,
  cafe: Cafe,
  links: readonly CafeUnseenLink[],
): Omit<RankedCafe, "rank"> {
  const travel = resolveTravelContext(cafe, request);
  const match = findBestOffering(request, cafe);
  const components = [
    scoreRoute(travel, cafe),
    scoreTime(request, cafe, travel),
    scoreTaste(match),
    scoreDetour(travel),
    scoreAvailability(cafe, match.offering),
    scoreBadges(cafe),
    scoreWorkation(request, cafe),
  ];
  const total = clampScore(components.reduce((sum, item) => sum + item.score, 0), 100);
  const score: ScoreBreakdown = { total, maxTotal: 100, components, algorithmVersion: RANKING_ALGORITHM_VERSION };
  const whyThisFits = buildWhy(request, cafe, match, travel);
  const summary = whyThisFits[0] ?? {
    th: "แนะนำจากคะแนนความเหมาะสมเชิงโครงสร้าง โปรดตรวจสอบรายละเอียดก่อนเดินทาง",
    en: "Recommended from the structured fit score; verify details before travel.",
  };
  const unseenNearbyIds = request.wantsUnseen
    ? links
        .filter((link) => link.cafeId === cafe.id && link.approvedForPublic)
        .sort((a, b) => a.travelMinutes - b.travelMinutes || a.unseenPlaceId.localeCompare(b.unseenPlaceId))
        .slice(0, 3)
        .map((link) => link.unseenPlaceId)
    : [];
  return {
    cafe,
    score,
    summary,
    whyThisFits,
    cautions: buildCautions(cafe, travel),
    matchedOfferingIds: match.offering && match.matchedDimensions > 0 ? [match.offering.id] : [],
    ...(travel.route ? { detourEstimate: travel.route } : {}),
    unseenNearbyIds,
  };
}

/**
 * Ranks only published records. There is no random, review-count, or LLM input,
 * so identical structured inputs always produce an identical result.
 */
export function rankCafes(
  request: ParsedTravelerRequest,
  cafes: readonly Cafe[],
  options: RankCafesOptions = {},
): RankedCafe[] {
  const links = options.cafeUnseenLinks ?? [];
  const limit = Math.max(0, Math.floor(options.limit ?? cafes.length));
  return cafes
    .filter((cafe) => cafe.published)
    .map((cafe) => rankOne(request, cafe, links))
    .sort((a, b) => b.score.total - a.score.total || a.cafe.id.localeCompare(b.cafe.id))
    .slice(0, limit)
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

export const recommendCafes = rankCafes;
