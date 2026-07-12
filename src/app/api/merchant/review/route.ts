import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDemoMerchantProfile } from "@/lib/demo/merchant";
import {
  approveMerchantDraft,
  buildMerchantDraftFromStructuredUpdate,
  rejectMerchantDraft,
  type MerchantDraft,
  type MerchantInputMethod,
} from "@/lib/domain";
import {
  merchantDraftGenerationSchema,
  merchantDraftSchema,
  merchantSourceImageSchema,
  structuredMerchantUpdateSchema,
} from "@/lib/merchant/contracts";
import {
  applyMerchantUpdateToProfile,
  loadSupabaseMerchantProfile,
} from "@/lib/merchant/profile";
import { applyMerchantDraftToSupabase } from "@/lib/merchant/supabase-apply";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  draft: merchantDraftSchema,
}).strict();

type DraftRow = {
  id: string;
  cafe_id: string;
  owner_profile_id: string;
  update_kind: string;
  input_method: string;
  source_input_text: string;
  structured_data: unknown;
  thai_copy: string | null;
  english_copy: string | null;
  status: string;
  generation_metadata: unknown;
  source_media: unknown;
  created_at: string;
};

class ReviewRouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function updateKind(kinds: string[]) {
  if (kinds.includes("offering")) return "coffee_offering";
  if (kinds.includes("menu")) return "menu_item";
  if (kinds.includes("opening-note")) return "opening_notice";
  if (kinds.includes("workation")) return "workation";
  return "general";
}

function canonicalRawInput(row: DraftRow, sourceImageCount: number) {
  if (sourceImageCount > 0 && /^\[Photo: .+\]$/.test(row.source_input_text)) return "";
  return row.source_input_text;
}

function canonicalDraftFromRow(row: DraftRow): MerchantDraft {
  const inputMethod = merchantDraftSchema.shape.inputMethod.parse(row.input_method) as MerchantInputMethod;
  const sourceImages = z.array(merchantSourceImageSchema).max(1).parse(row.source_media ?? []);
  const generationResult = merchantDraftGenerationSchema.safeParse(row.generation_metadata);
  const generation = generationResult.success
    ? generationResult.data
    : {
        provider: "rules" as const,
        promptVersion: "merchant-rules-v1.0.0",
        imageAnalysis: sourceImages.length ? "not-supported" as const : "not-provided" as const,
      };
  const structuredUpdate = structuredMerchantUpdateSchema.parse(row.structured_data);
  const draft = buildMerchantDraftFromStructuredUpdate(
    canonicalRawInput(row, sourceImages.length),
    structuredUpdate,
    {
      cafeId: row.cafe_id,
      ownerProfileId: row.owner_profile_id,
      draftId: row.id,
      createdAt: row.created_at,
      inputMethod,
      sourceImages,
      generation,
    },
  );

  return merchantDraftSchema.parse({
    ...draft,
    copy: {
      th: row.thai_copy ?? draft.copy.th,
      en: row.english_copy ?? draft.copy.en,
    },
  });
}

function mergeReviewableStructuredUpdate(
  canonical: MerchantDraft["structuredUpdate"],
  submitted: MerchantDraft["structuredUpdate"],
): MerchantDraft["structuredUpdate"] {
  const editableFields = { ...submitted };
  delete editableFields.offeringRemovals;
  const canonicalRemovals = canonical.offeringRemovals;

  return structuredMerchantUpdateSchema.parse({
    ...editableFields,
    kinds: canonicalRemovals?.length
      ? [...new Set([...editableFields.kinds, "offering" as const])]
      : editableFields.kinds,
    ...(canonicalRemovals?.length
      ? { offeringRemovals: canonicalRemovals.map((removal) => ({ ...removal })) }
      : {}),
  });
}

