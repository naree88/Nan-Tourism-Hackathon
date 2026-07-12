"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  BadgeCheck,
  Clock3,
  Coffee,
  DatabaseZap,
  Gauge,
  Laptop,
  Wifi,
} from "lucide-react";
import type { MerchantProfileSnapshot } from "@/lib/merchant/profile";

export const APPROVED_PROFILE_STORAGE_KEY = "nan-coffee:approved-profile:v1";

export type ApprovedDemoProfile = {
  cafeId: string;
  approvedAt: string;
  profile: MerchantProfileSnapshot;
  updatedOfferingName?: string;
};

/** @deprecated Use APPROVED_PROFILE_STORAGE_KEY for new writes. */
export const APPROVED_OFFERING_STORAGE_KEY = "nan-coffee:approved-offering:cafe-demo-khuang-cloud";

/** @deprecated Kept so older demo clients can still read their approved offering. */
export type ApprovedDemoOffering = {
  cafeId: string;
  approvedAt: string;
  copy: { th: string; en: string };
  structured: {
    beanName?: string;
    originName?: string;
    process?: string;
    roastLevel?: string;
    tastingNotes?: Array<{ th: string; en: string }>;
    brewMethods?: string[];
    price?: { amount: number; currency: string };
    availability?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApprovedProfile(rawValue: string): ApprovedDemoProfile | null {
  try {
    const value: unknown = JSON.parse(rawValue);
    if (!isRecord(value) || typeof value.cafeId !== "string" || typeof value.approvedAt !== "string") return null;
    if (value.updatedOfferingName !== undefined && typeof value.updatedOfferingName !== "string") return null;
    if (!isRecord(value.profile) || !isRecord(value.profile.cafe) || !Array.isArray(value.profile.menuItems)) return null;
    if (
      typeof value.profile.cafe.id !== "string"
      || typeof value.profile.cafe.slug !== "string"
      || typeof value.profile.cafe.nameTh !== "string"
      || typeof value.profile.updatedAt !== "string"
    ) {
      return null;
    }
    return value as ApprovedDemoProfile;
  } catch {
    return null;
  }
}

function parseLegacyOffering(rawValue: string): ApprovedDemoOffering | null {
  try {
    const value: unknown = JSON.parse(rawValue);
    if (!isRecord(value) || typeof value.cafeId !== "string" || typeof value.approvedAt !== "string") return null;
    if (!isRecord(value.copy) || typeof value.copy.th !== "string" || typeof value.copy.en !== "string") return null;
    if (!isRecord(value.structured)) return null;
    return value as ApprovedDemoOffering;
  } catch {
    return null;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(value);
}

function getStoredApproval(): string | null {
  const profile = window.localStorage.getItem(APPROVED_PROFILE_STORAGE_KEY);
  if (profile) return `profile:${profile}`;

  const legacyOffering = window.localStorage.getItem(APPROVED_OFFERING_STORAGE_KEY);
  return legacyOffering ? `legacy:${legacyOffering}` : null;
}

export function useApprovedDemoProfile(cafeId: string): ApprovedDemoProfile | null {
  const storedValue = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getStoredApproval,
    () => null,
  );

  return useMemo(() => {
    if (!storedValue?.startsWith("profile:")) return null;
    const approval = parseApprovedProfile(storedValue.slice("profile:".length));
    return approval?.cafeId === cafeId ? approval : null;
  }, [cafeId, storedValue]);
}

function ApprovedProfileSummary({ approval }: { approval: ApprovedDemoProfile }) {
  const { profile } = approval;
  const bean = profile.featuredOffering;
  const workation = profile.workation;

  return (
    <div className="offering-card" style={{ borderColor: "rgba(62, 106, 87, .38)", background: "var(--forest-100)" }}>
      <div className="offering-title">
        <div>
          <span className="badge"><BadgeCheck size={13} aria-hidden="true" /> เจ้าของร้านอนุมัติแล้ว</span>
          <h3 style={{ marginTop: 8 }}>{profile.cafe.nameTh}</h3>
          <p>ข้อมูลหน้าร้านเวอร์ชันล่าสุดในเบราว์เซอร์นี้</p>
        </div>
      </div>

      {bean ? (
        <section aria-label="เมล็ดกาแฟที่อนุมัติ">
          <div className="offering-title">
            <div>
              <span className="pick-item__label"><Coffee size={14} aria-hidden="true" /> Featured Bean</span>
              <strong>{bean.beanName || "เมล็ดที่เพิ่งอัปเดต"}</strong>
              <p>{[bean.originName, bean.originProvince, bean.process, bean.roastLevel].filter(Boolean).join(" · ")}</p>
            </div>
            {bean.price ? <span className="price">฿{formatNumber(bean.price.amount)}</span> : null}
          </div>
          {bean.tastingNotes.length ? (
            <div className="tasting-notes">
              {bean.tastingNotes.map((note) => <span key={`${note.th}-${note.en}`}>{note.th}</span>)}
            </div>
          ) : null}
        </section>
      ) : null}

      {profile.menuItems.length ? (
        <section aria-label="เมนูที่อนุมัติ">
          <span className="pick-item__label"><Coffee size={14} aria-hidden="true" /> Recommended Menu</span>
          <div className="pick-list">
            {profile.menuItems.slice(0, 3).map((menu) => (
              <div className="pick-item" key={menu.id || `${menu.nameTh}-${menu.priceThb ?? ""}`}>
                <div className="offering-title">
                  <strong>{menu.nameTh}</strong>
                  {menu.priceThb !== undefined ? <span className="price">฿{formatNumber(menu.priceThb)}</span> : null}
                </div>
                <p>
                  {[
                    menu.isCafePick ? "ร้านแนะนำ" : null,
                    menu.usesFeaturedSingleOrigin ? "ใช้ Featured Bean" : null,
                    menu.isAvailable ? "พร้อมเสิร์ฟ" : "ยังไม่พร้อมเสิร์ฟ",
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {workation ? (
        <section aria-label="ข้อมูล Workation ที่อนุมัติ">
          <span className="pick-item__label"><Laptop size={14} aria-hidden="true" /> Workation</span>
          <dl className="definition-grid">
            <div className="definition-row">
              <dt><Wifi size={14} aria-hidden="true" /> Wi-Fi</dt>
              <dd>{workation.wifi === "available" ? "มี Wi-Fi" : workation.wifi === "unavailable" ? "ไม่มี Wi-Fi" : "ยังไม่ระบุ"}</dd>
            </div>
            {workation.downloadMbps !== undefined ? (
              <div className="definition-row"><dt>Download</dt><dd>{formatNumber(workation.downloadMbps)} Mbps</dd></div>
            ) : null}
            {workation.uploadMbps !== undefined ? (
              <div className="definition-row"><dt>Upload</dt><dd>{formatNumber(workation.uploadMbps)} Mbps</dd></div>
            ) : null}
            {workation.pingMs !== undefined ? (
              <div className="definition-row"><dt><Gauge size={14} aria-hidden="true" /> Ping</dt><dd>{formatNumber(workation.pingMs)} ms</dd></div>
            ) : null}
          </dl>
          {workation.policyText ? <p>{workation.policyText}</p> : null}
        </section>
      ) : null}

      {profile.openingNote ? (
        <p><Clock3 size={14} aria-hidden="true" /> {profile.openingNote}</p>
      ) : null}

      <div className="meta-row">
        <span><Clock3 size={14} aria-hidden="true" /> อนุมัติ {formatDateTime(approval.approvedAt)}</span>
        <span><DatabaseZap size={14} aria-hidden="true" /> เก็บในเบราว์เซอร์นี้</span>
      </div>
    </div>
  );
}

function LegacyOfferingSummary({ offering }: { offering: ApprovedDemoOffering }) {
  const data = offering.structured;
  return (
    <div className="offering-card" style={{ borderColor: "rgba(62, 106, 87, .38)", background: "var(--forest-100)" }}>
      <div className="offering-title">
        <div>
          <span className="badge"><BadgeCheck size={13} aria-hidden="true" /> เจ้าของร้านอนุมัติแล้ว</span>
          <h3 style={{ marginTop: 8 }}>{data.beanName || "เมล็ดที่เพิ่งอัปเดต"}</h3>
          <p>{[data.originName, data.process, data.roastLevel].filter(Boolean).join(" · ")}</p>
        </div>
        {data.price ? <span className="price">฿{formatNumber(data.price.amount)}</span> : null}
      </div>
      {data.tastingNotes?.length ? (
        <div className="tasting-notes">
          {data.tastingNotes.map((note) => <span key={`${note.th}-${note.en}`}>{note.th}</span>)}
        </div>
      ) : null}
      <p>{offering.copy.th}</p>
      <div className="meta-row">
        <span><Clock3 size={14} aria-hidden="true" /> อนุมัติ {formatDateTime(offering.approvedAt)}</span>
        <span><DatabaseZap size={14} aria-hidden="true" /> ข้อมูลรูปแบบเดิม</span>
      </div>
    </div>
  );
}

export function ApprovedDemoOfferingBanner({ cafeId }: { cafeId: string }) {
  const storedValue = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getStoredApproval,
    () => null,
  );

  if (!storedValue) return null;

  if (storedValue.startsWith("profile:")) {
    const approval = parseApprovedProfile(storedValue.slice("profile:".length));
    return approval?.cafeId === cafeId ? <ApprovedProfileSummary approval={approval} /> : null;
  }

  const legacyOffering = parseLegacyOffering(storedValue.slice("legacy:".length));
  return legacyOffering?.cafeId === cafeId ? <LegacyOfferingSummary offering={legacyOffering} /> : null;
}

export const ApprovedDemoProfileBanner = ApprovedDemoOfferingBanner;
