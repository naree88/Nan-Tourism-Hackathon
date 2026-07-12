import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  Clock3,
  Coffee,
  Compass,
  Footprints,
  Laptop,
  MapPin,
  Navigation,
  Route,
  Sparkles,
  Sprout,
} from "lucide-react";
import { demoCafes, demoCafeUnseenLinks } from "@/lib/demo";
import { availabilityLabel, cleanDemoCopy } from "@/lib/demo/presentation";
import { parseTravelerRequest, rankCafes } from "@/lib/domain";
import type {
  CafeBadge,
  RoastLevel,
  ScoreComponentKey,
  TasteProfile,
  TransportMode,
  TravelerEntryMode,
  TravelerUseCase,
} from "@/lib/domain";

export const metadata: Metadata = { title: "Coffee Trail ของคุณ" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const tasteValues: TasteProfile[] = ["fruity", "chocolatey", "floral", "nutty", "caramel", "tea-like", "bright"];
const roastValues: RoastLevel[] = ["light", "medium-light", "medium", "medium-dark", "dark", "unknown"];
const useCaseValues: TravelerUseCase[] = ["work", "photos", "quick-takeaway", "relax"];
const transportValues: TransportMode[] = ["walk", "bicycle", "motorcycle", "car", "public-transport", "unknown"];

const badgeLabels: Record<CafeBadge, string> = {
  "nan-grown-beans": "เมล็ดปลูกในน่าน",
  "nan-roasted": "คั่วในน่าน",
  "workation-friendly": "Workation Friendly",
  "new-discovery": "New discovery",
};

const componentLabels: Record<ScoreComponentKey, string> = {
  "route-area-fit": "พื้นที่/เส้นทาง",
  "time-fit": "เวลาที่มี",
  "taste-fit": "รสและระดับคั่ว",
  "detour-fit": "ระยะอ้อม",
  availability: "สถานะเมนู",
  badges: "Badge ที่ตรง",
  "workation-fit": "เหมาะกับการทำงาน",
};

function valueOf(value: string | string[] | undefined, fallback = "") {
  return Array.isArray(value) ? value[0] || fallback : value || fallback;
}

function listOf<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  return valueOf(value)
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => allowed.includes(item as T));
}

function transportLabel(value: TransportMode) {
  return { walk: "เดิน", bicycle: "จักรยาน", motorcycle: "มอเตอร์ไซค์", car: "รถยนต์", "public-transport": "รถสาธารณะ", unknown: "ไม่ระบุ" }[value];
}

function TransportIcon({ mode }: { mode: TransportMode }) {
  if (mode === "walk") return <Footprints size={14} />;
  if (mode === "bicycle") return <Bike size={14} />;
  if (mode === "car" || mode === "motorcycle") return <Navigation size={14} />;
  return <Route size={14} />;
}

