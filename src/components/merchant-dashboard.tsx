"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Coffee,
  PencilLine,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";

import {
  APPROVED_PROFILE_STORAGE_KEY,
  type ApprovedDemoProfile,
  useApprovedDemoProfile,
} from "./approved-demo-offering";
import {
  MerchantPhotoInput,
  type MerchantPhotoValue,
} from "./merchant-photo-input";
import { MerchantStorefrontPreview } from "./merchant-storefront-preview";
import { VoiceInput } from "./voice-input";
import { demoMerchantVoiceUpdate } from "@/lib/demo";
import { buildMerchantDraftFromStructuredUpdate } from "@/lib/domain";
import type {
  MerchantDraft,
  MerchantDraftProviderMode,
  MerchantInputMethod,
  MerchantMenuItemPatch,
  MerchantOfferingPatch,
  MerchantWorkationPatch,
  StructuredMerchantUpdate,
} from "@/lib/domain";
import {
  applyMerchantUpdateToProfile,
  type MerchantProfileSnapshot,
} from "@/lib/merchant/profile";

type Props = {
  currentProfile: MerchantProfileSnapshot;
  ownerProfileId: string;
  demo: boolean;
  providerMode: MerchantDraftProviderMode;
};

type InputSource = "text" | "voice_transcript" | "demo";
type BrewMethod = MerchantOfferingPatch["brewMethods"][number];
type ManagedOffering = NonNullable<MerchantProfileSnapshot["offerings"]>[number];

const BREW_METHOD_OPTIONS: ReadonlyArray<{ value: BrewMethod; label: string }> = [
  { value: "filter", label: "Filter / ดริป" },
  { value: "espresso", label: "Espresso" },
  { value: "aeropress", label: "AeroPress" },
  { value: "cold-brew", label: "Cold brew" },
  { value: "mokapot", label: "Moka pot" },
  { value: "other", label: "อื่น ๆ" },
];

function inputMethodFor(source: InputSource, hasPhoto: boolean, hasText: boolean): MerchantInputMethod {
  if (hasPhoto && hasText) return "multimodal";
  if (hasPhoto) return "photo";
  return source;
}

function asOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function MerchantDashboard({
  currentProfile,
  ownerProfileId,
  demo,
  providerMode,
}: Props) {
  const storedApproval = useApprovedDemoProfile(currentProfile.cafe.id);
  const [sessionProfile, setSessionProfile] = useState<MerchantProfileSnapshot | null>(null);
  const baseProfile = sessionProfile
    ?? (demo ? storedApproval?.profile : undefined)
    ?? currentProfile;
  const [rawInput, setRawInput] = useState("");
  const [inputSource, setInputSource] = useState<InputSource>("text");
  const [photo, setPhoto] = useState<MerchantPhotoValue | null>(null);
  const [draft, setDraft] = useState<MerchantDraft | null>(null);
  const [removalCandidate, setRemovalCandidate] = useState<ManagedOffering | null>(null);
  const [approvedProfile, setApprovedProfile] = useState<MerchantProfileSnapshot | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"approved" | "rejected" | null>(null);

  const proposedProfile = useMemo(() => {
    if (!draft) return baseProfile;
    return {
      ...applyMerchantUpdateToProfile(baseProfile, draft.structuredUpdate),
      updatedAt: draft.createdAt,
    };
  }, [baseProfile, draft]);
  const managedOfferings = baseProfile.offerings
    ?? (baseProfile.featuredOffering ? [baseProfile.featuredOffering] : []);

  async function createOfferingRemovalDraft() {
    const target = removalCandidate;
    const beanName = target?.beanName?.trim();
    if (!target || !beanName) {
      setError("ไม่พบชื่อเมล็ดที่ต้องการนำออก กรุณาเลือกใหม่อีกครั้งค่ะ");
      return;
    }
    if (!demo && !target.id) {
      setError("เมล็ดนี้ไม่มีรหัสสำหรับตรวจสอบกับ Supabase กรุณาโหลดหน้าใหม่ค่ะ");
      return;
    }

    setError("");
    setSuccess(null);
    setConfirmed(false);
    setIsLoading(true);

    try {
      if (demo) {
        const createdAt = new Date().toISOString();
        const structuredUpdate: StructuredMerchantUpdate = {
          kinds: ["offering"],
          offeringRemovals: [{
            ...(target.id ? { offeringId: target.id } : {}),
            beanName,
            reason: "sold-out",
            ...(target.updatedAt ? { expectedUpdatedAt: target.updatedAt } : {}),
          }],
          fieldEvidence: [{
            field: "offeringRemovals[0].beanName",
            sourceText: `เจ้าของร้านเลือกนำ ${beanName} ออกจากหน้าร้าน`,
            confidence: "high",
          }],
          unresolvedFields: [],
          extractorVersion: "merchant-offering-removal-v1.0.0",
        };
        setDraft(buildMerchantDraftFromStructuredUpdate(
          `นำเมล็ด ${beanName} ออกจากหน้าร้าน เนื่องจากจำหน่ายหมดแล้ว`,
          structuredUpdate,
          {
            cafeId: baseProfile.cafe.id,
            ownerProfileId,
            draftId: crypto.randomUUID(),
            createdAt,
            inputMethod: "text",
            sourceImages: [],
            generation: {
              provider: "rules",
              promptVersion: "merchant-offering-removal-v1.0.0",
              imageAnalysis: "not-provided",
            },
          },
        ));
      } else {
        const response = await fetch("/api/merchant/offering-removal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cafeId: baseProfile.cafe.id,
            offeringId: target.id,
            beanName,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "สร้างร่างนำเมล็ดออกไม่สำเร็จ");
        if (payload.currentProfile) setSessionProfile(payload.currentProfile);
        setDraft(payload.draft);
      }
      setRemovalCandidate(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "สร้างร่างนำเมล็ดออกไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  function handleTypedInput(value: string) {
    setRawInput(value);
    setInputSource("text");
  }

  function handlePhoto(value: MerchantPhotoValue | null) {
    setPhoto(value);
    setError("");
  }

  async function createDraft() {
    const trimmedInput = rawInput.trim();
    if (trimmedInput.length < 5 && !photo) {
      setError("พิมพ์หรือพูดรายละเอียดอย่างน้อย 5 ตัวอักษร หรือแนบรูปหนึ่งรูปก่อนค่ะ");
      return;
    }
    if (providerMode === "rules" && photo && trimmedInput.length < 5) {
      setError("โหมด Local rule-based ยังอ่านข้อความในรูปไม่ได้ กรุณาพิมพ์คำอธิบายอย่างน้อย 5 ตัวอักษรด้วยค่ะ");
      return;
    }

    setError("");
    setSuccess(null);
    setConfirmed(false);
    setIsLoading(true);

    try {
      const inputMethod = inputMethodFor(inputSource, Boolean(photo), Boolean(trimmedInput));
      const response = await fetch("/api/merchant/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeId: baseProfile.cafe.id,
          rawInput: trimmedInput,
          inputMethod,
          ...(photo
            ? {
                image: {
                  name: photo.fileName,
                  mediaType: photo.mimeType,
                  sizeBytes: photo.sizeBytes,
                  dataUrl: photo.dataUrl,
                },
              }
            : {}),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "สร้างร่างไม่สำเร็จ");
      if (payload.currentProfile && !demo) setSessionProfile(payload.currentProfile);
      setDraft(payload.draft);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "สร้างร่างไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  function updateOffering(patch: Partial<MerchantOfferingPatch>) {
    if (!draft?.structuredUpdate.offering) return;
    setDraft({
      ...draft,
      structuredUpdate: {
        ...draft.structuredUpdate,
        offering: { ...draft.structuredUpdate.offering, ...patch },
      },
    });
  }

  function updateOfferingLocation(
    key: "processingLocation" | "roasterLocation",
    field: "province" | "locality",
    value: string,
  ) {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    const location = { ...current[key], [field]: value || undefined };
    if (key === "processingLocation") updateOffering({ processingLocation: location });
    else updateOffering({ roasterLocation: location });
  }

  function updateOfferingAltitude(field: "min" | "max", value: string) {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    const meters = asOptionalNumber(value);
    if (meters === undefined) {
      updateOffering({ altitudeMeters: undefined });
      return;
    }
    const existing = current.altitudeMeters;
    updateOffering({
      altitudeMeters: field === "min"
        ? { min: meters, max: existing?.max ?? meters }
        : { min: existing?.min ?? meters, max: meters },
    });
  }

  function updateTastingNote(index: number, locale: "th" | "en", value: string) {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    const tastingNotes = current.tastingNotes.map((note, noteIndex) =>
      noteIndex === index ? { ...note, [locale]: value } : note,
    );
    updateOffering({ tastingNotes });
  }

  function addTastingNote() {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    updateOffering({
      tastingNotes: [...current.tastingNotes, { th: "รสชาติใหม่", en: "new note" }],
    });
  }

  function removeTastingNote(index: number) {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    updateOffering({
      tastingNotes: current.tastingNotes.filter((_, noteIndex) => noteIndex !== index),
    });
  }

  function toggleBrewMethod(method: BrewMethod) {
    const current = draft?.structuredUpdate.offering;
    if (!current) return;
    updateOffering({
      brewMethods: current.brewMethods.includes(method)
        ? current.brewMethods.filter((item) => item !== method)
        : [...current.brewMethods, method],
    });
  }

  function updateMenuItem(index: number, patch: Partial<MerchantMenuItemPatch>) {
    if (!draft?.structuredUpdate.menuItems) return;
    const menuItems = draft.structuredUpdate.menuItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    setDraft({
      ...draft,
      structuredUpdate: { ...draft.structuredUpdate, menuItems },
    });
  }

  function updateWorkation(patch: Partial<MerchantWorkationPatch>) {
    if (!draft?.structuredUpdate.workation) return;
    setDraft({
      ...draft,
      structuredUpdate: {
        ...draft.structuredUpdate,
        workation: { ...draft.structuredUpdate.workation, ...patch },
      },
    });
  }

  async function reviewDraft(action: "approve" | "reject") {
    if (!draft) return;
    if (
      action === "approve"
      && draft.structuredUpdate.offering?.tastingNotes.some(
        (note) => !note.th.trim() || !note.en.trim(),
      )
    ) {
      setError("Taste note ทุกแถวต้องมีทั้งภาษาไทยและ English หรือลบแถวที่ไม่ใช้ค่ะ");
      return;
    }
    if (
      action === "approve"
      && draft.structuredUpdate.offering?.altitudeMeters
      && draft.structuredUpdate.offering.altitudeMeters.max
        < draft.structuredUpdate.offering.altitudeMeters.min
    ) {
      setError("Altitude สูงสุดต้องไม่น้อยกว่า Altitude ต่ำสุดค่ะ");
      return;
    }
    if (action === "approve" && !confirmed) {
      setError("กรุณายืนยันว่าตรวจสอบตัวอย่างหน้าร้านแล้วก่อนเผยแพร่");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/merchant/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "บันทึกการตัดสินใจไม่สำเร็จ");

      if (action === "approve") {
        const nextProfile = demo ? proposedProfile : payload.proposedProfile || proposedProfile;
        setSessionProfile(nextProfile);
        setApprovedProfile(nextProfile);
        if (demo) {
          const approved: ApprovedDemoProfile = {
            cafeId: baseProfile.cafe.id,
            approvedAt: payload.draft.reviewedAt || new Date().toISOString(),
            profile: nextProfile,
            ...(draft.structuredUpdate.offering?.beanName
              ? { updatedOfferingName: draft.structuredUpdate.offering.beanName }
              : {}),
          };
          window.localStorage.setItem(APPROVED_PROFILE_STORAGE_KEY, JSON.stringify(approved));
        }
      }
      setSuccess(action === "approve" ? "approved" : "rejected");
      setDraft(null);
      setConfirmed(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "บันทึกการตัดสินใจไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }

  function resetComposer() {
    setSuccess(null);
    setApprovedProfile(null);
    setRemovalCandidate(null);
    setRawInput("");
    setInputSource("text");
    setPhoto(null);
    setConfirmed(false);
    setError("");
  }

  const offering = draft?.structuredUpdate.offering;
  const offeringRemovals = draft?.structuredUpdate.offeringRemovals ?? [];
  const workation = draft?.structuredUpdate.workation;
  const menuItems = draft?.structuredUpdate.menuItems || [];
  const unresolvedFields = (draft?.structuredUpdate.unresolvedFields || [])
    .filter((field) => field !== "offering.producer");
  const linkedMenuCount = removalCandidate?.id
    ? baseProfile.menuItems.filter((item) => item.featuredOfferingId === removalCandidate.id).length
    : 0;

  return (
    <div className="page-container merchant-page">
      <nav className="merchant-route-nav" aria-label="ทางลัดหน้าจัดการร้าน">
        <Link className="finder-profile__back" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          กลับไปค้นหาร้านกาแฟ
        </Link>
        <Link className="merchant-route-nav__storefront" href={`/cafes/${baseProfile.cafe.slug}`}>
          ดูหน้าร้านปัจจุบัน <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
      <header className="page-heading merchant-heading">
        <span className="eyebrow">Merchant profile co-pilot</span>
        <h1>อัปเดตหน้าร้าน<br />ให้เป็นปัจจุบัน</h1>
        <p>พิมพ์ พูด หรือถ่ายรูป ระบบจะสร้างร่างหน้าร้านให้คุณตรวจสอบก่อนเผยแพร่เสมอ</p>
      </header>

      <div className="merchant-identity" aria-label="ร้านที่กำลังแก้ไข">
        <span className="merchant-avatar"><Store size={21} /></span>
        <div>
          <span>กำลังแก้ไขร้านเดียวใน MVP</span>
          <strong>{baseProfile.cafe.nameTh}</strong>
        </div>
      </div>

      {!draft && !success && managedOfferings.length ? (
        <section className="surface-card merchant-bean-manager" aria-labelledby="merchant-bean-manager-heading">
          <div className="surface-card__header">
            <div>
              <span className="eyebrow">Single Origin manager</span>
              <h2 id="merchant-bean-manager-heading">เมล็ดที่แสดงบนหน้าร้าน</h2>
              <p>เมล็ดที่จำหน่ายหมดแล้วสามารถนำออกจากหน้าร้านได้ โดยข้อมูลเดิมยังอยู่ในประวัติ</p>
            </div>
            <Coffee size={23} aria-hidden="true" />
          </div>

          <ul className="merchant-bean-manager__list">
            {managedOfferings.map((item, index) => (
              <li key={item.id || item.beanName || `managed-offering-${index + 1}`}>
                <div>
                  <strong>{item.beanName || `เมล็ดรายการที่ ${index + 1}`}</strong>
                  <small>
                    {[item.process, item.roastLevel, item.availability].filter(Boolean).join(" · ") || "ยังไม่ระบุรายละเอียด"}
                  </small>
                </div>
                <button
                  className="merchant-remove-bean-button"
                  type="button"
                  onClick={() => {
                    setRemovalCandidate(item);
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  เมล็ดหมดแล้ว — นำออกจากหน้าร้าน
                </button>
              </li>
            ))}
          </ul>

          {removalCandidate ? (
            <div
              className="merchant-remove-confirmation"
              role="alertdialog"
              aria-labelledby="merchant-remove-confirmation-heading"
              aria-describedby="merchant-remove-confirmation-description"
            >
              <div>
                <strong id="merchant-remove-confirmation-heading">
                  นำ “{removalCandidate.beanName || "เมล็ดนี้"}” ออกจากหน้าร้าน?
                </strong>
                <p id="merchant-remove-confirmation-description">
                  หลังอนุมัติ เมล็ดนี้จะไม่แสดงใน Single Origin Coffee แต่ข้อมูลเดิมยังถูกเก็บไว้ในประวัติ
                  {managedOfferings.length === 1
                    ? " นี่คือเมล็ดรายการสุดท้าย ส่วน Single Origin Coffee จะไม่แสดงบนหน้าร้าน"
                    : ""}
                  {linkedMenuCount > 0
                    ? ` และระบบจะถอดการอ้างอิงเมล็ดนี้ออกจาก ${linkedMenuCount.toLocaleString("th-TH")} เมนู`
                    : ""}
                </p>
              </div>
              <div className="button-row">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setRemovalCandidate(null)}
                  disabled={isLoading}
                  autoFocus
                >
                  ยังไม่เอาออก
                </button>
                <button
                  className="button button--danger"
                  type="button"
                  onClick={createOfferingRemovalDraft}
                  disabled={isLoading}
                >
                  <Trash2 size={17} aria-hidden="true" />
                  {isLoading ? "กำลังสร้างร่าง…" : "ยืนยัน สร้างร่างนำออก"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {!draft && !success ? (
        <section className="surface-card merchant-composer" aria-labelledby="copilot-heading">
          <div className="surface-card__header">
            <div>
              <span className="eyebrow">Text · Thai voice · Photo</span>
              <h2 id="copilot-heading">วันนี้มีอะไรเปลี่ยน?</h2>
              <p>เช่น เมล็ดกาแฟ เมนู ราคา เวลาเปิด หรือความเร็วอินเทอร์เน็ต</p>
            </div>
            <Coffee size={25} />
          </div>

          <div className="merchant-input-grid">
            <div className="form-stack">
              <label className="field" htmlFor="merchant-update">
                <span className="field-label">ข้อความอัปเดต</span>
                <textarea
                  id="merchant-update"
                  className="textarea merchant-update-textarea"
                  value={rawInput}
                  onChange={(event) => handleTypedInput(event.target.value)}
                  placeholder={demoMerchantVoiceUpdate}
                />
              </label>
              <VoiceInput
                value={rawInput}
                onChange={setRawInput}
                onTranscript={(source) => setInputSource(source === "demo" ? "demo" : "voice_transcript")}
                demoTranscript={demoMerchantVoiceUpdate}
                label="พูดอัปเดตเป็นภาษาไทย"
              />
            </div>

            <MerchantPhotoInput value={photo} onChange={handlePhoto} disabled={isLoading} />
          </div>

          {providerMode === "rules" && photo ? (
            <div className="notice notice--warm">
              <ShieldCheck size={17} />
              Local rule-based เก็บรูปเป็นหลักฐานประกอบ แต่ยังอ่านข้อความในรูปไม่ได้ กรุณาพิมพ์คำอธิบายสั้น ๆ ด้วย
            </div>
          ) : null}
          {error ? <div className="notice notice--warm" role="alert">{error}</div> : null}
          <button className="button button--primary button--full" type="button" onClick={createDraft} disabled={isLoading}>
            {isLoading ? <><span className="spinner" /> กำลังสร้างร่าง…</> : <><Sparkles size={18} /> สร้างร่างหน้าร้านให้ตรวจสอบ</>}
          </button>
        </section>
      ) : null}

      {draft ? (
        <section className="merchant-review" aria-label="ตรวจสอบร่างก่อนเผยแพร่">
          <div className="notice">
            <ShieldCheck size={17} />
            สถานะ Draft — หน้าร้านจริงยังไม่เปลี่ยน คุณแก้ข้อมูลด้านล่างได้ก่อนอนุมัติ
          </div>

          <div className="merchant-review-grid">
            <div className="form-stack">
              <section className="surface-card draft-preview">
                <div className="surface-card__header">
                  <div><span className="eyebrow">Editable fields</span><h2>ข้อมูลที่ระบบอ่านได้</h2></div>
                  <PencilLine size={20} />
                </div>

                {offering ? (
                  <fieldset className="confirmation-grid">
                    <legend>เมล็ดกาแฟเด่น</legend>
                    <label className="field"><span className="field-label">ชื่อเมล็ด</span><input className="input" value={offering.beanName || ""} onChange={(event) => updateOffering({ beanName: event.target.value || undefined })} /></label>
                    <label className="field"><span className="field-label">พื้นที่ปลูก</span><input className="input" value={offering.originName || ""} onChange={(event) => updateOffering({ originName: event.target.value || undefined })} placeholder="เช่น บ่อเกลือ" /></label>
                    <label className="field"><span className="field-label">จังหวัดแหล่งปลูก</span><input className="input" value={offering.originProvince || ""} onChange={(event) => updateOffering({ originProvince: event.target.value || undefined })} placeholder="เช่น น่าน" /></label>
                    <label className="field"><span className="field-label">ผู้ผลิต / Producer</span><input className="input" value={offering.producer || ""} onChange={(event) => updateOffering({ producer: event.target.value || undefined })} placeholder="เช่น กลุ่มเกษตรกรบ้านมณีพฤกษ์" /></label>
                    <label className="field"><span className="field-label">Altitude ต่ำสุด (เมตร)</span><input className="input" type="number" inputMode="numeric" min="0" max="5000" step="1" value={offering.altitudeMeters?.min ?? ""} onChange={(event) => updateOfferingAltitude("min", event.target.value)} placeholder="เช่น 1,300" /></label>
                    <label className="field"><span className="field-label">Altitude สูงสุด (เมตร)</span><input className="input" type="number" inputMode="numeric" min="0" max="5000" step="1" value={offering.altitudeMeters?.max ?? ""} onChange={(event) => updateOfferingAltitude("max", event.target.value)} placeholder="เช่น 1,600" /></label>
                    <label className="field"><span className="field-label">สายพันธุ์</span><input className="input" value={offering.varietal || ""} onChange={(event) => updateOffering({ varietal: event.target.value || undefined })} /></label>
                    <label className="field"><span className="field-label">Process</span><select className="select" value={offering.process || "unknown"} onChange={(event) => updateOffering({ process: event.target.value as MerchantOfferingPatch["process"] })}><option value="natural">Natural</option><option value="washed">Washed</option><option value="honey">Honey</option><option value="anaerobic">Anaerobic</option><option value="carbonic-maceration">Carbonic Maceration</option><option value="other">Other</option><option value="unknown">ยังไม่ระบุ</option></select></label>
                    <label className="field"><span className="field-label">Processed in — พื้นที่แปรรูป</span><input className="input" value={offering.processingLocation?.locality || ""} onChange={(event) => updateOfferingLocation("processingLocation", "locality", event.target.value)} placeholder="เช่น สะปัน" /></label>
                    <label className="field"><span className="field-label">Processed in — จังหวัด</span><input className="input" value={offering.processingLocation?.province || ""} onChange={(event) => updateOfferingLocation("processingLocation", "province", event.target.value)} placeholder="เช่น น่าน" /></label>
                    <label className="field"><span className="field-label">ระดับการคั่ว</span><select className="select" value={offering.roastLevel || "unknown"} onChange={(event) => updateOffering({ roastLevel: event.target.value as MerchantOfferingPatch["roastLevel"] })}><option value="light">คั่วอ่อน</option><option value="medium-light">คั่วกลางอ่อน</option><option value="medium">คั่วกลาง</option><option value="medium-dark">คั่วกลางเข้ม</option><option value="dark">คั่วเข้ม</option><option value="unknown">ยังไม่ระบุ</option></select></label>
                    <label className="field"><span className="field-label">Roasted in — โรงคั่ว/พื้นที่</span><input className="input" value={offering.roasterLocation?.locality || ""} onChange={(event) => updateOfferingLocation("roasterLocation", "locality", event.target.value)} placeholder="เช่น เมืองน่าน" /></label>
                    <label className="field"><span className="field-label">Roasted in — จังหวัด</span><input className="input" value={offering.roasterLocation?.province || ""} onChange={(event) => updateOfferingLocation("roasterLocation", "province", event.target.value)} placeholder="เช่น น่าน" /></label>
                    <label className="field"><span className="field-label">ราคาเริ่มต้น (บาท)</span><input className="input" type="number" min="0" value={offering.price?.amount ?? ""} onChange={(event) => { const amount = asOptionalNumber(event.target.value); updateOffering({ price: amount === undefined ? undefined : { amount, currency: "THB" } }); }} /></label>
                    <div className="merchant-taste-editor">
                      <div className="merchant-edit-heading">
                        <div><strong>Taste notes</strong><small>แก้ได้ทั้งภาษาไทยและ English</small></div>
                        <button className="button button--ghost" type="button" onClick={addTastingNote}>เพิ่ม Taste note</button>
                      </div>
                      {offering.tastingNotes.length ? (
                        <div className="merchant-taste-list">
                          {offering.tastingNotes.map((note, index) => (
                            <div className="merchant-taste-row" key={`taste-note-${index + 1}`}>
                              <label className="field"><span className="field-label">ภาษาไทย</span><input className="input" value={note.th} onChange={(event) => updateTastingNote(index, "th", event.target.value)} /></label>
                              <label className="field"><span className="field-label">English</span><input className="input" value={note.en} onChange={(event) => updateTastingNote(index, "en", event.target.value)} /></label>
                              <button className="merchant-taste-remove" type="button" onClick={() => removeTastingNote(index)} aria-label={`ลบ Taste note ${note.th || index + 1}`}><X size={16} aria-hidden="true" /></button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="field-hint">ยังไม่มี Taste note กด “เพิ่ม Taste note” เพื่อเพิ่มข้อมูล</p>}
                    </div>
                    <div className="merchant-brew-editor">
                      <div className="merchant-edit-heading"><div><strong>วิธีชง</strong><small>เลือกได้มากกว่าหนึ่งวิธี</small></div></div>
                      <div className="merchant-brew-options">
                        {BREW_METHOD_OPTIONS.map((method) => (
                          <button
                            className="merchant-option-chip"
                            type="button"
                            key={method.value}
                            aria-pressed={offering.brewMethods.includes(method.value)}
                            onClick={() => toggleBrewMethod(method.value)}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </fieldset>
                ) : null}

                {offeringRemovals.length ? (
                  <fieldset className="merchant-removal-review">
                    <legend>เมล็ดที่จะนำออกจากหน้าร้าน</legend>
                    {offeringRemovals.map((removal) => (
                      <div key={removal.offeringId || removal.beanName}>
                        <Trash2 size={19} aria-hidden="true" />
                        <span>
                          <strong>{removal.beanName}</strong>
                          <small>เหตุผล: จำหน่ายหมดแล้ว · เก็บข้อมูลเดิมไว้ในประวัติ</small>
                        </span>
                      </div>
                    ))}
                  </fieldset>
                ) : null}

                {menuItems.length ? (
                  <fieldset className="merchant-edit-section">
                    <legend>Recommended Menu</legend>
                    {menuItems.map((menu, index) => (
                      <div className="merchant-menu-editor" key={menu.id || `${menu.nameTh}-${index}`}>
                        <label className="field"><span className="field-label">ชื่อเมนู</span><input className="input" value={menu.nameTh} onChange={(event) => updateMenuItem(index, { nameTh: event.target.value })} /></label>
                        <label className="field"><span className="field-label">ราคา (บาท)</span><input className="input" type="number" min="0" value={menu.priceThb ?? ""} onChange={(event) => updateMenuItem(index, { priceThb: asOptionalNumber(event.target.value) })} /></label>
                        <label className="checkbox-row"><input type="checkbox" checked={menu.isCafePick ?? false} onChange={(event) => updateMenuItem(index, { isCafePick: event.target.checked })} /> ร้านแนะนำ</label>
                      </div>
                    ))}
                  </fieldset>
                ) : null}

                {workation ? (
                  <fieldset className="confirmation-grid merchant-edit-section">
                    <legend>Workation</legend>
                    <label className="field"><span className="field-label">Download (Mbps)</span><input className="input" type="number" min="0" value={workation.downloadMbps ?? ""} onChange={(event) => updateWorkation({ downloadMbps: asOptionalNumber(event.target.value) })} /></label>
                    <label className="field"><span className="field-label">Upload (Mbps)</span><input className="input" type="number" min="0" value={workation.uploadMbps ?? ""} onChange={(event) => updateWorkation({ uploadMbps: asOptionalNumber(event.target.value) })} /></label>
                    <label className="field"><span className="field-label">Ping (ms)</span><input className="input" type="number" min="0" value={workation.pingMs ?? ""} onChange={(event) => updateWorkation({ pingMs: asOptionalNumber(event.target.value) })} /></label>
                  </fieldset>
                ) : null}

                {draft.structuredUpdate.openingNote !== undefined ? (
                  <label className="field"><span className="field-label">หมายเหตุเวลาเปิดร้าน</span><textarea className="textarea textarea--compact" value={draft.structuredUpdate.openingNote} onChange={(event) => setDraft({ ...draft, structuredUpdate: { ...draft.structuredUpdate, openingNote: event.target.value } })} /></label>
                ) : null}

                {!offering && !offeringRemovals.length && !menuItems.length && !workation && draft.structuredUpdate.openingNote === undefined ? (
                  <div className="notice notice--warm">ยังไม่พบข้อมูลที่นำไปแก้หน้าร้านได้ กรุณาปฏิเสธแล้วเพิ่มคำอธิบายให้ชัดขึ้น</div>
                ) : null}
                {unresolvedFields.length ? <p className="field-hint">ควรตรวจเพิ่ม: {unresolvedFields.join(", ")}</p> : null}
              </section>

            </div>

            <MerchantStorefrontPreview current={baseProfile} proposed={proposedProfile} status="draft" />
          </div>

          {error ? <div className="notice notice--warm" role="alert">{error}</div> : null}
          <div className="approval-bar">
            <label className="approval-confirmation">
              <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span><strong>ฉันตรวจสอบตัวอย่างหน้าร้านแล้ว</strong><small>เมื่ออนุมัติ ข้อมูลร่างนี้จึงจะถูกเผยแพร่</small></span>
            </label>
            <div className="button-row">
              <button className="button button--danger" type="button" onClick={() => reviewDraft("reject")} disabled={isLoading}><X size={17} /> ปฏิเสธร่าง</button>
              <button className="button button--primary" type="button" onClick={() => reviewDraft("approve")} disabled={isLoading || !confirmed}><Save size={17} /> อนุมัติและเผยแพร่</button>
            </div>
          </div>
        </section>
      ) : null}

      {success ? (
        <section className={success === "approved" ? "verified-state merchant-success" : "notice notice--warm merchant-success"} role="status">
          {success === "approved" && approvedProfile ? (
            <>
              <BadgeCheck size={36} />
              <h2>อัปเดตหน้าร้านแล้ว</h2>
              <p>{demo ? "บันทึกผลสำหรับการทดสอบไว้ในเบราว์เซอร์นี้แล้ว" : "ร่างถูกอนุมัติและบันทึกผ่าน Supabase แล้ว"}</p>
              <MerchantStorefrontPreview current={approvedProfile} proposed={approvedProfile} status="published" />
              <div className="button-row">
                <Link className="button button--primary" href={`/cafes/${approvedProfile.cafe.slug}`}>ดูหน้าร้าน <ArrowRight size={17} /></Link>
                <button className="button button--secondary" type="button" onClick={resetComposer}><RotateCcw size={17} /> อัปเดตอีกครั้ง</button>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              <strong>ปฏิเสธร่างแล้ว</strong>
              <p>หน้าร้านเดิมไม่เปลี่ยนแปลง</p>
              <button className="button button--secondary" type="button" onClick={resetComposer}>กลับไปสร้างร่างใหม่</button>
            </>
          )}
        </section>
      ) : null}

      <span className="sr-only">เจ้าของโปรไฟล์ {ownerProfileId}</span>
    </div>
  );
}
