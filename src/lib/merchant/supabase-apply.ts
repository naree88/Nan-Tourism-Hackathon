import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MerchantDraft,
  MerchantOfferingRemoval,
  MerchantWorkationPatch,
  OfferingAvailabilityStatus,
  RoastLevel,
} from "@/lib/domain";
import {
  applyMerchantUpdateToProfile,
  loadSupabaseMerchantProfile,
  type MerchantProfileSnapshot,
} from "./profile";

type OfferingTraceRow = {
  altitude_min_m: number | null;
  altitude_max_m: number | null;
  varietal: string | null;
  processing_province: string | null;
  processing_locality: string | null;
  roaster_province: string | null;
  roaster_locality: string | null;
};

type OfferingRemovalRow = {
  id: string;
  bean_name: string;
  updated_at: string;
  approval_status: string;
  published_at: string | null;
};

export function toDatabaseProcess(value?: string) {
  switch (value) {
    case "natural":
    case "washed":
    case "honey":
    case "anaerobic":
    case "other":
      return value;
    case "carbonic-maceration":
      return "carbonic_maceration";
    case "unknown":
    case undefined:
      return "unknown";
    default:
      return "unknown";
  }
}

export function toDatabaseRoastLevel(value?: RoastLevel) {
  switch (value) {
    case "medium-light":
      return "medium_light";
    case "medium-dark":
      return "medium_dark";
    case "light":
    case "medium":
    case "dark":
      return value;
    case "unknown":
    case undefined:
      return "unspecified";
  }
}

export function toDatabaseAvailability(value?: OfferingAvailabilityStatus) {
  switch (value) {
    case "available":
    case "limited":
    case "unavailable":
    case "unknown":
      return value;
    case undefined:
      return "unknown";
  }
}

export function toDatabaseOutlets(value?: MerchantWorkationPatch["outlets"]) {
  switch (value) {
    case "at-most-seats":
      return "most_seats";
    case "some":
      return "limited";
    case "none":
      return "none";
    case "unknown":
    case undefined:
      return "unknown";
  }
}

export function toDatabaseWorkSuitability(value?: MerchantWorkationPatch["workSeating"]) {
  switch (value) {
    case "good":
      return "suitable";
    case "possible":
    case "not-suitable":
      return "limited";
    case "unknown":
    case undefined:
      return "not_assessed";
  }
}

export function toDatabaseVideoCallSuitability(value?: MerchantWorkationPatch["videoCalls"]) {
  switch (value) {
    case "good":
      return "suitable";
    case "possible":
      return "possible";
    case "not-suitable":
      return "not_recommended";
    case "unknown":
    case undefined:
      return "not_assessed";
  }
}

export function isNanProvince(value?: string) {
  if (!value) return false;
  const normalized = value.trim().toLocaleLowerCase("th-TH");
  return normalized === "nan" || normalized === "น่าน" || normalized === "จังหวัดน่าน";
}

function requireRow<T>(data: T | null, message: string): T {
  if (!data) throw new Error(message);
  return data;
}

async function validateMenuTargets(admin: SupabaseClient, draft: MerchantDraft) {
  const targetIds = [...new Set(
    (draft.structuredUpdate.menuItems ?? []).flatMap((item) => item.id ? [item.id] : []),
  )];
  if (targetIds.length === 0) return;

  const { data, error } = await admin
    .from("menu_items")
    .select("id")
    .eq("cafe_id", draft.cafeId)
    .in("id", targetIds);
  if (error) throw new Error(`Unable to validate menu targets: ${error.message}`);
  const found = new Set((data ?? []).map((row) => row.id as string));
  const invalidTarget = targetIds.find((id) => !found.has(id));
  if (invalidTarget) throw new Error("A proposed menu item does not belong to this cafe.");
}

function normalizedBeanName(value: string): string {
  return value.trim().normalize("NFC").toLocaleLowerCase("th-TH");
}

