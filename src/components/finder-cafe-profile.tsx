"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  Coffee,
  Compass,
  Gauge,
  Laptop,
  MapPin,
  MessageCircle,
  Mountain,
  Sparkles,
  Sprout,
  Star,
  Wifi,
} from "lucide-react";
import { useApprovedDemoProfile } from "@/components/approved-demo-offering";
import type {
  FinderCafeDetail,
  FinderRecommendedMenu,
  FinderSingleOriginCoffee,
} from "@/lib/demo/finder-cafe-details";
import { cleanDemoCopy } from "@/lib/demo/presentation";
import type {
  BrewMethod,
  Cafe,
  CafeBadge,
  CoffeeProcess,
  RoastLevel,
} from "@/lib/domain/types";
import type { MerchantProfileSnapshot } from "@/lib/merchant/profile";

type FinderCafeProfileProps = {
  cafe: Cafe;
  detail: FinderCafeDetail;
  unseenNearby: string;
};

const badgeLabels: Record<CafeBadge, string> = {
  "nan-grown-beans": "เมล็ดปลูกในน่าน / Nan-grown",
  "nan-roasted": "คั่วในน่าน / Nan-roasted",
  "workation-friendly": "เหมาะกับ Workation",
  "new-discovery": "ร้านน่าแวะ / New discovery",
};

const processLabels: Record<CoffeeProcess, string> = {
  natural: "Natural / ตากแห้งทั้งผล",
  washed: "Washed / ล้างเนื้อผล",
  honey: "Honey / คงเมือกกาแฟบางส่วน",
  anaerobic: "Anaerobic / หมักไร้อากาศ",
  "carbonic-maceration": "Carbonic Maceration",
  other: "กระบวนการอื่น",
  unknown: "ไม่ระบุกระบวนการ",
};

const roastLabels: Record<RoastLevel, string> = {
  light: "คั่วอ่อน / Light",
  "medium-light": "คั่วกลางอ่อน / Medium-light",
  medium: "คั่วกลาง / Medium",
  "medium-dark": "คั่วกลางเข้ม / Medium-dark",
  dark: "คั่วเข้ม / Dark",
  unknown: "ไม่ระบุระดับการคั่ว",
};

const brewMethodLabels: Record<BrewMethod, string> = {
  filter: "ฟิลเตอร์ / Filter",
  espresso: "เอสเปรสโซ / Espresso",
  aeropress: "แอโรเพรส / AeroPress",
  "cold-brew": "สกัดเย็น / Cold brew",
  mokapot: "โมก้าพอต / Moka pot",
  other: "วิธีชงอื่น",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}

