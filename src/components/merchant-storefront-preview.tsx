import {
  BadgeCheck,
  Clock3,
  Coffee,
  FileClock,
  Gauge,
  Laptop,
  MapPin,
  PlugZap,
  Sprout,
  Video,
  Wifi,
} from "lucide-react";
import type { MerchantProfileSnapshot } from "@/lib/merchant/profile";

export type MerchantStorefrontPreviewProps = {
  current: MerchantProfileSnapshot;
  proposed: MerchantProfileSnapshot;
  status: "draft" | "published";
};

type StorefrontOffering = NonNullable<MerchantProfileSnapshot["featuredOffering"]>;

const processLabels: Record<string, string> = {
  natural: "Natural",
  washed: "Washed",
  honey: "Honey",
  anaerobic: "Anaerobic",
  "carbonic-maceration": "Carbonic Maceration",
  other: "โปรเซสอื่น",
  unknown: "ยังไม่ระบุ",
};

const roastLabels: Record<string, string> = {
  light: "คั่วอ่อน",
  "medium-light": "คั่วกลางอ่อน",
  medium: "คั่วกลาง",
  "medium-dark": "คั่วกลางเข้ม",
  dark: "คั่วเข้ม",
  unknown: "ยังไม่ระบุ",
};

const availabilityLabels: Record<string, string> = {
  available: "พร้อมเสิร์ฟ",
  limited: "มีจำนวนจำกัด",
  unavailable: "ยังไม่พร้อมเสิร์ฟ",
  unknown: "รอยืนยันสถานะ",
};

const wifiLabels: Record<string, string> = {
  available: "มี Wi-Fi",
  unavailable: "ไม่มี Wi-Fi",
  unknown: "ยังไม่ระบุ",
};

const outletLabels: Record<string, string> = {
  "at-most-seats": "มีปลั๊กเกือบทุกที่นั่ง",
  some: "มีปลั๊กบางจุด",
  none: "ไม่มีปลั๊ก",
  unknown: "ยังไม่ระบุ",
};

const suitabilityLabels: Record<string, string> = {
  good: "เหมาะ",
  possible: "พอใช้ได้",
  "not-suitable": "ไม่เหมาะ",
  unknown: "ยังไม่ระบุ",
};

function hasChanged(current: unknown, proposed: unknown): boolean {
  return JSON.stringify(current) !== JSON.stringify(proposed);
}

function normalizedBeanName(offering: StorefrontOffering): string | undefined {
  const name = offering.beanName?.trim().normalize("NFC").toLocaleLowerCase("th-TH");
  return name || undefined;
}