async function validateOfferingRemovalTargets(
  admin: SupabaseClient,
  cafeId: string,
  removals: readonly MerchantOfferingRemoval[],
): Promise<OfferingRemovalRow[]> {
  if (removals.length === 0) return [];
  if (removals.some((removal) => !removal.offeringId)) {
    throw new Error("A persisted Single Origin removal requires an offering ID.");
  }

  const targetIds = [...new Set(removals.map((removal) => removal.offeringId!))];
  if (targetIds.length !== removals.length) {
    throw new Error("The same Single Origin bean cannot be removed twice.");
  }

  const { data, error } = await admin
    .from("coffee_offerings")
    .select("id, bean_name, updated_at, approval_status, published_at")
    .eq("cafe_id", cafeId)
    .in("id", targetIds);
  if (error) throw new Error(`Unable to validate Single Origin removals: ${error.message}`);

  const rows = (data ?? []) as OfferingRemovalRow[];
  for (const removal of removals) {
    const row = rows.find((item) => item.id === removal.offeringId);
    if (!row) throw new Error(`Single Origin bean ${removal.beanName} does not belong to this cafe.`);
    if (row.approval_status !== "approved" || !row.published_at) {
      throw new Error(`Single Origin bean ${removal.beanName} is no longer public.`);
    }
    if (normalizedBeanName(row.bean_name) !== normalizedBeanName(removal.beanName)) {
      throw new Error(`Single Origin bean ${removal.beanName} changed after the removal draft was created.`);
    }
    if (removal.expectedUpdatedAt && row.updated_at !== removal.expectedUpdatedAt) {
      throw new Error(`Single Origin bean ${removal.beanName} was updated after the removal draft was created.`);
    }
  }
  return rows;
}

async function applyOfferingRemovalDraftAtomically(
  admin: SupabaseClient,
  draft: MerchantDraft,
  reviewerId: string,
  reviewedAt: string,
) {
  const removals = draft.structuredUpdate.offeringRemovals ?? [];
  const containsOtherPublicMutation = Boolean(
    draft.structuredUpdate.offering
    || draft.structuredUpdate.menuItems?.length
    || draft.structuredUpdate.openingNote !== undefined
    || draft.structuredUpdate.workation,
  );
  if (containsOtherPublicMutation || draft.structuredUpdate.kinds.some((kind) => kind !== "offering")) {
    throw new Error("A sold-out Single Origin removal draft cannot contain other storefront changes.");
  }

  const { data, error } = await admin.rpc("apply_sold_out_offering_removal_draft", {
    p_draft_id: draft.id,
    p_cafe_id: draft.cafeId,
    p_reviewer_id: reviewerId,
    p_reviewed_at: reviewedAt,
  });
  if (error) throw new Error(`Unable to archive sold-out Single Origin beans: ${error.message}`);

  const result = data as { archived_offering_count?: number } | null;
  if (result?.archived_offering_count !== removals.length) {
    throw new Error("The sold-out Single Origin removal transaction returned an incomplete result.");
  }
}