function presentStory(value: string): string {
  return cleanDemoCopy(value)
    .replace(/สำหรับทดสอบตัวกรอง/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

type ProfileOffering = NonNullable<MerchantProfileSnapshot["featuredOffering"]>;
type OriginDisplay = Omit<FinderSingleOriginCoffee, "altitudeMeters"> & {
  altitudeMeters?: FinderSingleOriginCoffee["altitudeMeters"];
};
type OriginCard = {
  key: string;
  origin: OriginDisplay;
  featured: boolean;
  ownerApproved: boolean;
};

const UNKNOWN_ORIGIN_TEXT = "ยังไม่ระบุ";

function offeringKey(offering: ProfileOffering | undefined): string | undefined {
  if (!offering) return undefined;
  if (offering.id) return `id:${offering.id}`;
  const name = offering.beanName?.trim().normalize("NFC").toLocaleLowerCase("th-TH");
  return name ? `name:${name}` : undefined;
}

function originFromOffering(
  offering: ProfileOffering,
  fallback?: FinderSingleOriginCoffee,
): OriginDisplay {
  const beanName = offering.beanName || fallback?.name.th || "เมล็ดที่ยังไม่ระบุชื่อ";
  return {
    name: { th: beanName, en: offering.beanName || fallback?.name.en || beanName },
    origin: {
      country: fallback?.origin.country || "Thailand",
      province: offering.originProvince || fallback?.origin.province || UNKNOWN_ORIGIN_TEXT,
      locality: offering.originName || fallback?.origin.locality || UNKNOWN_ORIGIN_TEXT,
    },
    producerOrCommunity: offering.producer
      ? { th: offering.producer, en: offering.producer }
      : fallback?.producerOrCommunity || { th: UNKNOWN_ORIGIN_TEXT, en: "Not specified" },
    altitudeMeters: offering.altitudeMeters
      ? { ...offering.altitudeMeters }
      : fallback?.altitudeMeters,
    varietal: offering.varietal || fallback?.varietal || UNKNOWN_ORIGIN_TEXT,
    process: offering.process || fallback?.process || "unknown",
    processingLocation: {
      province: offering.processingLocation?.province || fallback?.processingLocation.province || UNKNOWN_ORIGIN_TEXT,
      locality: offering.processingLocation?.locality || fallback?.processingLocation.locality || UNKNOWN_ORIGIN_TEXT,
    },
    roastLevel: offering.roastLevel || fallback?.roastLevel || "unknown",
    tasteNotes: offering.tastingNotes.length
      ? offering.tastingNotes.map((note) => ({ ...note }))
      : fallback?.tasteNotes || [],
    tasteProfiles: offering.tasteProfiles.length
      ? [...offering.tasteProfiles]
      : fallback?.tasteProfiles || [],
    brewMethods: offering.brewMethods.length
      ? [...offering.brewMethods]
      : fallback?.brewMethods || [],
    roasterLocation: {
      province: offering.roasterLocation?.province || fallback?.roasterLocation.province || UNKNOWN_ORIGIN_TEXT,
      locality: offering.roasterLocation?.locality || fallback?.roasterLocation.locality || UNKNOWN_ORIGIN_TEXT,
    },
  };
}

function mergeApprovedMenus(
  current: readonly FinderRecommendedMenu[],
  profile: MerchantProfileSnapshot | undefined,
  origin: OriginDisplay | undefined,
): readonly FinderRecommendedMenu[] {
  if (!profile) return current;

  return profile.menuItems.map((menu, index) => {
    const existing = current.find((item) =>
      (menu.id && item.id === menu.id)
      || item.name.th === menu.nameTh,
    );
    return {
      id: menu.id || `merchant-menu-${index + 1}`,
      name: {
        th: menu.nameTh,
        en: menu.nameEn || menu.nameTh,
      },
      description: {
        th: menu.descriptionTh || existing?.description.th || "",
        en: menu.descriptionEn || existing?.description.en || "",
      },
      price: {
        amount: menu.priceThb ?? existing?.price.amount ?? 0,
        currency: "THB" as const,
      },
      sensoryTags: existing?.sensoryTags
        ?? (menu.usesFeaturedSingleOrigin ? origin?.tasteNotes.slice(0, 2) ?? [] : []),
      usesFeaturedSingleOrigin: menu.usesFeaturedSingleOrigin ?? false,
    };
  });
}

function isNan(value: string): boolean {
  const normalized = value.trim().toLocaleLowerCase("th-TH");
  return normalized === "nan" || normalized === "น่าน" || normalized === "จังหวัดน่าน";
}

function hasKnownOriginValue(value: string): boolean {
  return Boolean(value.trim()) && value !== UNKNOWN_ORIGIN_TEXT;
}

function originPlace(locality: string, province: string): string | undefined {
  const parts = [locality, province].filter(hasKnownOriginValue);
  return parts.length ? parts.map(cleanDemoCopy).join(", ") : undefined;
}

function buildJourneyCopy(origin: OriginDisplay, cafeName: string) {
  const beanName = cleanDemoCopy(origin.name.th);
  const grownInNan = isNan(origin.origin.province);
  const roastedInNan = isNan(origin.roasterLocation.province);
  const originLocation = originPlace(origin.origin.locality, origin.origin.province);
  const processingLocation = originPlace(
    origin.processingLocation.locality,
    origin.processingLocation.province,
  );
  const roasterLocation = originPlace(
    origin.roasterLocation.locality,
    origin.roasterLocation.province,
  );

  const sentences = [
    grownInNan
      ? `${beanName} เป็นเมล็ดปลูกในน่าน${originLocation ? `จาก ${originLocation}` : ""}`
      : originLocation
        ? `${beanName} มีแหล่งปลูกที่ ${originLocation}`
        : `${beanName} ยังไม่มีข้อมูลยืนยันแหล่งปลูก`,
    processingLocation
      ? `แปรรูปที่ ${processingLocation}`
      : "ยังไม่มีข้อมูลสถานที่แปรรูป",
    roasterLocation
      ? `คั่วที่ ${roasterLocation}`
      : "ยังไม่มีข้อมูลสถานที่คั่ว",
    `ก่อนนำมาเสิร์ฟที่${cleanDemoCopy(cafeName)}`,
  ];

  return {
    title: grownInNan
      ? "จากดอยน่านสู่แก้วนี้"
      : roastedInNan
        ? "จากโรงคั่วน่านสู่แก้วนี้"
        : "เส้นทางเมล็ดสู่แก้วนี้",
    description: sentences.join(" · "),
  };
}

function BadgeIcon({ badge }: { badge: CafeBadge }) {
  if (badge === "nan-grown-beans") return <Sprout size={15} aria-hidden="true" />;
  if (badge === "nan-roasted") return <Coffee size={15} aria-hidden="true" />;
  if (badge === "workation-friendly") return <Laptop size={15} aria-hidden="true" />;
  return <Sparkles size={15} aria-hidden="true" />;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className="finder-profile__stars"
      role="img"
      aria-label={`${rating} จาก 5 ดาว`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={`rating-star-${index + 1}`}
          size={16}
          fill={index < rating ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function OriginLabelCard({
  card,
  showFeatured,
}: {
  card: OriginCard;
  showFeatured: boolean;
}) {
  const { origin } = card;
  return (
    <article className="finder-profile__origin-label">
      <div className="finder-profile__origin-banner">
        <span>Single Origin Bean</span>
        <strong>Thai</strong>
      </div>
      <div className="finder-profile__roast-band">
        {roastLabels[origin.roastLevel]}
      </div>

      {card.ownerApproved || (showFeatured && card.featured) ? (
        <div className="finder-profile__owner-approved">
          <BadgeCheck size={16} aria-hidden="true" />
          {card.ownerApproved ? "เพิ่มโดยเจ้าของร้านและอนุมัติแล้ว" : "Featured lot"}
        </div>
      ) : null}

      <div className="finder-profile__origin-intro">
        <div>
          <span>{card.featured ? "Featured lot" : "Single Origin lot"}</span>
          <h3>{cleanDemoCopy(origin.name.th)}</h3>
          <p>{cleanDemoCopy(origin.name.en)}</p>
        </div>
        <div className="finder-profile__origin-seal" aria-hidden="true">
          <Sprout size={25} />
          <span>Origin<br />trace</span>
        </div>
      </div>

      <dl className="finder-profile__origin-details">
        <div>
          <dt>ประเทศ / Country</dt>
          <dd>ไทย / {origin.origin.country}</dd>
        </div>
        <div>
          <dt>จังหวัด / Province</dt>
          <dd>{cleanDemoCopy(origin.origin.province)}</dd>
        </div>
        <div>
          <dt>พื้นที่ปลูก / Locality</dt>
          <dd>{cleanDemoCopy(origin.origin.locality)}</dd>
        </div>
        <div>
          <dt>ผู้ผลิตหรือชุมชน / Producer</dt>
          <dd>
            {cleanDemoCopy(origin.producerOrCommunity.th)}
            <small>{cleanDemoCopy(origin.producerOrCommunity.en)}</small>
          </dd>
        </div>
        <div>
          <dt>ความสูง / Altitude</dt>
          <dd>
            {origin.altitudeMeters
              ? `${formatNumber(origin.altitudeMeters.min)}–${formatNumber(origin.altitudeMeters.max)} เมตร`
              : UNKNOWN_ORIGIN_TEXT}
          </dd>
        </div>
        <div>
          <dt>สายพันธุ์ / Varietal</dt>
          <dd>{cleanDemoCopy(origin.varietal)}</dd>
        </div>
        <div>
          <dt>กระบวนการ / Process</dt>
          <dd>{processLabels[origin.process]}</dd>
        </div>
        <div>
          <dt>สถานที่แปรรูป / Processing location</dt>
          <dd>{cleanDemoCopy(origin.processingLocation.locality)}, {cleanDemoCopy(origin.processingLocation.province)}</dd>
        </div>
        <div>
          <dt>ระดับคั่ว / Roast profile</dt>
          <dd>{roastLabels[origin.roastLevel]}</dd>
        </div>
        <div>
          <dt>รสชาติ / Taste notes</dt>
          <dd>
            {origin.tasteNotes.length ? (
              <ul className="finder-profile__origin-notes">
                {origin.tasteNotes.map((note) => (
                  <li key={`${note.th}-${note.en}`}>
                    {cleanDemoCopy(note.th)} <span>/ {cleanDemoCopy(note.en)}</span>
                  </li>
                ))}
              </ul>
            ) : UNKNOWN_ORIGIN_TEXT}
          </dd>
        </div>
        <div>
          <dt>สถานที่คั่ว / Roaster</dt>
          <dd>{cleanDemoCopy(origin.roasterLocation.locality)}, {cleanDemoCopy(origin.roasterLocation.province)}</dd>
        </div>
        <div>
          <dt>วิธีชง / Brew methods</dt>
          <dd>
            {origin.brewMethods.length ? (
              <ul className="finder-profile__brew-methods">
                {origin.brewMethods.map((method) => (
                  <li key={method}>{brewMethodLabels[method]}</li>
                ))}
              </ul>
            ) : UNKNOWN_ORIGIN_TEXT}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function FinderCafeProfile({
  cafe,
  detail,
  unseenNearby,
}: FinderCafeProfileProps) {
  const approved = useApprovedDemoProfile(cafe.id);
  const approvedProfile = approved?.profile;
  const profileOfferings = approvedProfile
    ? approvedProfile.offerings
      ?? (approvedProfile.featuredOffering ? [approvedProfile.featuredOffering] : [])
    : [];
  const originalOfferingId = cafe.offerings.find((item) => item.approvedForPublic)?.id;
  const featuredOfferingKey = offeringKey(approvedProfile?.featuredOffering);
  const approvedOfferingName = approved?.updatedOfferingName
    ?.trim()
    .normalize("NFC")
    .toLocaleLowerCase("th-TH");
  const originCards: OriginCard[] = approvedProfile
    ? profileOfferings.map((offering, index) => {
        const key = offeringKey(offering) || `offering-${index + 1}`;
        const normalizedName = offering.beanName?.trim().normalize("NFC").toLocaleLowerCase("th-TH");
        return {
          key,
          origin: originFromOffering(
            offering,
            offering.id === originalOfferingId ? detail.singleOrigin : undefined,
          ),
          featured: key === featuredOfferingKey || (!featuredOfferingKey && index === 0),
          ownerApproved: Boolean(approvedOfferingName && normalizedName === approvedOfferingName),
        };
      })
    : [{
        key: originalOfferingId ? `id:${originalOfferingId}` : "fixture-origin",
        origin: { ...detail.singleOrigin, altitudeMeters: { ...detail.singleOrigin.altitudeMeters } },
        featured: true,
        ownerApproved: false,
      }];
  const featuredOriginCard = originCards.find((card) => card.featured) ?? originCards[0];
  const featuredOrigin = featuredOriginCard?.origin;
  const traceOriginCard = originCards.find((card) =>
    card.ownerApproved && isNan(card.origin.origin.province),
  ) ?? [...originCards].reverse().find((card) => isNan(card.origin.origin.province));
  const traceOrigin = traceOriginCard?.origin;
  const recommendedMenus = mergeApprovedMenus(detail.recommendedMenus, approvedProfile, featuredOrigin);
  const baseInternetReport = cafe.workation?.speedReports[0];
  const internetReport = baseInternetReport
    ? {
        ...baseInternetReport,
        downloadMbps: approvedProfile?.workation?.downloadMbps ?? baseInternetReport.downloadMbps,
        uploadMbps: approvedProfile?.workation?.uploadMbps ?? baseInternetReport.uploadMbps,
        pingMs: approvedProfile?.workation?.pingMs ?? baseInternetReport.pingMs,
        testedAt: approved ? approved.approvedAt : baseInternetReport.testedAt,
      }
    : undefined;
  const menusById = new Map(
    recommendedMenus.map((menu) => [menu.id, menu]),
  );
  const isNanGrown = Boolean(traceOrigin);
  const isNanRoasted = traceOrigin ? isNan(traceOrigin.roasterLocation.province) : false;
  const isNanProcessed = traceOrigin ? isNan(traceOrigin.processingLocation.province) : false;
  const hasNanGrown = originCards.some((card) => isNan(card.origin.origin.province));
  const hasNanRoasted = originCards.some((card) => isNan(card.origin.roasterLocation.province));
  const hasNanCoffeeConnection = hasNanGrown || hasNanRoasted;
  const journeyCopy = traceOrigin ? buildJourneyCopy(traceOrigin, cafe.name.th) : null;
  const journeyTitle = journeyCopy?.title || "";
  const journeyDescription = journeyCopy?.description || "";
  const featuredIsNanGrown = featuredOrigin ? isNan(featuredOrigin.origin.province) : false;
  const featuredIsNanRoasted = featuredOrigin ? isNan(featuredOrigin.roasterLocation.province) : false;
  const featuredLotLabel = featuredIsNanGrown && featuredIsNanRoasted
    ? "เมล็ดน่าน · คั่วในน่าน"
    : featuredIsNanGrown
      ? "เมล็ดปลูกในน่าน"
      : featuredIsNanRoasted
        ? "คั่วในน่าน"
        : "ใช้ล็อต Single Origin";
  const ctaHeading = hasNanGrown && hasNanRoasted
    ? "ตามหาเมล็ดน่านที่คั่วในน่านต่อ"
    : hasNanGrown
      ? "ทำความรู้จักเมล็ดปลูกในน่านให้มากขึ้น"
      : hasNanRoasted
        ? "ตามหารสมือโรงคั่วน่านแก้วถัดไป"
        : "ค้นหาแก้วถัดไปบนเส้นทางน่าน";
  const ctaDescription = hasNanCoffeeConnection
    ? "กลับไปใช้ตัวกรองกาแฟน่าน เพื่อค้นหาร้านและล็อตที่เชื่อมกับผู้ปลูกหรือโรงคั่วในจังหวัด"
    : "กลับไปดูร้านอื่นบนแผนที่ แล้วเลือกจุดแวะที่เข้ากับเส้นทางและรสชาติที่คุณชอบ";
  const ctaLabel = hasNanGrown && hasNanRoasted
    ? "ดูร้านที่ใช้เมล็ดน่านและคั่วในน่าน"
    : hasNanGrown
      ? "ดูร้านที่ใช้เมล็ดปลูกในน่าน"
      : hasNanRoasted
        ? "ดูร้านที่คั่วเมล็ดในน่าน"
        : "กลับไปสำรวจร้านในน่าน";

  return (
    <div className="page-container finder-profile">
      <nav className="finder-profile__topbar" aria-label="ทางลัดหน้าร้าน">
        <Link className="finder-profile__back" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          กลับไปค้นหาร้านกาแฟ
        </Link>
      </nav>

      <header className="finder-profile__hero">
        <div className="finder-profile__hero-copy">
          <span className="finder-profile__kicker">
            <Coffee size={17} aria-hidden="true" />
            Café in Nan
          </span>
          <h1>{cleanDemoCopy(cafe.name.th)}</h1>
          <p>{presentStory(cafe.story.th)}</p>

          <ul className="finder-profile__badges" aria-label="คุณสมบัติของร้าน">
            {cafe.badges.map((badge) => (
              <li key={badge}>
                <BadgeIcon badge={badge} />
                {badgeLabels[badge]}
              </li>
            ))}
          </ul>
        </div>

        <div className="finder-profile__unseen">
          <Compass size={25} aria-hidden="true" />
          <div>
            <span>Unseen ใกล้ร้าน</span>
            <strong>{unseenNearby}</strong>
            <small>
              <MapPin size={14} aria-hidden="true" />
              จังหวัดน่าน
            </small>
          </div>
        </div>
      </header>

      <div className="finder-profile__sections">
        {traceOrigin ? (
          <section
            className="finder-profile__journey"
            aria-labelledby="finder-nan-journey-heading"
          >
          <div className="finder-profile__journey-intro">
            <span>
              <Sprout size={17} aria-hidden="true" />
              Coffee origin trace
            </span>
            <h2 id="finder-nan-journey-heading">{journeyTitle}</h2>
            <div className="finder-profile__journey-bean">
              <Coffee size={20} aria-hidden="true" />
              <div>
                <span>เมล็ดที่ใช้ / Featured bean</span>
                <strong>{cleanDemoCopy(traceOrigin.name.th)}</strong>
                <small>{cleanDemoCopy(traceOrigin.name.en)}</small>
              </div>
            </div>
            <p>{journeyDescription}</p>

            {hasNanCoffeeConnection ? (
              <ul aria-label="ส่วนของเส้นทางกาแฟที่เกิดขึ้นในจังหวัดน่าน">
                {isNanGrown ? <li>เมล็ดปลูกในน่าน</li> : null}
                {isNanProcessed ? <li>แปรรูปในน่าน</li> : null}
                {isNanRoasted ? <li>คั่วในน่าน</li> : null}
              </ul>
            ) : (
              <small>ล็อตปัจจุบันมีต้นทางและสถานที่คั่วอยู่นอกจังหวัดน่าน</small>
            )}
          </div>

          <ol className="finder-profile__journey-steps">
            <li>
              <span className="finder-profile__journey-number" aria-hidden="true">01</span>
              <span className="finder-profile__journey-icon" aria-hidden="true">
                <Sprout size={20} />
              </span>
              <div>
                <span>ผู้ปลูกและแหล่งปลูก</span>
                <strong>{cleanDemoCopy(traceOrigin.producerOrCommunity.th)}</strong>
                <p>
                  {cleanDemoCopy(traceOrigin.origin.locality)}, {cleanDemoCopy(traceOrigin.origin.province)}
                </p>
              </div>
              <span
                className={`finder-profile__journey-status${isNanGrown ? " finder-profile__journey-status--nan" : ""}`}
              >
                ต้นทางในน่าน
              </span>
            </li>
            <li>
              <span className="finder-profile__journey-number" aria-hidden="true">02</span>
              <span className="finder-profile__journey-icon" aria-hidden="true">
                <Sparkles size={20} />
              </span>
              <div>
                <span>การแปรรูป</span>
                <strong>{processLabels[traceOrigin.process]}</strong>
                <p>
                  {cleanDemoCopy(traceOrigin.processingLocation.locality)}, {cleanDemoCopy(traceOrigin.processingLocation.province)}
                </p>
              </div>
              <span
                className={`finder-profile__journey-status${isNanProcessed ? " finder-profile__journey-status--nan" : ""}`}
              >
                {isNanProcessed ? "แปรรูปในน่าน" : `แปรรูป ${cleanDemoCopy(traceOrigin.processingLocation.province)}`}
              </span>
            </li>
            <li>
              <span className="finder-profile__journey-number" aria-hidden="true">03</span>
              <span className="finder-profile__journey-icon" aria-hidden="true">
                <Coffee size={20} />
              </span>
              <div>
                <span>การคั่ว</span>
                <strong>{roastLabels[traceOrigin.roastLevel]}</strong>
                <p>
                  {cleanDemoCopy(traceOrigin.roasterLocation.locality)}, {cleanDemoCopy(traceOrigin.roasterLocation.province)}
                </p>
              </div>
              <span
                className={`finder-profile__journey-status${isNanRoasted ? " finder-profile__journey-status--nan" : ""}`}
              >
                {isNanRoasted ? "คั่วในน่าน" : `คั่ว ${cleanDemoCopy(traceOrigin.roasterLocation.province)}`}
              </span>
            </li>
            <li>
              <span className="finder-profile__journey-number" aria-hidden="true">04</span>
              <span className="finder-profile__journey-icon" aria-hidden="true">
                <MapPin size={20} />
              </span>
              <div>
                <span>ร้านและวิธีชง</span>
                <strong>{cleanDemoCopy(cafe.name.th)}</strong>
                <p>
                  {traceOrigin.brewMethods.length
                    ? traceOrigin.brewMethods.map((method) => brewMethodLabels[method]).join(" · ")
                    : UNKNOWN_ORIGIN_TEXT}
                </p>
              </div>
              <span className="finder-profile__journey-status finder-profile__journey-status--nan">
                เสิร์ฟในน่าน
              </span>
            </li>
          </ol>
          </section>
        ) : null}

        <section
          className="finder-profile__section finder-profile__menu-section"
          aria-labelledby="finder-recommended-menu-heading"
        >
          <div className="finder-profile__section-heading">
            <div>
              <span>ร้านนี้แนะนำ</span>
              <h2 id="finder-recommended-menu-heading">Recommended Menu</h2>
              <p>เมนูที่มีป้ายด้านล่างใช้ Single Origin ล็อตเดียวกับเส้นทางที่เล่าไว้ในหน้านี้</p>
            </div>
            <Coffee size={28} aria-hidden="true" />
          </div>

          <ol className="finder-profile__menu-grid">
            {recommendedMenus.map((menu, index) => (
              <li key={menu.id}>
                <article
                  className={`finder-profile__menu-card${menu.usesFeaturedSingleOrigin ? " finder-profile__menu-card--featured" : ""}${menu.usesFeaturedSingleOrigin && hasNanCoffeeConnection ? " finder-profile__menu-card--nan" : ""}`}
                >
                  {menu.usesFeaturedSingleOrigin ? (
                    <span className="finder-profile__menu-origin-badge">
                      <Sprout size={14} aria-hidden="true" />
                      {featuredLotLabel}
                    </span>
                  ) : null}
                  <div className="finder-profile__menu-topline">
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{menu.price.amount > 0 ? `฿${formatNumber(menu.price.amount)}` : "ยังไม่ระบุราคา"}</strong>
                  </div>
                  <div>
                    <h3>{cleanDemoCopy(menu.name.th)}</h3>
                    <p className="finder-profile__english-name">{cleanDemoCopy(menu.name.en)}</p>
                  </div>
                  <p>{cleanDemoCopy(menu.description.th)}</p>
                  <ul className="finder-profile__tags" aria-label={`โทนรสของ${cleanDemoCopy(menu.name.th)}`}>
                    {menu.sensoryTags.map((tag) => (
                      <li key={`${menu.id}-${tag.en}`}>
                        {cleanDemoCopy(tag.th)} <span>/ {cleanDemoCopy(tag.en)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </section>

        {originCards.length ? (
          <section
            className="finder-profile__section finder-profile__origin-section"
            aria-labelledby="finder-single-origin-heading"
          >
            <div className="finder-profile__section-heading">
              <div>
                <span>เมล็ดที่ร้านเลือกใช้</span>
                <h2 id="finder-single-origin-heading">Single Origin Coffee</h2>
                <p>ร้านมี {originCards.length.toLocaleString("th-TH")} เมล็ด · แสดงที่มา โปรเซส ระดับคั่ว และวิธีชงแยกแต่ละล็อต</p>
              </div>
              <Mountain size={29} aria-hidden="true" />
            </div>

            <div className="finder-profile__origin-list">
              {originCards.map((card) => (
                <OriginLabelCard
                  key={card.key}
                  card={card}
                  showFeatured={originCards.length > 1}
                />
              ))}
            </div>
          </section>
        ) : null}

        {cafe.workation && internetReport ? (
          <section
            className="finder-profile__internet"
            aria-labelledby="finder-internet-heading"
          >
            <div className="finder-profile__internet-heading">
              <div>
                <span>
                  <Wifi size={17} aria-hidden="true" />
                  Workation Internet
                </span>
                <h2 id="finder-internet-heading">ข้อมูลอินเทอร์เน็ตของร้าน</h2>
                <p>ความเร็วอาจเปลี่ยนแปลงตามช่วงเวลาและจำนวนผู้ใช้งาน</p>
              </div>
              <Laptop size={30} aria-hidden="true" />
            </div>

            <dl className="finder-profile__speed-grid">
              <div>
                <dt>
                  <ArrowDownToLine size={18} aria-hidden="true" /> Download
                </dt>
                <dd>{formatNumber(internetReport.downloadMbps)} <small>Mbps</small></dd>
              </div>
              <div>
                <dt>
                  <ArrowUpFromLine size={18} aria-hidden="true" /> Upload
                </dt>
                <dd>{formatNumber(internetReport.uploadMbps)} <small>Mbps</small></dd>
              </div>
              <div>
                <dt>
                  <Gauge size={18} aria-hidden="true" /> Ping
                </dt>
                <dd>{formatNumber(internetReport.pingMs)} <small>ms</small></dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section
          className="finder-profile__section finder-profile__reviews-section"
          aria-labelledby="finder-customer-reviews-heading"
        >
          <div className="finder-profile__section-heading">
            <div>
              <span>เสียงจากผู้มาเยือน</span>
              <h2 id="finder-customer-reviews-heading">Customer Reviews</h2>
              <p>
                รีวิวที่กล่าวถึงเมนูและประสบการณ์ของร้านโดยตรง พร้อมป้ายกำกับเฉพาะเมนูที่ใช้ล็อตแนะนำ
              </p>
            </div>
            <MessageCircle size={28} aria-hidden="true" />
          </div>

          <ul className="finder-profile__review-list">
            {detail.customerReviews.map((review) => {
              const referencedMenus = review.referencedMenuIds.flatMap((menuId) => {
                const menu = menusById.get(menuId);
                return menu ? [menu] : [];
              });

              return (
                <li key={review.id}>
                  <article className="finder-profile__review-card">
                    <header>
                      <div className="finder-profile__reviewer-avatar" aria-hidden="true">
                        {review.reviewerName.slice(-2)}
                      </div>
                      <div>
                        <h3>{cleanDemoCopy(review.reviewerName)}</h3>
                        <RatingStars rating={review.rating} />
                      </div>
                    </header>
                    <p>{cleanDemoCopy(review.body.th)}</p>
                    {referencedMenus.length > 0 ? (
                      <div className="finder-profile__review-menus">
                        <span>เมนูที่กล่าวถึง</span>
                        <ul>
                          {referencedMenus.map((menu) => (
                            <li
                              key={`${review.id}-${menu.id}`}
                              className={menu.usesFeaturedSingleOrigin ? "finder-profile__review-menu--featured" : undefined}
                            >
                              <Coffee size={14} aria-hidden="true" />
                              <span>{cleanDemoCopy(menu.name.th)}</span>
                              {menu.usesFeaturedSingleOrigin ? (
                                <small>{featuredLotLabel}</small>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          className={`finder-profile__nan-cta${hasNanCoffeeConnection ? " finder-profile__nan-cta--connected" : ""}`}
          aria-labelledby="finder-nan-cta-heading"
        >
          <div>
            <span>
              <Compass size={17} aria-hidden="true" />
              Continue the coffee trail
            </span>
            <h2 id="finder-nan-cta-heading">{ctaHeading}</h2>
            <p>{ctaDescription}</p>
          </div>
          <Link href="/#coffee-finder-heading">
            {ctaLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
