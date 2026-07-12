import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Coffee,
  Compass,
  ExternalLink,
  Gauge,
  Globe2,
  Laptop,
  MapPin,
  MessageCircle,
  PlugZap,
  QrCode,
  ShieldCheck,
  Sparkles,
  Sprout,
  Video,
  Wifi,
} from "lucide-react";
import { ApprovedDemoOfferingBanner } from "@/components/approved-demo-offering";
import { FinderCafeProfile } from "@/components/finder-cafe-profile";
import { MerchantStorefrontPreview } from "@/components/merchant-storefront-preview";
import { demoCafes, demoCafeUnseenLinks, demoReviews, demoUnseenPlaces } from "@/lib/demo";
import { getFinderCafeDetail } from "@/lib/demo/finder-cafe-details";
import { demoFinderCafes, unseenNearbyForFinderCafe } from "@/lib/demo/finder-cafes";
import { availabilityLabel, cleanDemoCopy } from "@/lib/demo/presentation";
import type { CafeBadge } from "@/lib/domain";
import { loadSupabaseMerchantProfileBySlug } from "@/lib/merchant/profile";
import { isDemoMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const badgeCopy: Record<CafeBadge, { label: string; meaning: string }> = {
  "nan-grown-beans": { label: "เมล็ดปลูกในน่าน", meaning: "ระบุจังหวัดต้นทางเป็นน่าน แยกจากสถานที่คั่ว" },
  "nan-roasted": { label: "คั่วในน่าน", meaning: "ระบุว่าคั่วในน่าน ไม่ได้แปลว่าเมล็ดปลูกในน่าน" },
  "workation-friendly": { label: "Workation Friendly", meaning: "มีรายละเอียด Wi‑Fi ปลั๊ก ที่นั่ง การคอล และนโยบายครบ" },
  "new-discovery": { label: "New discovery", meaning: "ร้านค้นพบใหม่จะไม่ถูกลดคะแนนเพราะมีรีวิวน้อย" },
};

const allProfileCafes = [...demoCafes, ...demoFinderCafes];

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function categoryLabel(value: string) {
  return { culture: "วัฒนธรรม", craft: "งานหัตถกรรม", "local-food": "อาหารท้องถิ่น", "scenic-point": "จุดชมวิว", "gentle-nature": "ธรรมชาติเบา ๆ", "community-experience": "ชุมชน" }[value] || value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const connectedProfile = await loadSupabaseMerchantProfileBySlug(supabase, slug);
      if (connectedProfile) return { title: connectedProfile.cafe.nameTh };
    }
  }
  const cafe = allProfileCafes.find((item) => item.slug === slug);
  return { title: cafe ? cleanDemoCopy(cafe.name.th) : "Café profile" };
}

export function generateStaticParams() {
  return allProfileCafes.map((cafe) => ({ slug: cafe.slug }));
}

