import { buildMerchantDraft } from "../domain/merchant";
import type {
  Cafe,
  CafeOwnership,
  CafeUnseenLink,
  CheckIn,
  DailyOpeningHours,
  DataProvenance,
  DayOfWeek,
  Review,
  UnseenPlace,
} from "../domain/types";

export const DEMO_SNAPSHOT_AT = "2026-07-11T09:00:00+07:00";
export const UNSEEN_SOURCES_CHECKED_AT = "2026-07-11T12:00:00+07:00";

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function allDays(opensAt: string, closesAt: string): DailyOpeningHours[] {
  return DAYS.map((day) => ({ day, intervals: [{ opensAt, closesAt }] }));
}

function fictionalProvenance(sourceName: string): DataProvenance {
  return {
    kind: "fictional-demo",
    displayLabel: {
      th: "ข้อมูลสมมติสำหรับทดสอบ — ไม่ใช่ร้านหรือข้อเท็จจริงที่ยืนยันแล้ว",
      en: "Fictional demo data — not a real or verified cafe fact",
    },
    sourceName,
    capturedAt: DEMO_SNAPSHOT_AT,
    isFictional: true,
    disclaimer: {
      th: "ชื่อร้าน พิกัด เมนู เมล็ด เวลาเปิด ความเร็วอินเทอร์เน็ต และเวลาเดินทางของร้านนี้สร้างขึ้นเพื่อสาธิตเท่านั้น ห้ามใช้วางแผนเดินทางจริง",
      en: "This cafe's name, pin, menu, beans, hours, internet report, and travel times are fictional and must not be used for real-world travel.",
    },
  };
}

function fictionalRouteProvenance(cafeLabel: string): DataProvenance {
  return {
    ...fictionalProvenance(`Deterministic route fixture for ${cafeLabel}`),
    displayLabel: {
      th: "เวลาเดินทางสมมติสำหรับเดโม — ไม่ใช่เส้นทางสด",
      en: "Fictional demo travel estimate — not live routing",
    },
  };
}

const watPhumin = { th: "วัดภูมินทร์", en: "Wat Phumin" };

/**
 * Exactly three fictional shops for application testing. None represents an
 * actual Nan business, address, current offering, or connectivity claim.
 */