async function publishOffering(
  admin: SupabaseClient,
  cafeId: string,
  offering: NonNullable<MerchantProfileSnapshot["featuredOffering"]>,
  reviewerId: string,
  reviewedAt: string,
) {
  if (!offering.beanName?.trim()) {
    throw new Error("A featured coffee bean name is required before approval.");
  }

  let existingTrace: OfferingTraceRow | null = null;
  if (offering.id) {
    const { data, error } = await admin
      .from("coffee_offerings")
      .select("altitude_min_m, altitude_max_m, varietal, processing_province, processing_locality, roaster_province, roaster_locality")
      .eq("id", offering.id)
      .eq("cafe_id", cafeId)
      .maybeSingle();
    if (error) throw new Error(`Unable to load existing bean trace: ${error.message}`);
    existingTrace = requireRow(data, "The featured offering does not belong to this cafe.") as OfferingTraceRow;
  }

  const payload = {
    cafe_id: cafeId,
    bean_name: offering.beanName.trim(),
    origin_province: offering.originProvince?.trim() || null,
    origin_name: offering.originName?.trim() || null,
    producer: offering.producer?.trim() || null,
    altitude_min_m: offering.altitudeMeters?.min ?? existingTrace?.altitude_min_m ?? null,
    altitude_max_m: offering.altitudeMeters?.max ?? existingTrace?.altitude_max_m ?? null,
    varietal: offering.varietal?.trim() || existingTrace?.varietal || null,
    is_nan_grown: isNanProvince(offering.originProvince) && Boolean(offering.originName?.trim()),
    process: toDatabaseProcess(offering.process),
    processing_province: offering.processingLocation?.province?.trim() || existingTrace?.processing_province || null,
    processing_locality: offering.processingLocation?.locality?.trim() || existingTrace?.processing_locality || null,
    roast_level: toDatabaseRoastLevel(offering.roastLevel),
    roaster_province: offering.roasterLocation?.province?.trim() || existingTrace?.roaster_province || null,
    roaster_locality: offering.roasterLocation?.locality?.trim() || existingTrace?.roaster_locality || null,
    tasting_notes_th: offering.tastingNotes.map((note) => note.th),
    tasting_notes_en: offering.tastingNotes.map((note) => note.en),
    brew_methods: offering.brewMethods,
    price_thb: offering.price?.amount ?? null,
    availability: toDatabaseAvailability(offering.availability),
    approval_status: "draft",
    approved_by: null,
    approved_at: null,
    published_at: null,
    source_name: "Merchant-approved co-pilot draft",
    data_label: "merchant_reported",
    verification_note: "Merchant-approved; provenance and origin remain merchant-reported.",
  };

  let offeringId = offering.id;
  if (offeringId) {
    const { data, error } = await admin
      .from("coffee_offerings")
      .update(payload)
      .eq("id", offeringId)
      .eq("cafe_id", cafeId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(`Unable to update featured offering: ${error.message}`);
    requireRow(data, "The featured offering does not belong to this cafe.");
  } else {
    const { data, error } = await admin
      .from("coffee_offerings")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(`Unable to create featured offering: ${error.message}`);
    offeringId = requireRow(data, "The featured offering was not created.").id as string;
  }

  const { data: published, error: publishError } = await admin
    .from("coffee_offerings")
    .update({
      approval_status: "approved",
      approved_by: reviewerId,
      approved_at: reviewedAt,
      published_at: reviewedAt,
    })
    .eq("id", offeringId)
    .eq("cafe_id", cafeId)
    .eq("approval_status", "draft")
    .select("id")
    .maybeSingle();
  if (publishError) throw new Error(`Unable to publish featured offering: ${publishError.message}`);
  requireRow(published, "The featured offering changed before it could be published.");
  return offeringId;
}

async function publishMenuItems(
  admin: SupabaseClient,
  cafeId: string,
  draft: MerchantDraft,
  proposedProfile: MerchantProfileSnapshot,
  featuredOfferingId: string | undefined,
  reviewerId: string,
  reviewedAt: string,
) {
  for (const patch of draft.structuredUpdate.menuItems ?? []) {
    const proposed = proposedProfile.menuItems.find((item) =>
      (patch.id && item.id === patch.id)
      || (!patch.id && item.nameTh.trim().toLocaleLowerCase("th-TH") === patch.nameTh.trim().toLocaleLowerCase("th-TH")),
    );
    if (!proposed) throw new Error(`Unable to resolve proposed menu item: ${patch.nameTh}`);
    if (patch.usesFeaturedSingleOrigin && !featuredOfferingId) {
      throw new Error(`Menu item ${patch.nameTh} requires a featured single-origin coffee.`);
    }

    const payload = {
      cafe_id: cafeId,
      name_th: proposed.nameTh,
      name_en: proposed.nameEn ?? null,
      description_th: proposed.descriptionTh ?? null,
      description_en: proposed.descriptionEn ?? null,
      price_thb: proposed.priceThb ?? null,
      is_available: proposed.isAvailable,
      is_cafe_pick: proposed.isCafePick,
      ...(patch.usesFeaturedSingleOrigin !== undefined
        ? { featured_offering_id: patch.usesFeaturedSingleOrigin ? featuredOfferingId : null }
        : {}),
      approval_status: "draft",
      approved_by: null,
      approved_at: null,
      published_at: null,
      source_name: "Merchant-approved co-pilot draft",
      data_label: "merchant_reported",
      verification_note: "Merchant-approved menu information.",
    };

    let menuId = proposed.id;
    if (menuId) {
      const { data, error } = await admin
        .from("menu_items")
        .update(payload)
        .eq("id", menuId)
        .eq("cafe_id", cafeId)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Unable to update menu item ${proposed.nameTh}: ${error.message}`);
      requireRow(data, `Menu item ${proposed.nameTh} does not belong to this cafe.`);
    } else {
      const { data, error } = await admin.from("menu_items").insert(payload).select("id").single();
      if (error) throw new Error(`Unable to create menu item ${proposed.nameTh}: ${error.message}`);
      menuId = requireRow(data, `Menu item ${proposed.nameTh} was not created.`).id as string;
    }

    const { data: published, error: publishError } = await admin
      .from("menu_items")
      .update({
        approval_status: "approved",
        approved_by: reviewerId,
        approved_at: reviewedAt,
        published_at: reviewedAt,
      })
      .eq("id", menuId)
      .eq("cafe_id", cafeId)
      .eq("approval_status", "draft")
      .select("id")
      .maybeSingle();
    if (publishError) throw new Error(`Unable to publish menu item ${proposed.nameTh}: ${publishError.message}`);
    requireRow(published, `Menu item ${proposed.nameTh} changed before it could be published.`);
  }
}

async function publishOpeningNote(
  admin: SupabaseClient,
  profile: MerchantProfileSnapshot,
  reviewedAt: string,
) {
  const { data: currentCafe, error: currentError } = await admin
    .from("cafes")
    .select("id, status")
    .eq("id", profile.cafe.id)
    .in("status", ["published", "temporarily_closed"])
    .not("published_at", "is", null)
    .maybeSingle();
  if (currentError) throw new Error(`Unable to load cafe publication state: ${currentError.message}`);
  const cafe = requireRow(currentCafe, "The cafe is not currently published.");

  const { data: drafted, error: updateError } = await admin
    .from("cafes")
    .update({ opening_note_th: profile.openingNote ?? null })
    .eq("id", profile.cafe.id)
    .select("id")
    .maybeSingle();
  if (updateError) throw new Error(`Unable to update opening note: ${updateError.message}`);
  requireRow(drafted, "The cafe opening note was not updated.");

  const restoreStatus = cafe.status === "temporarily_closed" ? "temporarily_closed" : "published";
  const { data: published, error: publishError } = await admin
    .from("cafes")
    .update({ status: restoreStatus, published_at: reviewedAt })
    .eq("id", profile.cafe.id)
    .select("id")
    .maybeSingle();
  if (publishError) throw new Error(`Unable to republish opening note: ${publishError.message}`);
  requireRow(published, "The cafe opening note was not republished.");
}

async function publishWorkation(
  admin: SupabaseClient,
  cafeId: string,
  draft: MerchantDraft,
  workation: MerchantWorkationPatch,
  reviewerId: string,
  reviewedAt: string,
) {
  const payload = {
    cafe_id: cafeId,
    ...(workation.wifi !== undefined ? { free_wifi: workation.wifi === "available" } : {}),
    ...(workation.outlets !== undefined ? { outlets: toDatabaseOutlets(workation.outlets) } : {}),
    ...(workation.workSeating !== undefined
      ? { work_suitability: toDatabaseWorkSuitability(workation.workSeating) }
      : {}),
    ...(workation.videoCalls !== undefined
      ? { video_call_suitability: toDatabaseVideoCallSuitability(workation.videoCalls) }
      : {}),
    ...(workation.policyText !== undefined
      ? { hours_policy_th: workation.policyText.trim() || null }
      : {}),
    approval_status: "draft",
    approved_by: null,
    approved_at: null,
    published_at: null,
    source_name: "Merchant-approved co-pilot draft",
    data_label: "merchant_reported",
    verification_note: "Merchant-approved workspace information; conditions may change.",
  };

  const { data: existing, error: existingError } = await admin
    .from("workation_details")
    .select("cafe_id")
    .eq("cafe_id", cafeId)
    .maybeSingle();
  if (existingError) throw new Error(`Unable to load workation details: ${existingError.message}`);

  if (existing) {
    const { data, error } = await admin
      .from("workation_details")
      .update(payload)
      .eq("cafe_id", cafeId)
      .select("cafe_id")
      .maybeSingle();
    if (error) throw new Error(`Unable to update workation details: ${error.message}`);
    requireRow(data, "Workation details were not updated.");
  } else {
    const { data, error } = await admin.from("workation_details").insert(payload).select("cafe_id").single();
    if (error) throw new Error(`Unable to create workation details: ${error.message}`);
    requireRow(data, "Workation details were not created.");
  }

  const { data: published, error: publishError } = await admin
    .from("workation_details")
    .update({
      approval_status: "approved",
      approved_by: reviewerId,
      approved_at: reviewedAt,
      published_at: reviewedAt,
    })
    .eq("cafe_id", cafeId)
    .eq("approval_status", "draft")
    .select("cafe_id")
    .maybeSingle();
  if (publishError) throw new Error(`Unable to publish workation details: ${publishError.message}`);
  requireRow(published, "Workation details changed before they could be published.");

  const speedPatch = draft.structuredUpdate.workation;
  const speedTouched = speedPatch
    && [speedPatch.downloadMbps, speedPatch.uploadMbps, speedPatch.pingMs].some((value) => value !== undefined);
  if (!speedTouched) return;
  if (
    workation.downloadMbps === undefined
    || workation.uploadMbps === undefined
    || workation.pingMs === undefined
  ) {
    throw new Error("Download, upload, and ping are all required for an internet speed report.");
  }

  const { data: speedReport, error: speedError } = await admin
    .from("speed_reports")
    .insert({
      cafe_id: cafeId,
      reporter_profile_id: reviewerId,
      verification_level: "merchant_reported",
      download_mbps: workation.downloadMbps,
      upload_mbps: workation.uploadMbps,
      ping_ms: workation.pingMs,
      tested_at: reviewedAt,
      test_provider: "Merchant profile update",
      moderation_status: "published",
      published_at: reviewedAt,
      source_name: "Merchant-approved co-pilot draft",
      data_label: "merchant_reported",
      verification_note: "Merchant-reported snapshot; internet performance may change.",
    })
    .select("id")
    .single();
  if (speedError) throw new Error(`Unable to publish internet speed report: ${speedError.message}`);
  requireRow(speedReport, "The internet speed report was not created.");
}

export async function applyMerchantDraftToSupabase(
  admin: SupabaseClient,
  draft: MerchantDraft,
  reviewerId: string,
): Promise<MerchantProfileSnapshot> {
  if (draft.status !== "draft") throw new Error("Only a draft can be applied.");
  if (draft.ownerProfileId !== reviewerId) throw new Error("Only the owning merchant can apply this draft.");
  if (draft.structuredUpdate.kinds.length === 0) throw new Error("The draft contains no profile changes.");

  const currentProfile = await loadSupabaseMerchantProfile(admin, draft.cafeId);
  if (!currentProfile) throw new Error("The published cafe profile no longer exists.");
  const proposedProfile = applyMerchantUpdateToProfile(currentProfile, draft.structuredUpdate);
  const reviewedAt = new Date().toISOString();

  // Validate every client-editable foreign identifier before the first public
  // mutation. This prevents a cross-cafe menu ID from causing a later partial
  // publish after an earlier offering write.
  await validateMenuTargets(admin, draft);
  const offeringRemovals = draft.structuredUpdate.offeringRemovals ?? [];
  await validateOfferingRemovalTargets(admin, draft.cafeId, offeringRemovals);
  const speedPatch = draft.structuredUpdate.workation;
  const speedTouched = speedPatch
    && [speedPatch.downloadMbps, speedPatch.uploadMbps, speedPatch.pingMs].some((value) => value !== undefined);
  if (
    speedTouched
    && (
      proposedProfile.workation?.downloadMbps === undefined
      || proposedProfile.workation.uploadMbps === undefined
      || proposedProfile.workation.pingMs === undefined
    )
  ) {
    throw new Error("Download, upload, and ping are all required for an internet speed report.");
  }

  let featuredOfferingId = proposedProfile.featuredOffering?.id;
  if (offeringRemovals.length) {
    await applyOfferingRemovalDraftAtomically(
      admin,
      draft,
      reviewerId,
      reviewedAt,
    );
    const canonicalProfile = await loadSupabaseMerchantProfile(admin, draft.cafeId);
    if (!canonicalProfile) throw new Error("The published cafe profile could not be reloaded after approval.");
    return canonicalProfile;
  }
  if (draft.structuredUpdate.offering) {
    if (!proposedProfile.featuredOffering) throw new Error("The featured offering patch is incomplete.");
    featuredOfferingId = await publishOffering(
      admin,
      draft.cafeId,
      proposedProfile.featuredOffering,
      reviewerId,
      reviewedAt,
    );
    proposedProfile.featuredOffering.id = featuredOfferingId;
    const publishedName = proposedProfile.featuredOffering.beanName?.trim().toLocaleLowerCase("th-TH");
    const offeringIndex = proposedProfile.offerings?.findIndex((item) =>
      (item.id && item.id === featuredOfferingId)
      || (!item.id && item.beanName?.trim().toLocaleLowerCase("th-TH") === publishedName),
    ) ?? -1;
    if (offeringIndex >= 0 && proposedProfile.offerings) {
      proposedProfile.offerings[offeringIndex] = {
        ...proposedProfile.offerings[offeringIndex],
        id: featuredOfferingId,
      };
    }
  }

  if (draft.structuredUpdate.menuItems?.length) {
    await publishMenuItems(
      admin,
      draft.cafeId,
      draft,
      proposedProfile,
      featuredOfferingId,
      reviewerId,
      reviewedAt,
    );
  }
  if (draft.structuredUpdate.openingNote !== undefined) {
    await publishOpeningNote(admin, proposedProfile, reviewedAt);
  }
  if (draft.structuredUpdate.workation) {
    if (!proposedProfile.workation) throw new Error("The workation patch is incomplete.");
    await publishWorkation(admin, draft.cafeId, draft, proposedProfile.workation, reviewerId, reviewedAt);
  }

  const { data: applied, error: applyError } = await admin
    .from("content_drafts")
    .update({
      status: "applied",
      approved_by: reviewerId,
      approved_at: reviewedAt,
      applied_at: reviewedAt,
    })
    .eq("id", draft.id)
    .eq("cafe_id", draft.cafeId)
    .eq("owner_profile_id", reviewerId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (applyError) throw new Error(`Unable to mark merchant draft as applied: ${applyError.message}`);
  requireRow(applied, "The merchant draft changed before it could be applied.");

  const canonicalProfile = await loadSupabaseMerchantProfile(admin, draft.cafeId);
  if (!canonicalProfile) throw new Error("The published cafe profile could not be reloaded after approval.");
  return canonicalProfile;
}