function reviewDemoDraft(action: "approve" | "reject", draft: MerchantDraft) {
  const reviewerId = "merchant-demo-01";
  if (draft.ownerProfileId !== reviewerId) {
    throw new ReviewRouteError("บัญชีเดโมนี้ไม่ใช่เจ้าของร่างดังกล่าว", 403);
  }
  const reviewedAt = new Date().toISOString();
  const reviewed = action === "approve"
    ? approveMerchantDraft(draft, { profileId: reviewerId, reviewedAt })
    : rejectMerchantDraft(draft, { profileId: reviewerId, reviewedAt });
  const currentProfile = getDemoMerchantProfile(draft.cafeId);
  let proposedProfile = null;
  if (currentProfile) {
    try {
      proposedProfile = applyMerchantUpdateToProfile(currentProfile, draft.structuredUpdate);
    } catch (error) {
      // A browser-only demo profile can contain newly approved id-less beans
      // that are not part of the server fixture. The client applies that
      // already validated draft against its local snapshot after approval.
      if (!draft.structuredUpdate.offeringRemovals?.length) throw error;
    }
  }
  return NextResponse.json({ draft: reviewed, proposedProfile, mode: "demo" });
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (isDemoMode()) return reviewDemoDraft(body.action, body.draft);

    const sessionClient = await createSupabaseServerClient();
    if (!sessionClient) {
      throw new ReviewRouteError("ระบบ Supabase ยังตั้งค่าไม่ครบ", 503);
    }

    const { data: claimsData, error: claimsError } = await sessionClient.auth.getClaims();
    const reviewerId = claimsData?.claims?.sub;
    if (claimsError || !reviewerId) {
      throw new ReviewRouteError("กรุณาเข้าสู่ระบบเจ้าของร้าน", 401);
    }
    if (body.draft.ownerProfileId !== reviewerId) {
      throw new ReviewRouteError("บัญชีนี้ไม่ใช่เจ้าของร่างดังกล่าว", 403);
    }

    // Read through the user's session first. RLS and the explicit predicates
    // both require this exact owner and a still-reviewable draft.
    const { data: canonicalData, error: canonicalError } = await sessionClient
      .from("content_drafts")
      .select("id, cafe_id, owner_profile_id, update_kind, input_method, source_input_text, structured_data, thai_copy, english_copy, status, generation_metadata, source_media, created_at")
      .eq("id", body.draft.id)
      .eq("owner_profile_id", reviewerId)
      .eq("status", "draft")
      .maybeSingle();
    if (canonicalError) {
      throw new ReviewRouteError("โหลดร่างสำหรับตรวจสอบไม่สำเร็จ", 500);
    }
    if (!canonicalData) {
      throw new ReviewRouteError("ไม่พบร่างที่ยังรอการอนุมัติ หรือร่างถูกดำเนินการไปแล้ว", 404);
    }
    const canonicalRow = canonicalData as DraftRow;
    if (canonicalRow.cafe_id !== body.draft.cafeId) {
      throw new ReviewRouteError("ร่างนี้ไม่ได้เป็นของร้านที่ระบุ", 403);
    }

    const { data: ownership, error: ownershipError } = await sessionClient
      .from("cafe_owners")
      .select("cafe_id")
      .eq("cafe_id", canonicalRow.cafe_id)
      .eq("profile_id", reviewerId)
      .eq("status", "verified")
      .maybeSingle();
    if (ownershipError) throw new ReviewRouteError("ตรวจสอบสิทธิ์เจ้าของร้านไม่สำเร็จ", 500);
    if (!ownership) throw new ReviewRouteError("บัญชีนี้ไม่มีสิทธิ์อนุมัติร้านดังกล่าว", 403);

    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new ReviewRouteError("ระบบเผยแพร่ยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY", 503);
    }

    const canonicalDraft = canonicalDraftFromRow(canonicalRow);
    // The browser may edit only the typed patch and bilingual copy shown in
    // preview. Identity, source input, generation metadata, and media evidence
    // always come from the canonical database row.
    const reviewableDraft = merchantDraftSchema.parse({
      ...canonicalDraft,
      structuredUpdate: mergeReviewableStructuredUpdate(
        canonicalDraft.structuredUpdate,
        body.draft.structuredUpdate,
      ),
      copy: body.draft.copy,
    });

    const { data: savedDraft, error: saveError } = await admin
      .from("content_drafts")
      .update({
        update_kind: updateKind(reviewableDraft.structuredUpdate.kinds),
        structured_data: reviewableDraft.structuredUpdate,
        thai_copy: reviewableDraft.copy.th,
        english_copy: reviewableDraft.copy.en,
      })
      .eq("id", reviewableDraft.id)
      .eq("cafe_id", reviewableDraft.cafeId)
      .eq("owner_profile_id", reviewerId)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();
    if (saveError) throw new ReviewRouteError("บันทึกข้อมูลร่างที่ตรวจแก้ไม่สำเร็จ", 500);
    if (!savedDraft) throw new ReviewRouteError("ร่างเปลี่ยนสถานะระหว่างการตรวจสอบ กรุณาโหลดใหม่", 409);

    const reviewedAt = new Date().toISOString();
    if (body.action === "reject") {
      const reviewed = rejectMerchantDraft(reviewableDraft, { profileId: reviewerId, reviewedAt });
      const currentProfile = await loadSupabaseMerchantProfile(admin, reviewableDraft.cafeId);
      const proposedProfile = currentProfile
        ? applyMerchantUpdateToProfile(currentProfile, reviewableDraft.structuredUpdate)
        : null;
      const { data: rejected, error: rejectError } = await admin
        .from("content_drafts")
        .update({ status: "rejected", rejected_at: reviewedAt })
        .eq("id", reviewableDraft.id)
        .eq("cafe_id", reviewableDraft.cafeId)
        .eq("owner_profile_id", reviewerId)
        .eq("status", "draft")
        .select("id")
        .maybeSingle();
      if (rejectError) throw new ReviewRouteError("ปฏิเสธร่างไม่สำเร็จ", 500);
      if (!rejected) throw new ReviewRouteError("ร่างเปลี่ยนสถานะก่อนปฏิเสธ กรุณาโหลดใหม่", 409);
      return NextResponse.json({ draft: reviewed, proposedProfile, mode: "supabase" });
    }

    const proposedProfile = await applyMerchantDraftToSupabase(admin, reviewableDraft, reviewerId);
    const reviewed = approveMerchantDraft(reviewableDraft, { profileId: reviewerId, reviewedAt });
    revalidatePath(`/cafes/${proposedProfile.cafe.slug}`);
    return NextResponse.json({ draft: reviewed, proposedProfile, mode: "supabase" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "ข้อมูลร่างไม่ถูกต้อง", issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof ReviewRouteError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        message: "ตรวจร่างหรือเผยแพร่ข้อมูลร้านไม่สำเร็จ",
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
