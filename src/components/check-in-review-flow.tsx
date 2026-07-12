"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  QrCode,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Rating, ReviewRatings } from "@/lib/domain";

type Stage = "verify" | "review" | "done";
type VerificationMethod = "qr" | "location";

type StoredCheckIn = {
  id: string;
  cafeId: string;
  verifiedVisit: true;
  method: VerificationMethod;
  checkedInAt: string;
  label: "demo-verified";
};

type StoredReview = {
  id: string;
  checkInId: string;
  cafeId: string;
  ratings: ReviewRatings;
  originalBody: string;
  originalLanguage: "th";
  moderationStatus: "pending";
  createdAt: string;
};

const labels: Array<{ key: keyof ReviewRatings; th: string }> = [
  { key: "coffeeQuality", th: "คุณภาพกาแฟ" },
  { key: "beanStory", th: "เมล็ดและเรื่องราว" },
  { key: "service", th: "บริการ" },
  { key: "value", th: "ความคุ้มค่า" },
  { key: "atmosphere", th: "บรรยากาศ" },
];

const initialRatings: ReviewRatings = {
  coffeeQuality: 5,
  beanStory: 5,
  service: 5,
  value: 4,
  atmosphere: 5,
};

export function CheckInReviewFlow({ cafe, hasWorkation }: { cafe: { id: string; slug: string; name: string }; hasWorkation: boolean }) {
  const checkInKey = `nan-coffee:checkin:${cafe.id}`;
  const reviewKey = `nan-coffee:review:${cafe.id}`;
  const [stage, setStage] = useState<Stage>("verify");
  const [checkIn, setCheckIn] = useState<StoredCheckIn | null>(null);
  const [ratings, setRatings] = useState<ReviewRatings>(initialRatings);
  const [body, setBody] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [existingReview, setExistingReview] = useState<StoredReview | null>(null);

  useEffect(() => {
    const hydrateStorage = window.setTimeout(() => {
      try {
        const storedCheckIn = window.localStorage.getItem(checkInKey);
        const storedReview = window.localStorage.getItem(reviewKey);
        if (storedCheckIn) {
          const parsed = JSON.parse(storedCheckIn) as StoredCheckIn;
          setCheckIn(parsed);
          setStage(storedReview ? "done" : "review");
        }
        if (storedReview) setExistingReview(JSON.parse(storedReview) as StoredReview);
      } catch {
        // Corrupt demo storage is ignored; the traveler can verify again.
      }
    }, 0);
    return () => window.clearTimeout(hydrateStorage);
  }, [checkInKey, reviewKey]);

  function completeDemoCheckIn(method: VerificationMethod) {
    const record: StoredCheckIn = {
      id: `checkin-${crypto.randomUUID()}`,
      cafeId: cafe.id,
      verifiedVisit: true,
      method,
      checkedInAt: new Date().toISOString(),
      label: "demo-verified",
    };
    window.localStorage.setItem(checkInKey, JSON.stringify(record));
    setCheckIn(record);
    setStage("review");
    setMessage("");
  }

  function verifyLocation() {
    if (!navigator.geolocation) {
      setMessage("อุปกรณ์นี้ส่งตำแหน่งไม่ได้ ใช้ QR เดโมแทนได้");
      return;
    }
    setIsLocating(true);
    setMessage("กำลังรอการอนุญาตตำแหน่ง…");
    navigator.geolocation.getCurrentPosition(
      () => {
        setIsLocating(false);
        completeDemoCheckIn("location");
      },
      (error) => {
        setIsLocating(false);
        setMessage(error.code === error.PERMISSION_DENIED ? "ไม่ได้รับอนุญาตตำแหน่ง ใช้ QR เดโมได้โดยไม่ต้องเปิดสิทธิ์" : "ตรวจตำแหน่งไม่สำเร็จ ลองอีกครั้งหรือใช้ QR เดโม");
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  function setRating(key: keyof ReviewRatings, value: Rating) {
    setRatings((current) => ({ ...current, [key]: value }));
  }

  function submitReview() {
    if (!checkIn?.verifiedVisit) {
      setMessage("ต้องยืนยันการเช็กอินก่อนเขียนรีวิว");
      setStage("verify");
      return;
    }
    if (window.localStorage.getItem(reviewKey)) {
      setMessage("หนึ่ง verified visit เขียนรีวิวได้หนึ่งครั้ง");
      setStage("done");
      return;
    }
    const record: StoredReview = {
      id: `review-${crypto.randomUUID()}`,
      checkInId: checkIn.id,
      cafeId: cafe.id,
      ratings,
      originalBody: body.trim(),
      originalLanguage: "th",
      moderationStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(reviewKey, JSON.stringify(record));
    setExistingReview(record);
    setStage("done");
    setMessage("");
  }

  return (
    <div className="form-stack">
      <div className="page-heading">
        <Link className="button button--ghost" href={`/cafes/${cafe.slug}`}><ArrowLeft size={17} /> กลับโปรไฟล์ร้าน</Link>
        <span className="eyebrow">Verified visit · demo flow</span>
        <h1>เช็กอินที่<br />{cafe.name}</h1>
        <p>รีวิวจะเปิดหลังยืนยัน QR หรือตำแหน่งเท่านั้น หนึ่งการเยี่ยมชมเขียนได้หนึ่งรีวิว</p>
      </div>

      <ol className="stage-list">
        <li className={stage === "verify" ? "is-active" : "is-complete"}><span>{stage === "verify" ? "1" : <Check size={14} />}</span>ยืนยันการมา</li>
        <li className={stage === "review" ? "is-active" : stage === "done" ? "is-complete" : ""}><span>{stage === "done" ? <Check size={14} /> : "2"}</span>รีวิวแบบมีโครงสร้าง</li>
        <li className={stage === "done" ? "is-active" : ""}><span>3</span>รอ moderation</li>
      </ol>

      {stage === "verify" && (
        <section className="checkin-card" aria-labelledby="verify-heading">
          <div className="surface-card__header"><div><span className="eyebrow">Choose verification</span><h2 id="verify-heading">ยืนยันการเยี่ยมชม</h2></div><QrCode size={23} /></div>
          <div className="qr-frame" aria-label="QR เช็กอินสำหรับเดโม">
            <QRCodeSVG value={`nan-coffee-demo-checkin:${cafe.id}`} size={174} bgColor="#ffffff" fgColor="#332019" level="M" />
          </div>
          <div className="notice notice--warm"><ShieldCheck size={17} /> QR และ location ในหน้านี้เป็น fallback สำหรับเดโม ไม่ใช่หลักฐานการมาเยือนจริงใน production และพิกัดไม่ถูกบันทึก</div>
          <div className="verification-choice">
            <button type="button" onClick={() => completeDemoCheckIn("qr")}><QrCode size={21} /><span><strong>จำลองการสแกน QR</strong><br /><small>สร้างสถานะ Demo verified visit</small></span></button>
            <button type="button" onClick={verifyLocation} disabled={isLocating}><LocateFixed size={21} /><span><strong>{isLocating ? "กำลังตรวจ…" : "ใช้ตำแหน่งแบบ opt-in"}</strong><br /><small>ขอสิทธิ์เมื่อกดเท่านั้น ไม่เก็บพิกัด</small></span></button>
          </div>
          {message && <div className="notice" role="status">{message}</div>}
        </section>
      )}

      {stage === "review" && checkIn && (
        <section className="checkin-card" aria-labelledby="review-heading">
          <div className="verified-state">
            <BadgeCheck size={32} style={{ margin: "0 auto" }} />
            <strong>Demo verified visit</strong>
            <p>วิธี: {checkIn.method === "qr" ? "QR demo" : "Location opt-in demo"} · {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(checkIn.checkedInAt))}</p>
          </div>
          <div className="surface-card__header"><div><span className="eyebrow">Structured review</span><h2 id="review-heading">ประสบการณ์เป็นอย่างไร?</h2></div><Star size={23} /></div>
          <div className="rating-grid">
            {[...labels, ...(hasWorkation ? [{ key: "workSuitability" as const, th: "เหมาะกับการทำงาน" }] : [])].map((item) => (
              <div className="rating-row" key={item.key}>
                <div className="rating-row__top"><span>{item.th}</span><span>{ratings[item.key] || 0}/5</span></div>
                <div className="rating-buttons">
                  {([1, 2, 3, 4, 5] as Rating[]).map((value) => <button type="button" key={value} aria-label={`${item.th} ${value} จาก 5`} aria-pressed={ratings[item.key] === value} onClick={() => setRating(item.key, value)}>{value}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="field"><label htmlFor="review-body">ข้อความเพิ่มเติม (ต้นฉบับภาษาไทย)</label><textarea id="review-body" className="textarea" value={body} maxLength={1000} onChange={(event) => setBody(event.target.value)} placeholder="เล่ารสกาแฟ บรรยากาศ หรือสิ่งที่ควรรู้…" /><span className="field-hint">{body.length}/1000 · หากมีคำแปลภายหลังจะแยกป้ายจากต้นฉบับ</span></div>
          {message && <div className="notice notice--warm" role="alert">{message}</div>}
          <button className="button button--primary button--full" type="button" onClick={submitReview}><Send size={17} /> ส่งเข้าคิวตรวจรีวิว</button>
        </section>
      )}

      {stage === "done" && (
        <section className="checkin-card">
          <div className="verified-state">
            <CheckCircle2 size={38} style={{ margin: "0 auto" }} />
            <h2>{existingReview ? "รับรีวิวแล้ว" : "การเยี่ยมชมนี้มีรีวิวแล้ว"}</h2>
            <p>สถานะ moderation: <strong>Pending · รอตรวจ</strong> รีวิวจึงยังไม่แสดงบน public profile</p>
          </div>
          {existingReview && <div className="review-card"><div className="review-card__meta"><span className="badge"><BadgeCheck size={12} /> Verified visit · demo</span><span><Clock3 size={12} /> Pending</span></div><p>{existingReview.originalBody || "ไม่มีข้อความเพิ่มเติม"}</p><p className="field-hint">ต้นฉบับภาษาไทย · ยังไม่มีคำแปล</p></div>}
          {message && <div className="notice notice--warm">{message}</div>}
          <Link className="button button--primary button--full" href={`/cafes/${cafe.slug}`}><MapPin size={17} /> กลับไปดูโปรไฟล์ร้าน</Link>
        </section>
      )}
    </div>
  );
}
