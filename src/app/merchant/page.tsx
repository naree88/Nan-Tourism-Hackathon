import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MerchantDashboard } from "@/components/merchant-dashboard";
import { getDemoMerchantProfile } from "@/lib/demo/merchant";
import { getMerchantDraftProviderMode } from "@/lib/merchant/draft-provider";
import { loadSupabaseMerchantProfile } from "@/lib/merchant/profile";
import { isDemoMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Merchant co-pilot" };
export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const demo = isDemoMode();
  const providerMode = getMerchantDraftProviderMode();

  if (demo) {
    const currentProfile = getDemoMerchantProfile();
    if (!currentProfile) {
      throw new Error("The linked MVP merchant cafe is missing from the new finder data.");
    }
    return (
      <MerchantDashboard
        currentProfile={currentProfile}
        ownerProfileId="merchant-demo-01"
        demo
        providerMode={providerMode}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase mode is enabled but the public Supabase configuration is missing.");
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=/merchant");

  const { data: ownership, error: ownershipError } = await supabase
    .from("cafe_owners")
    .select("cafe_id")
    .eq("profile_id", userId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();

  if (ownershipError) {
    throw new Error(`Unable to load cafe ownership: ${ownershipError.message}`);
  }

  if (!ownership) {
    return (
      <div className="page-container centered-state">
        <span className="eyebrow">Ownership required</span>
        <h1>ยังไม่มีร้านที่ยืนยันความเป็นเจ้าของ</h1>
        <p>ให้ผู้ดูแลยืนยัน cafe_owners ก่อนใช้งานระบบอัปเดตหน้าร้าน</p>
      </div>
    );
  }

  const currentProfile = await loadSupabaseMerchantProfile(supabase, ownership.cafe_id);
  if (!currentProfile) {
    return (
      <div className="page-container centered-state">
        <span className="eyebrow">Published profile required</span>
        <h1>ยังไม่พบหน้าร้านที่เผยแพร่แล้ว</h1>
        <p>ร้านต้องมี public profile หนึ่งรายการก่อนจึงจะสร้างร่างแก้ไขได้</p>
      </div>
    );
  }

  return (
    <MerchantDashboard
      currentProfile={currentProfile}
      ownerProfileId={userId}
      demo={false}
      providerMode={providerMode}
    />
  );
}