export default async function TrailPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const mode = valueOf(query.mode, "ai-plan") as TravelerEntryMode;
  const transport = transportValues.includes(valueOf(query.transport) as TransportMode)
    ? (valueOf(query.transport) as TransportMode)
    : "unknown";
  const tastes = listOf(query.tastes, tasteValues);
  const roasts = listOf(query.roasts, roastValues);
  const useCases = listOf(query.uses, useCaseValues);
  const lat = Number(valueOf(query.lat));
  const lng = Number(valueOf(query.lng));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && valueOf(query.lat) !== "";

  const base = parseTravelerRequest(valueOf(query.q, "วัดภูมินทร์ กาแฟโทนผลไม้ 2 ชั่วโมง"), {
    entryMode: ["ai-plan", "existing-plan", "near-me"].includes(mode) ? mode : "ai-plan",
    startPoint: valueOf(query.start, "วัดภูมินทร์"),
    locationConsent: hasCoordinates ? "granted" : "not-requested",
    coordinates: hasCoordinates ? { latitude: lat, longitude: lng } : undefined,
  });
  const request = {
    ...base,
    availableTimeMinutes: Math.max(30, Math.min(480, Number(valueOf(query.minutes, "90")) || 90)),
    transport,
    tasteProfiles: tastes,
    roastLevels: roasts,
    useCases,
    wantsUnseen: valueOf(query.unseen, "true") === "true",
  };
  const ranked = rankCafes(request, demoCafes, { cafeUnseenLinks: demoCafeUnseenLinks });

  return (
    <div className="page-container narrow-container">
      <div className="page-heading">
        <Link className="button button--ghost" href="/"><ArrowLeft size={17} /> เริ่มใหม่</Link>
        <span className="eyebrow">Transparent Coffee Trail · 3 ร้าน</span>
        <h1>เส้นทางที่เข้ากับวันนี้ของคุณ</h1>
        <p>จัดอันดับจากข้อมูลโครงสร้างชุดเดียวกันทุกครั้ง ไม่มีการสุ่ม และทุกเหตุผลชี้กลับไปยังข้อมูลที่แสดงบนการ์ดได้</p>
      </div>

      <section className="trail-summary" aria-labelledby="request-summary">
        <div className="surface-card__header">
          <div><span className="eyebrow">คำขอที่ยืนยันแล้ว</span><h2 id="request-summary">จาก {request.startPoint?.name.th || "พื้นที่ของคุณ"}</h2></div>
          <BadgeCheck size={23} aria-hidden="true" />
        </div>
        <div className="trail-summary__chips">
          <span><Clock3 size={14} /> {request.availableTimeMinutes} นาที</span>
          <span><TransportIcon mode={request.transport} /> {transportLabel(request.transport)}</span>
          {request.tasteProfiles.map((taste) => <span key={taste}><Coffee size={14} /> {taste}</span>)}
          {request.useCases.includes("work") && <span><Laptop size={14} /> นั่งทำงาน</span>}
          {request.wantsUnseen && <span><Sprout size={14} /> Unseen จริงใกล้ร้าน</span>}
        </div>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">จัดอันดับแบบอธิบายได้</span><h2>{ranked.length} จุดแวะที่แนะนำ</h2></div>
        <p>Algorithm {ranked[0]?.score.algorithmVersion}</p>
      </div>

      <section className="results-list" aria-label="ผลแนะนำร้านกาแฟ">
        {ranked.map((result) => {
          const offering = result.cafe.offerings.find((item) => result.matchedOfferingIds.includes(item.id)) || result.cafe.offerings[0];
          return (
            <article className="result-card" key={result.cafe.id}>
              <div className="result-card__visual">
                <div className="result-rank"><span>0{result.rank}</span><span className="score-pill">Fit {Math.round(result.score.total)}/100</span></div>
                <h2>{cleanDemoCopy(result.cafe.name.th)}</h2>
              </div>
              <div className="result-card__body">
                <div className="badge-row">
                  {result.cafe.badges.map((badge) => <span className={`badge${badge === "new-discovery" ? " badge--saffron" : badge === "workation-friendly" ? " badge--indigo" : ""}`} key={badge}>{badge === "workation-friendly" ? <Laptop size={13} /> : <Sparkles size={13} />}{badgeLabels[badge]}</span>)}
                </div>
                <div className="why-card">
                  <strong>ทำไมร้านนี้จึงเข้ากับคุณ</strong>
                  <p>{cleanDemoCopy(result.summary.th)}</p>
                  {result.whyThisFits.slice(1, 3).map((reason) => <p key={reason.th}>• {cleanDemoCopy(reason.th)}</p>)}
                </div>
                {offering && (
                  <div className="offering-card">
                    <div className="offering-title"><div><h3>{cleanDemoCopy(offering.name.th)}</h3><p>{offering.process} · {offering.roastLevel} · {offering.brewMethods.join(", ")}</p></div><span className="price">฿{offering.priceFrom.amount}</span></div>
                    <div className="tasting-notes">{offering.tastingNotes.map((note) => <span key={note.th}>{cleanDemoCopy(note.th)}</span>)}</div>
                    <div className="meta-row"><span><Coffee size={14} /> {availabilityLabel(offering.availability.status)}</span></div>
                  </div>
                )}
                <div className="meta-row">
                  <span><MapPin size={14} /> {cleanDemoCopy(result.cafe.address.th)}</span>
                  {result.detourEstimate && <span><TransportIcon mode={result.detourEstimate.transport} /> ประมาณ {result.detourEstimate.estimatedMinutes} นาที · ไม่ใช่ routing สด</span>}
                  <span><Clock3 size={14} /> แนะนำเผื่อ {result.cafe.recommendedVisitMinutes} นาที</span>
                </div>
                <details className="score-details">
                  <summary>ดูคะแนนและหลักฐานทั้งหมด</summary>
                  <div className="score-grid">
                    {result.score.components.map((component) => <span key={component.key}>{componentLabels[component.key]} <strong>{component.score}/{component.maxScore}</strong></span>)}
                  </div>
                </details>
                <Link className="button button--primary button--full" href={`/cafes/${result.cafe.slug}?taste=${request.tasteProfiles[0] || ""}&from=trail`}>
                  ดูโปรไฟล์และ Unseen Nearby <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <div className="notice" style={{ marginTop: 18 }}>
        <Compass size={18} /> ระบบแสดงเฉพาะร้านที่มีข้อมูลตรงเงื่อนไข และจะไม่สร้างร้านหรือข้อมูลเพิ่มเมื่อไม่พบผลลัพธ์
      </div>
    </div>
  );
}
