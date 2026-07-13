import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireDemoMerchantSession } from "@/lib/auth/demo-merchant-session";
import { buildMerchantDraftFromStructuredUpdate } from "@/lib/domain/merchant";
import type { StructuredMerchantUpdate } from "@/lib/domain/types";
import { getDemoMerchantProfile } from "@/lib/demo/merchant";
import { merchantOfferingRemovalDraftRequestSchema } from "@/lib/merchant/contracts";
import {
  loadSupabaseMerchantProfile,
  type MerchantProfileSnapshot,
} from "@/lib/merchant/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REMOVAL_EXTRACTOR_VERSION = "merchant-offering-removal-v1.0.0";

type RemovalCandidate = {
  id?: string;
  beanName?: string;
  updatedAt?: string;
};

class OfferingRemovalRouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function normalizeBeanName(value: string) {
  return value.trim().normalize("NFC").toLocaleLowerCase("th-TH");
}

function publicOfferings(profile: MerchantProfileSnapshot): RemovalCandidate[] {
  if (profile.offerings?.length) return profile.offerings;
  return profile.featuredOffering ? [profile.featuredOffering] : [];
}

function resolveDemoOffering(
  profile: MerchantProfileSnapshot,
  input: { offeringId?: string; beanName: string },
) {
  const offerings = publicOfferings(profile);
  if (input.offeringId) {
    return offerings.find((offering) => offering.id === input.offeringId) ?? null;
  }

  const requestedName = normalizeBeanName(input.beanName);
  const matches = offerings.filter((offering) =>
    offering.beanName && normalizeBeanName(offering.beanName) === requestedName,
  );
  if (matches.length > 1) {
    throw new OfferingRemovalRouteError(
      "พบเมล็ดชื่อเดียวกันมากกว่าหนึ่งรายการ กรุณาเลือกเมล็ดจากรายการอีกครั้ง",
      409,
    );
  }
  return matches[0] ?? null;
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

    const body = merchantOfferingRemovalDraftRequestSchema.parse(await request.json());
    const supabase = demo ? null : await createSupabaseServerClient();
    if (!demo && !supabase) {
      throw new OfferingRemovalRouteError("ระบบ Supabase ยังตั้งค่าไม่ครบ", 503);
    }

    let ownerProfileId = "merchant-demo-01";
    let currentProfile: MerchantProfileSnapshot | null = null;
    let targetOffering: RemovalCandidate | null = null;

    if (supabase) {
      if (!body.offeringId) {
        throw new OfferingRemovalRouteError(
          "กรุณาเลือกเมล็ดจากหน้าร้านก่อนสร้างร่างนำออก",
          400,
        );
      }

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (claimsError || !userId) {
        throw new OfferingRemovalRouteError("กรุณาเข้าสู่ระบบเจ้าของร้าน", 401);
      }

      const { data: ownership, error: ownershipError } = await supabase
        .from("cafe_owners")
        .select("cafe_id")
        .eq("cafe_id", body.cafeId)
        .eq("profile_id", userId)
        .eq("status", "verified")
        .maybeSingle();
      if (ownershipError) {
        throw new OfferingRemovalRouteError("ตรวจสอบสิทธิ์เจ้าของร้านไม่สำเร็จ", 500);
      }
      if (!ownership) {
        throw new OfferingRemovalRouteError("บัญชีนี้ไม่มีสิทธิ์จัดการร้านดังกล่าว", 403);
      }

      ownerProfileId = userId;
      currentProfile = await loadSupabaseMerchantProfile(supabase, body.cafeId);
      targetOffering = currentProfile
        ? publicOfferings(currentProfile).find((offering) => offering.id === body.offeringId) ?? null
        : null;
    } else {
      currentProfile = getDemoMerchantProfile(body.cafeId);
      targetOffering = currentProfile ? resolveDemoOffering(currentProfile, body) : null;
    }

    if (!currentProfile) {
      throw new OfferingRemovalRouteError("ไม่พบข้อมูลหน้าร้านปัจจุบัน", 404);
    }
    if (!targetOffering?.id) {
      throw new OfferingRemovalRouteError(
        "ไม่พบเมล็ดที่เผยแพร่อยู่ในหน้าร้าน หรือเมล็ดถูกนำออกไปแล้ว",
        404,
      );
    }

    const canonicalBeanName = targetOffering.beanName?.trim();
    if (!canonicalBeanName) {
      throw new OfferingRemovalRouteError("ข้อมูลเมล็ดปัจจุบันไม่มีชื่อที่ใช้ตรวจสอบได้", 409);
    }

    // Identity and ownership are checked through the user's session above;
    // only the backend writes the canonical removal draft and audit metadata.
    const admin = demo ? null : createSupabaseAdminClient();
    if (!demo && !admin) {
      throw new OfferingRemovalRouteError("ระบบบันทึกร่างยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY", 503);
    }

    const createdAt = new Date().toISOString();
    const rawInput = `นำเมล็ด ${canonicalBeanName} ออกจากหน้าร้าน เนื่องจากจำหน่ายหมดแล้ว`;
    const structuredUpdate = {
      kinds: ["offering"],
      offeringRemovals: [{
        offeringId: targetOffering.id,
        beanName: canonicalBeanName,
        reason: "sold-out",
        expectedUpdatedAt: targetOffering.updatedAt ?? currentProfile.updatedAt,
      }],
      fieldEvidence: [{
        field: "offeringRemovals[0].beanName",
        sourceText: body.beanName,
        confidence: "high",
      }],
      unresolvedFields: [],
      extractorVersion: REMOVAL_EXTRACTOR_VERSION,
    } satisfies StructuredMerchantUpdate;

    const draft = buildMerchantDraftFromStructuredUpdate(rawInput, structuredUpdate, {
      cafeId: body.cafeId,
      ownerProfileId,
      draftId: randomUUID(),
      createdAt,
      inputMethod: "text",
      sourceImages: [],
      generation: {
        provider: "rules",
        promptVersion: REMOVAL_EXTRACTOR_VERSION,
        imageAnalysis: "not-provided",
      },
    });

    if (admin) {
      const { error } = await admin.from("content_drafts").insert({
        id: draft.id,
        cafe_id: body.cafeId,
        owner_profile_id: ownerProfileId,
        update_kind: "coffee_offering",
        input_method: "text",
        source_input_text: rawInput,
        source_language: draft.inputLanguage === "unknown" ? "th" : draft.inputLanguage,
        structured_data: draft.structuredUpdate,
        thai_copy: draft.copy.th,
        english_copy: draft.copy.en,
        generation_metadata: draft.generation,
        source_media: [],
        status: "draft",
      });
      if (error) {
        throw new OfferingRemovalRouteError(
          `บันทึกร่างนำเมล็ดออกใน Supabase ไม่สำเร็จ: ${error.message}`,
          500,
        );
      }
    }

    return NextResponse.json({
      draft,
      currentProfile,
      mode: demo ? "demo" : "supabase",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "ข้อมูลสำหรับนำเมล็ดออกไม่ถูกต้อง", issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof OfferingRemovalRouteError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        message: "สร้างร่างนำเมล็ดออกไม่สำเร็จ หน้าร้านเดิมยังไม่เปลี่ยน",
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
