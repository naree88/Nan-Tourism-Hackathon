import type { Metadata } from "next";
import Link from "next/link";
import { Coffee, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  const demo = isDemoMode();
  return (
    <div className="page-container narrow-container">
      <section className="login-card">
        <span className="brand-mark" style={{ width: 54, height: 54 }}><Coffee size={25} /></span>
        <div className="page-heading" style={{ margin: 0 }}><span className="eyebrow">Merchant access</span><h1 style={{ fontSize: "clamp(2rem, 10vw, 3.2rem)" }}>เข้าสู่ระบบเจ้าของร้าน</h1><p>ผู้เดินทางไม่ต้องล็อกอินเพื่อค้นหา ส่วนการอัปเดตร้านต้องผ่านบัญชีที่ยืนยัน ownership</p></div>
        {demo ? (
          <>
            <div className="notice notice--warm"><ShieldCheck size={17} /> Demo mode จะใช้บัญชี merchant-demo-01 อัตโนมัติ ไม่มีรหัสผ่านจริงและไม่มีข้อมูลถูกส่งออกจากเบราว์เซอร์</div>
            <Link className="button button--primary button--full" href="/merchant">เข้า Merchant demo</Link>
          </>
        ) : <LoginForm />}
      </section>
    </div>
  );
}
