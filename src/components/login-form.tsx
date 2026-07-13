"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, UserRound } from "lucide-react";

import {
  DEMO_MERCHANT_PASSWORD,
  DEMO_MERCHANT_SHOP_NAME,
  DEMO_MERCHANT_USERNAME,
  mapMerchantLoginToEmail,
} from "@/lib/auth/demo-merchant";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = { demo: boolean; nextPath: string };

export function LoginForm({ demo, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemoCredentials() {
    setLogin(DEMO_MERCHANT_USERNAME);
    setPassword(DEMO_MERCHANT_PASSWORD);
    setError("");
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const email = demo ? mapMerchantLoginToEmail(login) : login.trim();
      if (!email) throw new Error("Invalid demo account");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack login-form" onSubmit={signIn}>
      {demo ? (
        <section className="demo-credentials" aria-labelledby="demo-credentials-heading">
          <div className="demo-credentials__heading">
            <div>
              <span className="eyebrow">MVP demo account</span>
              <h2 id="demo-credentials-heading">ข้อมูลเข้าสู่ระบบสำหรับทดสอบ</h2>
              <p>{DEMO_MERCHANT_SHOP_NAME}</p>
            </div>
            <button className="button button--secondary demo-credentials__fill" type="button" onClick={fillDemoCredentials}>
              กรอกบัญชีนี้ให้
            </button>
          </div>
          <dl className="demo-credentials__grid">
            <div>
              <dt><UserRound size={15} aria-hidden="true" /> Username</dt>
              <dd>{DEMO_MERCHANT_USERNAME}</dd>
            </div>
            <div>
              <dt><KeyRound size={15} aria-hidden="true" /> Password</dt>
              <dd>{DEMO_MERCHANT_PASSWORD}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <label className="field">
        <span className="field-label">{demo ? "Username" : "อีเมล"}</span>
        <input className="input" type={demo ? "text" : "email"} name="username" autoComplete="username" required value={login} onChange={(event) => setLogin(event.target.value)} placeholder={demo ? DEMO_MERCHANT_USERNAME : "merchant@example.com"} spellCheck={false} autoCapitalize="none" />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input className="input" type="password" name="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="กรอกรหัสผ่าน" />
      </label>

      {error ? <div className="notice notice--warm" role="alert" aria-live="polite">{error}</div> : null}
      <button className="button button--primary button--full" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" /> กำลังเข้าสู่ระบบ…</> : <><LogIn size={17} aria-hidden="true" /> เข้าสู่หน้าจัดการร้าน</>}
      </button>
      <p className="privacy-note login-form__note">ระบบจะตรวจสอบบัญชีผ่านการเชื่อมต่อที่เข้ารหัส และไม่แสดงรายละเอียดข้อผิดพลาดจากผู้ให้บริการ</p>
    </form>
  );
}