export const demoCafes = [
  {
    id: "cafe-demo-khuang-cloud",
    slug: "demo-khuang-cloud-coffee-lab",
    name: { th: "ข่วงคลาวด์ คอฟฟี่แล็บ (ร้านสมมติ)", en: "Khuang Cloud Coffee Lab (Fictional demo)" },
    story: {
      th: "สถานการณ์จำลองของสโลว์บาร์สายฟรุตตี้ใกล้ย่านเมืองเก่า ใช้ทดสอบเส้นทางและป้ายเมล็ดปลูกในน่าน",
      en: "A fictional fruity slow-bar scenario used to test Old Town routing and the Nan-grown bean badge.",
    },
    address: {
      th: "พิกัดสมมติใกล้ย่านหัวข่วง อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง",
      en: "Fictional pin near the Hua Khuang area, Mueang Nan — no real storefront",
    },
    areaId: "nan-old-town",
    coordinates: { latitude: 18.77702, longitude: 100.77094 },
    opening: {
      timezone: "Asia/Bangkok",
      weeklyHours: allDays("08:00", "17:00"),
      snapshotStatus: "scheduled-open",
      statusAsOf: DEMO_SNAPSHOT_AT,
      statusBasis: "demo-snapshot",
      note: { th: "เวลาสมมติสำหรับทดสอบ ไม่ใช่เวลาเปิดของร้านจริง", en: "Fictional test hours, not live hours for a real cafe." },
    },
    badges: ["nan-grown-beans", "nan-roasted", "workation-friendly"],
    recommendedVisitMinutes: 50,
    routeEstimates: [
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "walk",
        estimatedMinutes: 6,
        estimatedDistanceKm: 0.45,
        provenance: fictionalRouteProvenance("Khuang Cloud Coffee Lab"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "car",
        estimatedMinutes: 4,
        estimatedDistanceKm: 0.7,
        provenance: fictionalRouteProvenance("Khuang Cloud Coffee Lab"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "bicycle",
        estimatedMinutes: 3,
        estimatedDistanceKm: 0.5,
        provenance: fictionalRouteProvenance("Khuang Cloud Coffee Lab"),
      },
    ],
    offerings: [
      {
        id: "offering-demo-huai-ton-natural",
        cafeId: "cafe-demo-khuang-cloud",
        name: { th: "บ้านห้วยโท้น ล็อตเดโม N01", en: "Ban Huai Ton Demo Lot N01" },
        origin: {
          country: "Thailand",
          province: "Nan",
          locality: "Fictional demo lot",
          farmOrCommunity: "Ban Huai Ton (scenario label only)",
          producer: "Demo producer — not a real sourcing claim",
        },
        process: "natural",
        roastLevel: "light",
        tastingNotes: [
          { th: "สตรอว์เบอร์รี (สมมติ)", en: "strawberry (fictional)" },
          { th: "ช็อกโกแลต (สมมติ)", en: "chocolate (fictional)" },
        ],
        tasteProfiles: ["fruity", "chocolatey"],
        brewMethods: ["filter", "aeropress"],
        priceFrom: { amount: 120, currency: "THB" },
        availability: {
          status: "available",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะพร้อมเสิร์ฟเป็นสถานการณ์สมมติ", en: "Availability is part of the fictional demo scenario." },
          provenance: fictionalProvenance("Demo merchant offering fixture"),
        },
        approvedForPublic: true,
        updatedAt: DEMO_SNAPSHOT_AT,
        provenance: fictionalProvenance("Demo merchant offering fixture"),
      },
    ],
    menu: [
      {
        id: "menu-demo-cloud-filter",
        cafeId: "cafe-demo-khuang-cloud",
        name: { th: "ฟิลเตอร์ประจำร้าน (สมมติ)", en: "House filter (fictional)" },
        description: { th: "เมนูทดสอบสำหรับแสดง Cafe pick", en: "Test menu item for the Cafe pick label." },
        price: { amount: 120, currency: "THB" },
        availability: {
          status: "available",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะเมนูสมมติ", en: "Fictional menu status." },
          provenance: fictionalProvenance("Demo menu fixture"),
        },
        isCafePick: true,
        approvedForPublic: true,
        provenance: fictionalProvenance("Demo menu fixture"),
      },
    ],
    workation: {
      cafeId: "cafe-demo-khuang-cloud",
      wifi: {
        availability: "available",
        declaredAt: DEMO_SNAPSHOT_AT,
        trustLabel: "wifi-available",
        provenance: fictionalProvenance("Demo merchant Wi-Fi declaration"),
      },
      speedReports: [
        {
          id: "speed-demo-khuang-cloud-01",
          downloadMbps: 86,
          uploadMbps: 31,
          pingMs: 18,
          testedAt: "2026-07-10T14:30:00+07:00",
          trust: "merchant-reported",
          verificationStatus: "demo-only",
          nonGuaranteeNotice: {
            th: "ตัวเลขสมมติที่ร้านในสถานการณ์เดโมรายงาน ไม่รับประกันความเร็วหรือความเสถียร",
            en: "A fictional merchant-reported number; it does not guarantee speed or stability.",
          },
          provenance: fictionalProvenance("Demo speed report fixture"),
        },
      ],
      outlets: "some",
      workSeating: "good",
      videoCalls: "possible",
      quietness: "mixed",
      policy: { th: "นั่งทำงานได้ 2 ชั่วโมงเมื่อสั่งเครื่องดื่ม 1 รายการ (นโยบายสมมติ)", en: "Two-hour work seating with one drink (fictional policy)." },
      minimumSpend: { amount: 100, currency: "THB" },
      updatedAt: DEMO_SNAPSHOT_AT,
      provenance: fictionalProvenance("Demo workation fixture"),
    },
    highlights: [
      {
        kind: "cafe-pick",
        offeringOrMenuItemId: "menu-demo-cloud-filter",
        explanation: { th: "Cafe pick ในสถานการณ์เดโมจากข้อมูลเมนูสมมติ", en: "A simulated Cafe pick backed only by the fictional menu fixture." },
        source: "fictional-demo-scenario",
        provenance: fictionalProvenance("Demo highlight fixture"),
      },
    ],
    published: true,
    updatedAt: DEMO_SNAPSHOT_AT,
    provenance: fictionalProvenance("Nan Coffee local demo seed"),
  },
  {
    id: "cafe-demo-golden-loom",
    slug: "demo-golden-loom-workroom",
    name: { th: "โกลเดนลูม เวิร์กรูม (ร้านสมมติ)", en: "Golden Loom Workroom (Fictional demo)" },
    story: {
      th: "ร้านสมมติที่เน้นเมล็ดบาลานซ์และรายละเอียดพื้นที่ทำงานครบ ใช้ทดสอบการค้นหาเวิร์กเคชัน",
      en: "A fictional balanced-coffee cafe with complete work details, designed to test workation discovery.",
    },
    address: {
      th: "พิกัดสมมติใกล้ย่านศรีพันต้น อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง",
      en: "Fictional pin near the Si Phan Ton area, Mueang Nan — no real storefront",
    },
    areaId: "nan-old-town",
    coordinates: { latitude: 18.77631, longitude: 100.76632 },
    opening: {
      timezone: "Asia/Bangkok",
      weeklyHours: allDays("09:00", "19:00"),
      snapshotStatus: "scheduled-open",
      statusAsOf: DEMO_SNAPSHOT_AT,
      statusBasis: "demo-snapshot",
      note: { th: "เวลาสมมติสำหรับทดสอบ ไม่ใช่เวลาเปิดของร้านจริง", en: "Fictional test hours, not live hours for a real cafe." },
    },
    badges: ["nan-roasted", "workation-friendly", "new-discovery"],
    recommendedVisitMinutes: 90,
    routeEstimates: [
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "walk",
        estimatedMinutes: 10,
        estimatedDistanceKm: 0.8,
        provenance: fictionalRouteProvenance("Golden Loom Workroom"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "car",
        estimatedMinutes: 5,
        estimatedDistanceKm: 1,
        provenance: fictionalRouteProvenance("Golden Loom Workroom"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "bicycle",
        estimatedMinutes: 5,
        estimatedDistanceKm: 0.8,
        provenance: fictionalRouteProvenance("Golden Loom Workroom"),
      },
    ],
    offerings: [
      {
        id: "offering-demo-golden-washed",
        cafeId: "cafe-demo-golden-loom",
        name: { th: "โกลเดนบาลานซ์ ล็อตเดโม W02", en: "Golden Balance Demo Lot W02" },
        origin: { country: "Thailand", province: "Chiang Rai", producer: "Demo producer — not a real sourcing claim" },
        process: "washed",
        roastLevel: "medium",
        tastingNotes: [
          { th: "คาราเมล (สมมติ)", en: "caramel (fictional)" },
          { th: "อัลมอนด์ (สมมติ)", en: "almond (fictional)" },
        ],
        tasteProfiles: ["caramel", "nutty"],
        brewMethods: ["filter", "espresso"],
        priceFrom: { amount: 105, currency: "THB" },
        availability: {
          status: "limited",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะจำนวนจำกัดเป็นสถานการณ์สมมติ", en: "Limited status is part of the fictional scenario." },
          provenance: fictionalProvenance("Demo merchant offering fixture"),
        },
        approvedForPublic: true,
        updatedAt: DEMO_SNAPSHOT_AT,
        provenance: fictionalProvenance("Demo merchant offering fixture"),
      },
    ],
    menu: [
      {
        id: "menu-demo-golden-flat-white",
        cafeId: "cafe-demo-golden-loom",
        name: { th: "แฟลตไวต์บาลานซ์ (สมมติ)", en: "Balanced flat white (fictional)" },
        description: { th: "เมนูสมมติสำหรับทดสอบ", en: "Fictional menu fixture." },
        price: { amount: 95, currency: "THB" },
        availability: {
          status: "available",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะเมนูสมมติ", en: "Fictional menu status." },
          provenance: fictionalProvenance("Demo menu fixture"),
        },
        isCafePick: true,
        approvedForPublic: true,
        provenance: fictionalProvenance("Demo menu fixture"),
      },
    ],
    workation: {
      cafeId: "cafe-demo-golden-loom",
      wifi: {
        availability: "available",
        declaredAt: DEMO_SNAPSHOT_AT,
        trustLabel: "wifi-available",
        provenance: fictionalProvenance("Demo merchant Wi-Fi declaration"),
      },
      speedReports: [
        {
          id: "speed-demo-golden-loom-01",
          downloadMbps: 122,
          uploadMbps: 47,
          pingMs: 14,
          testedAt: "2026-07-09T11:00:00+07:00",
          trust: "merchant-reported",
          verificationStatus: "demo-only",
          nonGuaranteeNotice: {
            th: "ตัวเลขสมมติที่ร้านในสถานการณ์เดโมรายงาน ไม่รับประกันความเร็วหรือความเสถียร",
            en: "A fictional merchant-reported number; it does not guarantee speed or stability.",
          },
          provenance: fictionalProvenance("Demo speed report fixture"),
        },
      ],
      outlets: "at-most-seats",
      workSeating: "good",
      videoCalls: "good",
      quietness: "quiet",
      policy: { th: "โซนทำงานสมมติ: โปรดใช้หูฟังสำหรับคอล", en: "Fictional work-zone policy: use headphones for calls." },
      minimumSpend: { amount: 120, currency: "THB" },
      updatedAt: DEMO_SNAPSHOT_AT,
      provenance: fictionalProvenance("Demo workation fixture"),
    },
    highlights: [
      {
        kind: "traveler-favorite",
        offeringOrMenuItemId: "menu-demo-golden-flat-white",
        explanation: {
          th: "ป้าย Traveler favorite จำลองเพื่อทดสอบ UI ไม่ได้มาจากรีวิวของผู้เดินทางจริง",
          en: "Simulated Traveler favorite label for UI testing; it is not based on real traveler reviews.",
        },
        source: "fictional-demo-scenario",
        provenance: fictionalProvenance("Demo highlight fixture"),
      },
    ],
    published: true,
    updatedAt: DEMO_SNAPSHOT_AT,
    provenance: fictionalProvenance("Nan Coffee local demo seed"),
  },
  {
    id: "cafe-demo-cocoa-corner",
    slug: "demo-fong-kham-cocoa-corner",
    name: { th: "ฟองคำ โกโก้คอร์เนอร์ (ร้านสมมติ)", en: "Fong Kham Cocoa Corner (Fictional demo)" },
    story: {
      th: "ร้านสมมติสำหรับคนชอบกาแฟโทนช็อกโกแลตและแวะรับเร็ว ไม่มีการอ้างว่ามีพื้นที่ทำงาน",
      en: "A fictional chocolate-forward quick-stop cafe with no workation claim.",
    },
    address: {
      th: "พิกัดสมมติใกล้ย่านบ้านพระเกิด อำเภอเมืองน่าน — ไม่มีหน้าร้านจริง",
      en: "Fictional pin near the Ban Phra Koet area, Mueang Nan — no real storefront",
    },
    areaId: "ban-phra-koet-demo-area",
    coordinates: { latitude: 18.78919, longitude: 100.78493 },
    opening: {
      timezone: "Asia/Bangkok",
      weeklyHours: allDays("07:30", "16:30"),
      snapshotStatus: "scheduled-open",
      statusAsOf: DEMO_SNAPSHOT_AT,
      statusBasis: "demo-snapshot",
      note: { th: "เวลาสมมติสำหรับทดสอบ ไม่ใช่เวลาเปิดของร้านจริง", en: "Fictional test hours, not live hours for a real cafe." },
    },
    badges: ["new-discovery"],
    recommendedVisitMinutes: 25,
    routeEstimates: [
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "walk",
        estimatedMinutes: 28,
        estimatedDistanceKm: 2.2,
        provenance: fictionalRouteProvenance("Fong Kham Cocoa Corner"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "car",
        estimatedMinutes: 11,
        estimatedDistanceKm: 2.5,
        provenance: fictionalRouteProvenance("Fong Kham Cocoa Corner"),
      },
      {
        anchorId: "wat-phumin",
        anchorName: watPhumin,
        transport: "bicycle",
        estimatedMinutes: 12,
        estimatedDistanceKm: 2.2,
        provenance: fictionalRouteProvenance("Fong Kham Cocoa Corner"),
      },
    ],
    offerings: [
      {
        id: "offering-demo-cocoa-comfort",
        cafeId: "cafe-demo-cocoa-corner",
        name: { th: "โกโก้คอมฟอร์ต ล็อตเดโม E03", en: "Cocoa Comfort Demo Lot E03" },
        origin: { country: "Thailand", province: "Unknown in demo", producer: "Demo producer — not a real sourcing claim" },
        process: "washed",
        roastLevel: "medium-dark",
        tastingNotes: [
          { th: "ช็อกโกแลต (สมมติ)", en: "chocolate (fictional)" },
          { th: "คาราเมล (สมมติ)", en: "caramel (fictional)" },
        ],
        tasteProfiles: ["chocolatey", "caramel"],
        brewMethods: ["espresso"],
        priceFrom: { amount: 75, currency: "THB" },
        availability: {
          status: "available",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะพร้อมเสิร์ฟเป็นสถานการณ์สมมติ", en: "Availability is part of the fictional demo scenario." },
          provenance: fictionalProvenance("Demo merchant offering fixture"),
        },
        approvedForPublic: true,
        updatedAt: DEMO_SNAPSHOT_AT,
        provenance: fictionalProvenance("Demo merchant offering fixture"),
      },
    ],
    menu: [
      {
        id: "menu-demo-cocoa-takeaway",
        cafeId: "cafe-demo-cocoa-corner",
        name: { th: "อเมริกาโน่รับเร็ว (สมมติ)", en: "Quick-pickup Americano (fictional)" },
        description: { th: "เมนูสมมติสำหรับทดสอบ quick takeaway", en: "Fictional fixture for the quick-takeaway use case." },
        price: { amount: 70, currency: "THB" },
        availability: {
          status: "available",
          asOf: DEMO_SNAPSHOT_AT,
          note: { th: "สถานะเมนูสมมติ", en: "Fictional menu status." },
          provenance: fictionalProvenance("Demo menu fixture"),
        },
        isCafePick: true,
        approvedForPublic: true,
        provenance: fictionalProvenance("Demo menu fixture"),
      },
    ],
    highlights: [
      {
        kind: "cafe-pick",
        offeringOrMenuItemId: "menu-demo-cocoa-takeaway",
        explanation: { th: "Cafe pick จำลองสำหรับทดสอบ ไม่ใช่คำแนะนำจากร้านจริง", en: "A simulated Cafe pick for testing, not a real merchant recommendation." },
        source: "fictional-demo-scenario",
        provenance: fictionalProvenance("Demo highlight fixture"),
      },
    ],
    published: true,
    updatedAt: DEMO_SNAPSHOT_AT,
    provenance: fictionalProvenance("Nan Coffee local demo seed"),
  },
] satisfies Cafe[];

/** Real places, source-checked on 2026-07-11; access/opening is intentionally not live. */
export const demoUnseenPlaces = [
  {
    id: "unseen-wat-hua-khuang",
    name: { th: "วัดหัวข่วง", en: "Wat Hua Khuang" },
    category: "culture",
    description: {
      th: "ททท. ระบุวัดหัวข่วงเป็นจุดวัฒนธรรมในเส้นทางเดินข่วงเมืองน่าน และกล่าวถึงศิลปะล้านนา",
      en: "TAT includes Wat Hua Khuang in its Nan Old Town cultural walking context and describes Lanna architectural details.",
    },
    coordinates: { latitude: 18.77717, longitude: 100.77133 },
    openingOrAccessContext: {
      th: "ไม่มีข้อมูลเวลาเปิดสด ควรตรวจสอบอีกครั้งก่อนเดินทางและแต่งกายสุภาพตามมารยาทวัด",
      en: "No live opening hours are available. Recheck before visiting and follow temple dress and etiquette guidance.",
    },
    weatherOrAccessNotes: {
      th: "พื้นที่วัด โปรดเคารพกิจกรรมทางศาสนาและตรวจสอบการเข้าถึง ณ วันเดินทาง",
      en: "Temple grounds: respect religious activity and confirm access on the day of travel.",
    },
    verificationStatus: "official-verified",
    provenance: {
      kind: "official-source",
      displayLabel: { th: "สถานที่จริง — ตรวจแหล่งข้อมูลเมื่อ 11 ก.ค. 2026; ไม่มีสถานะเปิดสด", en: "Real place — sources checked 11 Jul 2026; no live opening status" },
      sourceName: "Tourism Authority of Thailand: Nan 24 hrs",
      sourceUrl: "https://thai.tourismthailand.org/Articles/nan-24-hrs",
      additionalSources: [
        { label: "Wikidata Q13020887 coordinate corroboration", url: "https://www.wikidata.org/wiki/Q13020887", role: "coordinate-corroboration" },
      ],
      capturedAt: UNSEEN_SOURCES_CHECKED_AT,
      verifiedAt: UNSEEN_SOURCES_CHECKED_AT,
      isFictional: false,
      disclaimer: { th: "การตรวจแหล่งข้อมูลไม่ใช่การยืนยันเวลาเปิดหรือการเข้าถึงแบบเรียลไทม์", en: "Source checking does not verify live opening hours or real-time access." },
    },
  },
  {
    id: "unseen-wat-si-phan-ton",
    name: { th: "วัดศรีพันต้น", en: "Wat Si Phan Ton" },
    category: "culture",
    description: {
      th: "ททท. ระบุวัดศรีพันต้นเป็นหนึ่งในจุดวัดสำคัญของเส้นทางรถรางเมืองน่าน",
      en: "TAT lists Wat Si Phan Ton among the temple stops in Nan's municipal tram itinerary.",
    },
    coordinates: { latitude: 18.77598062, longitude: 100.76572753 },
    openingOrAccessContext: {
      th: "ไม่มีสถานะเปิดสด แม้แหล่งข้อมูลรองจะระบุเวลาไว้ ควรตรวจสอบกับสถานที่อีกครั้งก่อนเดินทาง",
      en: "There is no live opening status. A secondary source lists hours, but recheck directly before visiting.",
    },
    weatherOrAccessNotes: {
      th: "พื้นที่วัด โปรดแต่งกายสุภาพ ถอดรองเท้าก่อนเข้าอาคารตามป้าย และเคารพกิจกรรมทางศาสนา",
      en: "Temple grounds: dress respectfully, follow shoe-removal signs, and respect religious activity.",
    },
    verificationStatus: "official-verified",
    provenance: {
      kind: "official-source",
      displayLabel: { th: "สถานที่จริง — ตรวจแหล่งข้อมูลเมื่อ 11 ก.ค. 2026; ไม่มีสถานะเปิดสด", en: "Real place — sources checked 11 Jul 2026; no live opening status" },
      sourceName: "Tourism Authority of Thailand: Nan 24 hrs",
      sourceUrl: "https://thai.tourismthailand.org/Articles/nan-24-hrs",
      additionalSources: [
        { label: "Thailandee coordinate corroboration", url: "https://www.thailandee.com/en/visit-thailand/wat-sri-panton-nan-251", role: "coordinate-corroboration" },
      ],
      capturedAt: UNSEEN_SOURCES_CHECKED_AT,
      verifiedAt: UNSEEN_SOURCES_CHECKED_AT,
      isFictional: false,
      disclaimer: { th: "การตรวจแหล่งข้อมูลไม่ใช่การยืนยันเวลาเปิดหรือการเข้าถึงแบบเรียลไทม์", en: "Source checking does not verify live opening hours or real-time access." },
    },
  },
  {
    id: "unseen-hong-chao-fong-kham",
    name: { th: "โฮงเจ้าฟองคำ", en: "Hong Chao Fong Kham" },
    category: "craft",
    description: {
      th: "ททท. กล่าวถึงเรือนเก่าแห่งนี้ในบริบทวัฒนธรรมน่านและการสาธิตศิลปหัตถกรรม",
      en: "TAT describes this historic noble house in Nan's cultural context and notes art and craft demonstrations.",
    },
    coordinates: { latitude: 18.789618, longitude: 100.785608 },
    openingOrAccessContext: {
      th: "เวลาเข้าชมพิพิธภัณฑ์จากบทความเก่าอาจเปลี่ยนแปลง ต้องตรวจสอบอีกครั้งก่อนเดินทาง ไม่มีสถานะเปิดสด",
      en: "Museum access hours in an older article may have changed. Recheck before travel; no live opening status is provided.",
    },
    weatherOrAccessNotes: {
      th: "เป็นพื้นที่เรือนและพิพิธภัณฑ์ โปรดตรวจสอบวันปิด กิจกรรม และข้อจำกัดการเข้าถึงล่วงหน้า",
      en: "House/museum setting: confirm closure days, activities, and access restrictions in advance.",
    },
    verificationStatus: "official-verified",
    provenance: {
      kind: "official-source",
      displayLabel: { th: "สถานที่จริง — ตรวจแหล่งข้อมูลเมื่อ 11 ก.ค. 2026; เวลาเข้าชมต้องตรวจซ้ำ", en: "Real place — sources checked 11 Jul 2026; museum access must be rechecked" },
      sourceName: "Tourism Authority of Thailand: Nan and Phayao",
      sourceUrl: "https://www.tourismthailand.org/Articles/nan-and-phayao-cheap-but-charming-havens-2",
      additionalSources: [
        { label: "MThai coordinate corroboration", url: "https://travel.mthai.com/blog/136628.html", role: "coordinate-corroboration" },
      ],
      capturedAt: UNSEEN_SOURCES_CHECKED_AT,
      verifiedAt: UNSEEN_SOURCES_CHECKED_AT,
      isFictional: false,
      disclaimer: { th: "บทความอ้างอิงไม่ใช่สถานะการเข้าชมแบบเรียลไทม์", en: "The cited articles are not a real-time access source." },
    },
  },
] satisfies UnseenPlace[];

export const demoCafeUnseenLinks = [
  {
    cafeId: "cafe-demo-khuang-cloud",
    unseenPlaceId: "unseen-wat-hua-khuang",
    travelMinutes: 2,
    transport: "walk",
    distanceKm: 0.1,
    approvedForPublic: true,
    provenance: fictionalRouteProvenance("Khuang Cloud to Wat Hua Khuang"),
  },
  {
    cafeId: "cafe-demo-khuang-cloud",
    unseenPlaceId: "unseen-wat-si-phan-ton",
    travelMinutes: 9,
    transport: "walk",
    distanceKm: 0.8,
    approvedForPublic: true,
    provenance: fictionalRouteProvenance("Khuang Cloud to Wat Si Phan Ton"),
  },
  {
    cafeId: "cafe-demo-golden-loom",
    unseenPlaceId: "unseen-wat-si-phan-ton",
    travelMinutes: 2,
    transport: "walk",
    distanceKm: 0.1,
    approvedForPublic: true,
    provenance: fictionalRouteProvenance("Golden Loom to Wat Si Phan Ton"),
  },
  {
    cafeId: "cafe-demo-golden-loom",
    unseenPlaceId: "unseen-wat-hua-khuang",
    travelMinutes: 10,
    transport: "walk",
    distanceKm: 0.9,
    approvedForPublic: true,
    provenance: fictionalRouteProvenance("Golden Loom to Wat Hua Khuang"),
  },
  {
    cafeId: "cafe-demo-cocoa-corner",
    unseenPlaceId: "unseen-hong-chao-fong-kham",
    travelMinutes: 3,
    transport: "walk",
    distanceKm: 0.2,
    approvedForPublic: true,
    provenance: fictionalRouteProvenance("Cocoa Corner to Hong Chao Fong Kham"),
  },
] satisfies CafeUnseenLink[];

export const demoCafeOwnerships = [
  {
    cafeId: "cafe-demo-khuang-cloud",
    merchantProfileId: "merchant-demo-01",
    status: "active",
    permissions: ["edit-profile", "submit-drafts", "approve-own-drafts"],
    claimedAt: "2026-07-01T10:00:00+07:00",
    approvedAt: "2026-07-01T10:05:00+07:00",
  },
] satisfies CafeOwnership[];

export const demoMerchantVoiceUpdate =
  "วันนี้มีเมล็ดดอยหมอกล็อต 01 Natural คั่วอ่อน โทนส้มแมนดารินกับสตรอว์เบอร์รี ใช้ทำ filter ราคาแก้วละ 120 บาท พร้อมเสิร์ฟ";

export const demoMerchantDraft = buildMerchantDraft(demoMerchantVoiceUpdate, {
  cafeId: "cafe-finder-demo-01",
  ownerProfileId: "merchant-demo-01",
  createdAt: DEMO_SNAPSHOT_AT,
  draftId: "draft-demo-fong-kham-update",
});

export const demoCheckIns = [
  {
    id: "checkin-demo-01",
    travelerProfileId: "traveler-demo-01",
    cafeId: "cafe-demo-khuang-cloud",
    verificationMethod: "demo",
    verificationState: "verified",
    checkedInAt: "2026-07-10T10:00:00+07:00",
    verifiedAt: "2026-07-10T10:00:01+07:00",
    privacyNote: {
      th: "เช็กอินจำลอง ไม่มีการเก็บพิกัดจริง",
      en: "Simulated check-in; no real coordinates were retained.",
    },
    provenance: fictionalProvenance("Demo check-in fixture"),
  },
] satisfies CheckIn[];

export const demoReviews = [
  {
    id: "review-demo-01",
    travelerProfileId: "traveler-demo-01",
    cafeId: "cafe-demo-khuang-cloud",
    checkInId: "checkin-demo-01",
    verifiedVisit: true,
    ratings: {
      coffeeQuality: 5,
      beanStory: 4,
      service: 4,
      value: 4,
      atmosphere: 4,
      workSuitability: 4,
    },
    originalBody: "รีวิวสมมติสำหรับทดสอบสถานะ verified visit และ moderation เท่านั้น",
    originalLanguage: "th",
    translatedBody: "Fictional review used only to test verified-visit and moderation states.",
    translationLanguage: "en",
    moderationStatus: "published",
    createdAt: "2026-07-10T11:00:00+07:00",
    provenance: fictionalProvenance("Demo review fixture"),
  },
] satisfies Review[];