export default async function CafePage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase mode is enabled but its public configuration is missing.");
    const connectedProfile = await loadSupabaseMerchantProfileBySlug(supabase, slug);
    if (connectedProfile) {
      return (
        <main className="page-container connected-storefront-page">
          <div className="button-row connected-storefront-page__actions">
            <Link className="button button--ghost" href="/"><ArrowLeft size={17} /> กลับหน้าค้นหาร้าน</Link>
          </div>
          <MerchantStorefrontPreview
            current={connectedProfile}
            proposed={connectedProfile}
            status="published"
          />
        </main>
      );
    }
  }

  const finderCafe = demoFinderCafes.find((item) => item.slug === slug);

  if (finderCafe) {
    const detail = getFinderCafeDetail(finderCafe.id);
    const unseenNearby = unseenNearbyForFinderCafe(finderCafe.id);
    if (!detail || !unseenNearby) notFound();

    return (
      <FinderCafeProfile
        cafe={finderCafe}
        detail={detail}
        unseenNearby={unseenNearby}
      />
    );
  }

  const cafe = demoCafes.find((item) => item.slug === slug);
  if (!cafe) notFound();

  const taste = Array.isArray(query.taste) ? query.taste[0] : query.taste;
  const availableOffering = cafe.offerings.find((item) => item.approvedForPublic);
  const links = demoCafeUnseenLinks.filter((link) => link.cafeId === cafe.id && link.approvedForPublic);
  const nearby = links.flatMap((link) => {
    const place = demoUnseenPlaces.find((item) => item.id === link.unseenPlaceId);
    return place ? [{ place, link }] : [];
  });
  const cafePick = cafe.highlights.find((item) => item.kind === "cafe-pick");
  const travelerFavorite = cafe.highlights.find((item) => item.kind === "traveler-favorite");
  const reviews = demoReviews.filter((review) => review.cafeId === cafe.id && review.moderationStatus === "published");
  const speed = cafe.workation?.speedReports[0];

  return (
    <div className="page-container">
      <Link className="button button--ghost" href="/trail"><ArrowLeft size={17} /> กลับผลแนะนำ</Link>

      <section className="profile-hero">
        <div className="profile-visual">
          <div className="profile-visual__top">
            <span className="eyebrow" style={{ color: "var(--saffron-100)" }}>Café profile</span>
          </div>
          <div className="profile-visual__bottom">
            <h1>{cleanDemoCopy(cafe.name.th)}</h1>
            <p>{cleanDemoCopy(cafe.story.th)}</p>
          </div>
        </div>
        <div className="profile-actions">
          <Link className="button button--primary" href={`/cafes/${cafe.slug}/check-in`}><QrCode size={17} /> เช็กอิน</Link>
          <a className="button button--secondary" href="#unseen-nearby"><Compass size={17} /> Unseen ใกล้ร้าน</a>
          <Link className="button button--secondary" href="/merchant"><Coffee size={17} /> อัปเดตร้าน</Link>
        </div>
      </section>

      <div className="profile-location meta-row">
        <span><MapPin size={16} /> {cleanDemoCopy(cafe.address.th)}</span>
      </div>

      <div className="content-grid">
        <div className="content-grid__main">
          <section className="surface-card" aria-labelledby="offerings-heading">
            <div className="surface-card__header">
              <div><span className="eyebrow">Current offerings</span><h2 id="offerings-heading">เมล็ดและเมนูปัจจุบัน</h2><p>อัปเดตล่าสุด {formatDate(cafe.updatedAt)}</p></div>
              <Coffee size={24} />
            </div>
            <ApprovedDemoOfferingBanner cafeId={cafe.id} />
            {cafe.offerings.filter((item) => item.approvedForPublic).map((offering) => (
              <article className="offering-card" key={offering.id}>
                <div className="offering-title">
                  <div><h3>{cleanDemoCopy(offering.name.th)}</h3><p>{cleanDemoCopy(offering.origin.province || "ไม่ระบุจังหวัด")} · {cleanDemoCopy("farmOrCommunity" in offering.origin ? offering.origin.farmOrCommunity : "ไม่ระบุแหล่งย่อย")}</p></div>
                  <span className="price">฿{offering.priceFrom.amount}</span>
                </div>
                <dl className="definition-grid">
                  <div className="definition-row"><dt>Process</dt><dd>{offering.process}</dd></div>
                  <div className="definition-row"><dt>Roast</dt><dd>{offering.roastLevel}</dd></div>
                  <div className="definition-row"><dt>Brew</dt><dd>{offering.brewMethods.join(", ")}</dd></div>
                  <div className="definition-row"><dt>Availability</dt><dd>{availabilityLabel(offering.availability.status)}</dd></div>
                </dl>
                <div className="tasting-notes">{offering.tastingNotes.map((note) => <span key={note.th}>{cleanDemoCopy(note.th)}</span>)}</div>
                <div className="meta-row">
                  <span><Clock3 size={14} /> อัปเดต {formatDate(offering.updatedAt)}</span>
                </div>
              </article>
            ))}
          </section>

          <section className="surface-card" aria-labelledby="picks-heading">
            <div className="surface-card__header"><div><span className="eyebrow">Three sources, three meanings</span><h2 id="picks-heading">เลือกจากใคร เพราะอะไร</h2></div><Sparkles size={23} /></div>
            <div className="pick-list">
              <div className="pick-item">
                <span className="pick-item__label"><Coffee size={14} /> Café pick</span>
                <strong>{cafePick ? cleanDemoCopy(cafe.menu.find((item) => item.id === cafePick.offeringOrMenuItemId)?.name.th || "เมนูประจำร้าน") : "ยังไม่มีรายการที่เจ้าของร้านยืนยัน"}</strong>
                <p>{cafePick ? "รายการที่เจ้าของร้านเลือกแนะนำ" : "ต้องมีข้อมูล owner-confirmed ก่อนจึงจะแสดงป้ายนี้"}</p>
              </div>
              <div className="pick-item">
                <span className="pick-item__label"><MessageCircle size={14} /> Traveler favorite</span>
                <strong>{travelerFavorite ? "รายการโปรดของผู้เดินทาง" : "ยังไม่มีฐานรีวิวที่ผ่านการยืนยัน"}</strong>
                <p>{travelerFavorite ? "เลือกจากรีวิวที่ผ่านเงื่อนไข verified visit" : "ไม่มอบป้าย Traveler favorite หากไม่มีรีวิว verified visit รองรับ"}</p>
              </div>
              <div className="pick-item">
                <span className="pick-item__label"><Sparkles size={14} /> AI pick for you</span>
                <strong>{availableOffering ? cleanDemoCopy(availableOffering.name.th) : "ยังไม่มีเมล็ดพร้อมเสิร์ฟ"}</strong>
                <p>{availableOffering ? `เลือกจากรสชาติที่คุณสนใจ (${taste || "กาแฟที่พร้อมเสิร์ฟ"}) และสถานะเมนูล่าสุด` : "ไม่สร้างคำแนะนำเมื่อไม่มีข้อมูล availability"}</p>
              </div>
            </div>
          </section>

          <section className="surface-card" id="unseen-nearby" aria-labelledby="unseen-heading">
            <div className="surface-card__header"><div><span className="eyebrow">Real places · source checked</span><h2 id="unseen-heading">Unseen ใกล้ร้านนี้</h2><p>สถานที่จริงพร้อมลิงก์แหล่งข้อมูล · เวลาเดินทางเป็นค่าประมาณ</p></div><Sprout size={24} /></div>
            {nearby.length ? (
              <div className="unseen-list">
                {nearby.map(({ place, link }) => (
                  <article className="unseen-card" key={place.id}>
                    <div className="unseen-card__accent" />
                    <div className="unseen-card__body">
                      <div className="offering-title"><div><span className="badge badge--saffron">{categoryLabel(place.category)}</span><h3 style={{ marginTop: 7 }}>{place.name.th}</h3></div><span className="price" style={{ fontSize: "1rem" }}>{link.travelMinutes} นาที*</span></div>
                      <p>{place.description.th}</p>
                      <div className="notice"><Clock3 size={16} /> {place.openingOrAccessContext.th}</div>
                      <p className="field-hint">{place.weatherOrAccessNotes.th}</p>
                      <div className="source-box">
                        <strong>{place.provenance.displayLabel.th}</strong>
                        <a href={place.provenance.sourceUrl} target="_blank" rel="noreferrer">แหล่งบริบทหลัก: {place.provenance.sourceName} <ExternalLink size={11} /></a>
                        {place.provenance.additionalSources?.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label} <ExternalLink size={11} /></a>)}
                        <span>* ระยะทางประมาณ {link.distanceKm} กม.</span>
                      </div>
                      <a className="button button--secondary" href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates.latitude},${place.coordinates.longitude}`} target="_blank" rel="noreferrer">ดูพิกัดสถานที่จริง <ExternalLink size={16} /></a>
                    </div>
                  </article>
                ))}
              </div>
            ) : <div className="notice">ยังไม่มี Unseen Nearby ที่ผ่านการตรวจแหล่งข้อมูลสำหรับร้านนี้</div>}
          </section>
        </div>

        <aside className="content-grid__aside">
          <section className="surface-card" aria-labelledby="badges-heading">
            <div className="surface-card__header"><div><span className="eyebrow">Badge meanings</span><h2 id="badges-heading">ป้ายของร้าน</h2></div><BadgeCheck size={22} /></div>
            <div className="pick-list">
              {cafe.badges.map((badge) => <div className="pick-item" key={badge}><span className="pick-item__label"><CheckCircle2 size={14} /> {badgeCopy[badge].label}</span><p>{badgeCopy[badge].meaning}</p></div>)}
            </div>
          </section>

          {cafe.workation ? (
            <section className="surface-card workation-card" aria-labelledby="workation-heading">
              <div className="surface-card__header"><div><span className="eyebrow" style={{ color: "var(--saffron-100)" }}>Workation details</span><h2 id="workation-heading">นั่งทำงานได้แค่ไหน</h2></div><Laptop size={24} /></div>
              <div className="badge-row">
                <span className="trust-pill"><Wifi size={13} /> Wi‑Fi available</span>
                {speed && <span className="trust-pill"><Gauge size={13} /> Speed reported</span>}
                <span className="trust-pill" style={{ opacity: .65 }}><ShieldCheck size={13} /> ยังไม่มี Community verified</span>
              </div>
              <div className="workation-grid">
                <div className="workation-stat"><PlugZap size={18} /><span>ปลั๊ก</span><strong>{cafe.workation.outlets}</strong></div>
                <div className="workation-stat"><Laptop size={18} /><span>โต๊ะทำงาน</span><strong>{cafe.workation.workSeating}</strong></div>
                <div className="workation-stat"><Video size={18} /><span>วิดีโอคอล</span><strong>{cafe.workation.videoCalls}</strong></div>
                <div className="workation-stat"><Clock3 size={18} /><span>นโยบาย</span><strong>{cleanDemoCopy(cafe.workation.policy.th)}</strong></div>
              </div>
              {speed && (
                <div className="speed-panel">
                  <strong>Speed reported · {formatDate(speed.testedAt)}</strong>
                  <div className="speed-values">
                    <div><strong>{speed.downloadMbps}</strong><span>Mbps down</span></div>
                    <div><strong>{speed.uploadMbps}</strong><span>Mbps up</span></div>
                    <div><strong>{speed.pingMs}</strong><span>ms ping</span></div>
                  </div>
                  <p className="field-hint">ความเร็วอาจเปลี่ยนแปลงตามเวลาและจำนวนผู้ใช้งาน</p>
                </div>
              )}
            </section>
          ) : (
            <section className="surface-card"><div className="surface-card__header"><div><span className="eyebrow">Workation</span><h2>ยังไม่มีข้อมูลครบ</h2></div><Laptop size={22} /></div><p className="field-hint">ร้านนี้ไม่ได้รับป้าย Workation Friendly และระบบจะไม่เดาความพร้อมของ Wi‑Fi หรือพื้นที่ทำงาน</p></section>
          )}

          <section className="surface-card" aria-labelledby="reviews-heading">
            <div className="surface-card__header"><div><span className="eyebrow">Verified visit only</span><h2 id="reviews-heading">รีวิวผู้เดินทาง</h2></div><MessageCircle size={22} /></div>
            {reviews.length ? <div className="review-list">{reviews.map((review) => <article className="review-card" key={review.id}><div className="review-card__meta"><span className="badge"><BadgeCheck size={12} /> Verified visit</span><span>{formatDate(review.createdAt)}</span></div><p>{cleanDemoCopy(review.originalBody)}</p>{review.translatedBody && <p className="field-hint"><Globe2 size={12} /> คำแปล: {cleanDemoCopy(review.translatedBody)}</p>}</article>)}</div> : <p className="field-hint">ยังไม่มีรีวิวที่ผ่าน moderation สำหรับร้านนี้ ร้านใหม่จึงไม่ถูกหักคะแนนเพราะรีวิวน้อย</p>}
            <Link className="button button--secondary button--full" href={`/cafes/${cafe.slug}/check-in`}>เช็กอินก่อนเขียนรีวิว <ArrowRight size={16} /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
