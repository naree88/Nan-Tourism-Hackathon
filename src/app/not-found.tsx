import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-container centered-state">
      <span className="eyebrow">404 · หลงทางนิดหน่อย</span>
      <h1>ยังไม่พบจุดแวะนี้</h1>
      <p>กลับไปเริ่มเส้นทางใหม่ แล้วให้เราช่วยหาร้านที่เหมาะกับแผนของคุณ</p>
      <Link className="button button--primary" href="/">
        <ArrowLeft size={18} aria-hidden="true" />
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
