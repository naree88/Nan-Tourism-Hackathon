"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/merchant");
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={signIn}>
      <label className="field"><span className="field-label">อีเมล</span><input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="field"><span className="field-label">รหัสผ่าน</span><input className="input" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error && <div className="notice notice--warm" role="alert">{error}</div>}
      <button className="button button--primary button--full" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> กำลังเข้าสู่ระบบ…</> : <><LogIn size={17} /> เข้าสู่ระบบ</>}</button>
      <p className="privacy-note">บัญชี merchant ต้องถูกเชื่อมใน cafe_owners และมีสถานะ verified ก่อนจัดการร้าน</p>
    </form>
  );
}
