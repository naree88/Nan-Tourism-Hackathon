import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDemoMerchantSession } from "@/lib/auth/demo-merchant-session";
import { getDemoMerchantProfile } from "@/lib/demo/merchant";
import { loadSupabaseMerchantProfile } from "@/lib/merchant/profile";
import { merchantDraftRequestSchema } from "@/lib/merchant/contracts";
import {
  classifyMerchantDraftProviderError,
  generateMerchantDraft,
} from "@/lib/merchant/draft-provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function updateKind(kinds: string[]) {
  if (kinds.includes("offering")) return "coffee_offering";
  if (kinds.includes("menu")) return "menu_item";
  if (kinds.includes("opening-note")) return "opening_notice";
  if (kinds.includes("workation")) return "workation";
  return "general";
}

function safeZodIssueSummary(error: z.ZodError) {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
  }));
}

export async function POST(request: Request) {
  try {
    const demo = isDemoMode();
    if (demo) {
      const session = await requireDemoMerchantSession();
      if (!session.ok) {
        return NextResponse.json({ message: session.message }, { status: session.status });
      }
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { message: "ข้อมูลอัปเดตหรือรูปถ่ายไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    const parsedBody = merchantDraftRequestSchema.safeParse(requestBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลอัปเดตหรือรูปถ่ายไม่ถูกต้อง",
          issues: parsedBody.error.issues,
        },
        { status: 400 },
      );
    }
    const body = parsedBody.data;
    const supabase = demo ? null : await createSupabaseServerClient();
    if (!demo && !supabase) {
      return NextResponse.json({ message: "ระบบ Supabase ยังตั้งค่าไม่ครบ" }, { status: 503 });
    }
    let ownerProfileId = "merchant-demo-01";
    let currentProfile;

    if (supabase) {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (claimsError || !userId) {
        return NextResponse.json({ message: "กรุณาเข้าสู่ระบบเจ้าของร้าน" }, { status: 401 });
      }
      const { data: ownership, error: ownershipError } = await supabase
        .from("cafe_owners")
        .select("cafe_id")
        .eq("cafe_id", body.cafeId)
        .eq("profile_id", userId)
        .eq("status", "verified")
        .maybeSingle();
      if (ownershipError) {
        return NextResponse.json({ message: "ตรวจสอบสิทธิ์เจ้าของร้านไม่สำเร็จ" }, { status: 500 });
      }
      if (!ownership) {
        return NextResponse.json({ message: "บัญชีนี้ไม่มีสิทธิ์จัดการร้านดังกล่าว" }, { status: 403 });
      }
      ownerProfileId = userId;
      currentProfile = await loadSupabaseMerchantProfile(supabase, body.cafeId);
    } else {
      currentProfile = getDemoMerchantProfile(body.cafeId);
    }

    if (!currentProfile) {
      return NextResponse.json({ message: "ไม่พบข้อมูลหน้าร้านปัจจุบัน" }, { status: 404 });
    }

    // The browser session proves identity and ownership above. Persisting
    // server-generated AI/media audit fields uses a separate backend-only
    // client so authenticated browsers never receive write grants for them.
    const admin = demo ? null : createSupabaseAdminClient();
    if (!demo && !admin) {
      return NextResponse.json({ message: "ระบบบันทึกร่างยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY" }, { status: 503 });
    }

    let draft;
    try {
      draft = await generateMerchantDraft({
        currentProfile,
        rawInput: body.rawInput,
        inputMethod: body.inputMethod,
        ...(body.image
          ? {
              image: {
                name: body.image.name,
                mediaType: body.image.mediaType,
                sizeBytes: body.image.sizeBytes,
                dataUrl: body.image.dataUrl,
              },
            }
          : {}),
        context: {
          cafeId: body.cafeId,
          ownerProfileId,
          draftId: randomUUID(),
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn("[merchant-draft] OpenAI output validation failed", {
          issues: safeZodIssueSummary(error),
        });
        return NextResponse.json(
          {
            message: "ระบบ AI อ่านข้อมูลแล้ว แต่ยังจัดโครงสร้างร่างไม่สำเร็จ กรุณาลองอีกครั้งค่ะ",
            code: "AI_PROVIDER_RESPONSE_INVALID",
          },
          { status: 502 },
        );
      }
      throw error;
    }

    if (admin) {
      const { error } = await admin.from("content_drafts").insert({
        id: draft.id,
        cafe_id: body.cafeId,
        owner_profile_id: ownerProfileId,
        update_kind: updateKind(draft.structuredUpdate.kinds),
        input_method: body.inputMethod,
        source_input_text: body.rawInput || `[Photo: ${body.image?.name || "merchant evidence"}]`,
        source_language: draft.inputLanguage === "unknown" ? "th" : draft.inputLanguage,
        structured_data: draft.structuredUpdate,
        thai_copy: draft.copy.th,
        english_copy: draft.copy.en,
        generation_metadata: draft.generation,
        source_media: draft.sourceImages,
        status: "draft",
      });
      if (error) {
        return NextResponse.json(
          { message: "บันทึกร่างใน Supabase ไม่สำเร็จ", detail: error.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      draft,
      currentProfile,
      mode: demo ? "demo" : "supabase",
      provider: draft.generation.provider,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[merchant-draft] Internal schema validation failed", {
        issues: safeZodIssueSummary(error),
      });
      return NextResponse.json(
        { message: "ระบบตรวจสอบข้อมูลภายในไม่สำเร็จ กรุณาลองอีกครั้งค่ะ" },
        { status: 503 },
      );
    }
    const providerError = await classifyMerchantDraftProviderError(error);
    if (providerError) {
      console.warn("[merchant-draft] Provider request failed", {
        code: providerError.code,
        status: providerError.status,
      });
      return NextResponse.json(
        {
          message: providerError.publicMessage,
          code: providerError.code,
        },
        {
          status: providerError.status,
          ...(providerError.retryAfter
            ? { headers: { "Retry-After": providerError.retryAfter } }
            : {}),
        },
      );
    }
    return NextResponse.json(
      {
        message: "สร้างร่างไม่สำเร็จ ข้อมูลหน้าร้านเดิมยังไม่เปลี่ยน",
      },
      { status: 503 },
    );
  }
}