function isSameOffering(current: StorefrontOffering, proposed: StorefrontOffering): boolean {
  if (current.id && proposed.id) return current.id === proposed.id;

  const currentName = normalizedBeanName(current);
  const proposedName = normalizedBeanName(proposed);
  return Boolean(currentName && proposedName && currentName === proposedName);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(value);
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function ChangeMarker({ changed }: { changed: boolean }) {
  if (!changed) return null;
  return <span className="merchant-storefront-preview__changed">มีการเปลี่ยนแปลง</span>;
}

export function MerchantStorefrontPreview({
  current,
  proposed,
  status,
}: MerchantStorefrontPreviewProps) {
  const publicView = status === "published";
  const offerings = proposed.offerings
    ?? (proposed.featuredOffering ? [proposed.featuredOffering] : []);
  const currentOfferings = current.offerings
    ?? (current.featuredOffering ? [current.featuredOffering] : []);
  const removedOfferings = publicView
    ? []
    : currentOfferings.filter((currentOffering) =>
        !offerings.some((proposedOffering) =>
          isSameOffering(currentOffering, proposedOffering),
        ),
      );
  const workation = proposed.workation;
  const heroChanged = hasChanged(
    { cafe: current.cafe, openingNote: current.openingNote },
    { cafe: proposed.cafe, openingNote: proposed.openingNote },
  );
  const offeringChanged = hasChanged(currentOfferings, offerings);
  const menuChanged = hasChanged(current.menuItems, proposed.menuItems);
  const workationChanged = hasChanged(current.workation, proposed.workation);

  return (
    <article
      className="merchant-storefront-preview"
      data-status={status}
      aria-label={publicView ? "หน้าร้านปัจจุบัน" : "ตัวอย่างหน้าร้านหลังอนุมัติ"}
    >
      <div className="merchant-storefront-preview__toolbar">
        <div>
          <span className="merchant-storefront-preview__eyebrow">{publicView ? "Public storefront" : "Storefront preview"}</span>
          <strong>{publicView ? "หน้าร้านปัจจุบัน" : "ตัวอย่างหน้าร้านหลังอนุมัติ"}</strong>
        </div>
        <span className={`merchant-storefront-preview__status merchant-storefront-preview__status--${status}`} role="status">
          {status === "published" ? (
            <BadgeCheck size={16} aria-hidden="true" />
          ) : (
            <FileClock size={16} aria-hidden="true" />
          )}
          {status === "published" ? "Published · เผยแพร่แล้ว" : "Draft · ยังไม่เผยแพร่"}
        </span>
      </div>

      <header className="merchant-storefront-preview__hero" data-changed={heroChanged || undefined}>
        <div className="merchant-storefront-preview__hero-topline">
          <span>
            <Coffee size={17} aria-hidden="true" /> Café in Nan
          </span>
          <ChangeMarker changed={heroChanged} />
        </div>
        <h2>{proposed.cafe.nameTh}</h2>
        {proposed.cafe.storyTh ? <p>{proposed.cafe.storyTh}</p> : null}
        <div className="merchant-storefront-preview__hero-meta">
          {proposed.cafe.addressTh ? (
            <span><MapPin size={15} aria-hidden="true" /> {proposed.cafe.addressTh}</span>
          ) : null}
          {proposed.openingNote ? (
            <span><Clock3 size={15} aria-hidden="true" /> {proposed.openingNote}</span>
          ) : null}
        </div>
      </header>

      <div className="merchant-storefront-preview__content">
        <section className="merchant-storefront-preview__section" data-changed={offeringChanged || undefined}>
          <div className="merchant-storefront-preview__section-heading">
            <div>
              <span>เมล็ดที่ร้านเลือกใช้</span>
              <h3>Single Origin Coffee · {offerings.length.toLocaleString("th-TH")} เมล็ด</h3>
            </div>
            <ChangeMarker changed={offeringChanged} />
          </div>

          {offerings.length || removedOfferings.length ? (
            <>
              {!publicView && offerings.length === 0 ? (
                <p className="merchant-storefront-preview__empty">
                  หลังอนุมัติ หน้าร้านจะไม่แสดงส่วน Single Origin Coffee
                </p>
              ) : null}
              <div className="merchant-storefront-preview__offering-list">
              {offerings.map((offering, index) => (
                <article className="merchant-storefront-preview__offering" key={offering.id || offering.beanName || `offering-${index + 1}`}>
                  <div className="merchant-storefront-preview__offering-heading">
                    <div>
                      <Sprout size={20} aria-hidden="true" />
                      <h4>{offering.beanName || `เมล็ดรายการที่ ${index + 1}`}</h4>
                      <p>
                        {[offering.originName, offering.originProvince, offering.producer]
                          .filter(Boolean)
                          .join(" · ") || "ยังไม่ได้ระบุแหล่งที่มา"}
                      </p>
                    </div>
                    {offering.price ? <strong>฿{formatNumber(offering.price.amount)}</strong> : null}
                  </div>

                  <dl className="merchant-storefront-preview__definition-grid">
                    <div><dt>Process</dt><dd>{processLabels[offering.process || "unknown"]}</dd></div>
                    <div><dt>Roast</dt><dd>{roastLabels[offering.roastLevel || "unknown"]}</dd></div>
                    {offering.varietal ? <div><dt>Varietal</dt><dd>{offering.varietal}</dd></div> : null}
                    {offering.altitudeMeters ? <div><dt>Altitude</dt><dd>{formatNumber(offering.altitudeMeters.min)}–{formatNumber(offering.altitudeMeters.max)} m</dd></div> : null}
                    {offering.processingLocation ? <div><dt>Processed in</dt><dd>{[offering.processingLocation.locality, offering.processingLocation.province].filter(Boolean).join(", ")}</dd></div> : null}
                    {offering.roasterLocation ? <div><dt>Roasted in</dt><dd>{[offering.roasterLocation.locality, offering.roasterLocation.province].filter(Boolean).join(", ")}</dd></div> : null}
                    <div><dt>Brew</dt><dd>{offering.brewMethods.length ? offering.brewMethods.join(", ") : "ยังไม่ระบุ"}</dd></div>
                    <div><dt>Availability</dt><dd>{availabilityLabels[offering.availability || "unknown"]}</dd></div>
                  </dl>

                  {offering.tastingNotes.length ? (
                    <ul className="merchant-storefront-preview__tags" aria-label={`Taste notes ของ ${offering.beanName || `เมล็ดรายการที่ ${index + 1}`}`}>
                      {offering.tastingNotes.map((note) => (
                        <li key={`${note.th}-${note.en}`}>{note.th}<span> / {note.en}</span></li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
                {!publicView ? removedOfferings.map((offering, index) => (
                  <article
                    className="merchant-storefront-preview__offering merchant-storefront-preview__offering--removed"
                    key={`removed-${offering.id || normalizedBeanName(offering) || index + 1}`}
                  >
                    <span className="merchant-storefront-preview__removed-label">
                      จะนำออกเมื่ออนุมัติ
                    </span>
                    <div className="merchant-storefront-preview__offering-heading">
                      <div>
                        <Sprout size={20} aria-hidden="true" />
                        <h4>{offering.beanName || `เมล็ดรายการที่ ${index + 1}`}</h4>
                        <p>
                          {[offering.originName, offering.originProvince, offering.producer]
                            .filter(Boolean)
                            .join(" · ") || "ยังไม่ได้ระบุแหล่งที่มา"}
                        </p>
                      </div>
                    </div>
                  </article>
                )) : null}
              </div>
            </>
          ) : (
            <p className="merchant-storefront-preview__empty">
              {publicView
                ? "ยังไม่มีข้อมูลเมล็ดกาแฟที่จะแสดง"
                : "หลังอนุมัติ หน้าร้านจะไม่แสดงส่วน Single Origin Coffee"}
            </p>
          )}
        </section>

        <section className="merchant-storefront-preview__section" data-changed={menuChanged || undefined}>
          <div className="merchant-storefront-preview__section-heading">
            <div>
              <span>ร้านนี้แนะนำ</span>
              <h3>Recommended Menu</h3>
            </div>
            <ChangeMarker changed={menuChanged} />
          </div>

          {proposed.menuItems.length ? (
            <ul className="merchant-storefront-preview__menu-list">
              {proposed.menuItems.map((menu) => (
                <li key={menu.id || `${menu.nameTh}-${menu.nameEn || ""}-${menu.priceThb ?? ""}`}>
                  <article className="merchant-storefront-preview__menu-card">
                    <div>
                      <div className="merchant-storefront-preview__menu-badges">
                        {menu.isCafePick ? <span>ร้านแนะนำ</span> : null}
                        {menu.usesFeaturedSingleOrigin ? <span>ใช้ Featured Bean</span> : null}
                        {!menu.isAvailable ? <span>ยังไม่พร้อมเสิร์ฟ</span> : null}
                      </div>
                      <h4>{menu.nameTh}</h4>
                      {menu.nameEn ? <p className="merchant-storefront-preview__menu-english">{menu.nameEn}</p> : null}
                      {menu.descriptionTh ? <p>{menu.descriptionTh}</p> : null}
                    </div>
                    {menu.priceThb !== undefined ? <strong>฿{formatNumber(menu.priceThb)}</strong> : null}
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="merchant-storefront-preview__empty">ยังไม่มีเมนูแนะนำ</p>
          )}
        </section>

        <section className="merchant-storefront-preview__section" data-changed={workationChanged || undefined}>
          <div className="merchant-storefront-preview__section-heading">
            <div>
              <span>ข้อมูลสำหรับนั่งทำงาน</span>
              <h3>Workation</h3>
            </div>
            <ChangeMarker changed={workationChanged} />
          </div>

          {workation ? (
            <div className="merchant-storefront-preview__workation">
              <dl className="merchant-storefront-preview__workation-details">
                <div><dt><Wifi size={16} aria-hidden="true" /> Wi-Fi</dt><dd>{wifiLabels[workation.wifi || "unknown"]}</dd></div>
                <div><dt><PlugZap size={16} aria-hidden="true" /> ปลั๊ก</dt><dd>{outletLabels[workation.outlets || "unknown"]}</dd></div>
                <div><dt><Laptop size={16} aria-hidden="true" /> ที่นั่งทำงาน</dt><dd>{suitabilityLabels[workation.workSeating || "unknown"]}</dd></div>
                <div><dt><Video size={16} aria-hidden="true" /> Video call</dt><dd>{suitabilityLabels[workation.videoCalls || "unknown"]}</dd></div>
              </dl>

              {workation.downloadMbps !== undefined || workation.uploadMbps !== undefined || workation.pingMs !== undefined ? (
                <dl className="merchant-storefront-preview__speed-grid">
                  <div><dt>Download</dt><dd>{workation.downloadMbps !== undefined ? formatNumber(workation.downloadMbps) : "—"}<small> Mbps</small></dd></div>
                  <div><dt>Upload</dt><dd>{workation.uploadMbps !== undefined ? formatNumber(workation.uploadMbps) : "—"}<small> Mbps</small></dd></div>
                  <div><dt><Gauge size={15} aria-hidden="true" /> Ping</dt><dd>{workation.pingMs !== undefined ? formatNumber(workation.pingMs) : "—"}<small> ms</small></dd></div>
                </dl>
              ) : null}

              {workation.policyText ? <p className="merchant-storefront-preview__policy">{workation.policyText}</p> : null}
            </div>
          ) : (
            <p className="merchant-storefront-preview__empty">ยังไม่มีข้อมูล Workation</p>
          )}
        </section>
      </div>

      <footer className="merchant-storefront-preview__footer">
        อัปเดตล่าสุด {formatUpdatedAt(proposed.updatedAt)}
      </footer>
    </article>
  );
}
