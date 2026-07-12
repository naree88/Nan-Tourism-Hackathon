import { DatabaseZap } from "lucide-react";

export function DemoModePill({ compact = false }: { compact?: boolean }) {
  const isDemo =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  if (!isDemo) return null;

  return (
    <span className={`demo-pill${compact ? " demo-pill--compact" : ""}`}>
      <DatabaseZap size={14} aria-hidden="true" />
      <span>{compact ? "Demo" : "ข้อมูลตัวอย่างสำหรับเดโม"}</span>
    </span>
  );
}
