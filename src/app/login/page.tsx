import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Coffee, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { getSafeMerchantNextPath } from "@/lib/auth/demo-merchant";
import { isDemoMode } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบร้านค้า",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = getSafeMerchantNextPath(requestedNext);
  const demo = isDemoMode();

  return (
    <div className="page-container narrow-container login-page">
      <Link className="login-back-link" href="/">
        <ArrowLeft size={16} aria-hidden="true" />
        กลับหน้าค้นหาร้านกาแฟ
      </Link>

      <section className="login-card" aria-labelledby="merchant-login-heading">
        <div className="login-card__intro">
          <span className="brand-mark login-card__mark" aria-hidden="true">
            <Coffee size={25} />
          </span>
          <div>
            <span className="eyebrow">Merchant access</span>
            <h1 id="merchant-login-heading">เข้าสู่ระบบร้านค้า</h1>
            <p>สำหรับเจ้าของร้านที่ต้องการอัปเดตเมล็ดกาแฟ เมนู และข้อมูลหน้าร้าน</p>
          </div>
        </div>

        {demo ? (
          <div className="notice login-demo-scope">
            <ShieldCheck size={18} aria-hidden="true" />
            <div>
              <strong>บัญชีสำหรับกรรมการทดสอบ MVP</strong>
              <span>บัญชีนี้จัดการได้เฉพาะร้านฟองคำ คอฟฟี่พอยต์ และไม่เชื่อมกับข้อมูลส่วนตัว</span>
            </div>
          </div>
        ) : null}

        <LoginForm demo={demo} nextPath={nextPath} />
      </section>
    </div>
  );
}
