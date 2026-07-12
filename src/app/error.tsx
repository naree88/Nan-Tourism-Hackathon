"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-container centered-state" role="alert">
      <span className="eyebrow">ลองอีกครั้งได้เสมอ</span>
      <h1>มีบางอย่างสะดุดระหว่างทาง</h1>
      <p>ข้อมูลที่คุณกรอกยังอยู่ในเบราว์เซอร์ ลองโหลดส่วนนี้ใหม่อีกครั้ง</p>
      <button className="button button--primary" type="button" onClick={reset}>
        <RotateCcw size={18} aria-hidden="true" />
        ลองใหม่
      </button>
    </div>
  );
}
