import "server-only";

import { DEMO_MERCHANT_PROFILE_ID } from "@/lib/auth/demo-merchant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DemoMerchantSessionFailure = {
  ok: false;
  status: 401 | 403 | 503;
  message: string;
};

type DemoMerchantSessionSuccess = {
  ok: true;
  userId: string;
  ownerProfileId: typeof DEMO_MERCHANT_PROFILE_ID;
};

export type DemoMerchantSessionResult =
  | DemoMerchantSessionFailure
  | DemoMerchantSessionSuccess;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function requireDemoMerchantSession(): Promise<DemoMerchantSessionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      message: "ระบบเข้าสู่ระบบร้านค้ายังตั้งค่าไม่ครบ กรุณาแจ้งผู้ดูแลระบบ",
    };
  }

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: unknown; app_metadata?: unknown } | undefined;
  if (error || typeof claims?.sub !== "string" || !claims.sub) {
    return {
      ok: false,
      status: 401,
      message: "กรุณาเข้าสู่ระบบร้านค้า",
    };
  }

  const appMetadata = claims.app_metadata;
  if (
    !isRecord(appMetadata) ||
    appMetadata.demo_merchant !== true ||
    appMetadata.merchant_profile_id !== DEMO_MERCHANT_PROFILE_ID
  ) {
    return {
      ok: false,
      status: 403,
      message: "บัญชีนี้ไม่มีสิทธิ์จัดการร้าน MVP demo",
    };
  }

  return {
    ok: true,
    userId: claims.sub,
    ownerProfileId: DEMO_MERCHANT_PROFILE_ID,
  };
}
