import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const profileMocks = vi.hoisted(() => ({
  loadSupabaseMerchantProfile: vi.fn(),
}));

vi.mock("./profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./profile")>();
  return {
    ...actual,
    loadSupabaseMerchantProfile: profileMocks.loadSupabaseMerchantProfile,
  };
});

import type { MerchantDraft } from "@/lib/domain";
import type { MerchantProfileSnapshot } from "./profile";
import { applyMerchantDraftToSupabase } from "./supabase-apply";

const cafeId = "30000000-0000-4000-8000-000000000001";
const ownerId = "30000000-0000-4000-8000-000000000002";
const draftId = "30000000-0000-4000-8000-000000000003";
const offeringId = "30000000-0000-4000-8000-000000000004";
const updatedAt = "2026-07-13T02:00:00.000Z";

const currentProfile: MerchantProfileSnapshot = {
  cafe: { id: cafeId, slug: "atomic-cafe", nameTh: "ร้านทดสอบ" },
  featuredOffering: {
    id: offeringId,
    updatedAt,
    beanName: "น่านล็อต 07",
    tasteProfiles: [],
    tastingNotes: [],
    brewMethods: [],
  },
  offerings: [{
    id: offeringId,
    updatedAt,
    beanName: "น่านล็อต 07",
    tasteProfiles: [],
    tastingNotes: [],
    brewMethods: [],
  }],
  menuItems: [{
    id: "30000000-0000-4000-8000-000000000005",
    nameTh: "ดริปน่าน",
    isAvailable: true,
    isCafePick: true,
    usesFeaturedSingleOrigin: true,
    featuredOfferingId: offeringId,
  }],
  updatedAt,
};

const canonicalProfile: MerchantProfileSnapshot = {
  ...currentProfile,
  featuredOffering: undefined,
  offerings: [],
  menuItems: [{
    ...currentProfile.menuItems[0],
    usesFeaturedSingleOrigin: false,
    featuredOfferingId: undefined,
  }],
  updatedAt: "2026-07-13T02:01:00.000Z",
};

const removalDraft = {
  id: draftId,
  cafeId,
  ownerProfileId: ownerId,
  status: "draft",
  structuredUpdate: {
    kinds: ["offering"],
    offeringRemovals: [{
      offeringId,
      beanName: "น่านล็อต 07",
      reason: "sold-out",
      expectedUpdatedAt: updatedAt,
    }],
  },
} as MerchantDraft;

function resolvedQuery<T>(result: T) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    then: (onFulfilled: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return query;
}

describe("atomic sold-out Single Origin approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileMocks.loadSupabaseMerchantProfile
      .mockReset()
      .mockResolvedValueOnce(currentProfile)
      .mockResolvedValueOnce(canonicalProfile);
  });

  it("validates the canonical bean, then delegates all public writes and draft application to one RPC", async () => {
    const offeringQuery = resolvedQuery({
      data: [{
        id: offeringId,
        bean_name: "น่านล็อต 07",
        updated_at: updatedAt,
        approval_status: "approved",
        published_at: updatedAt,
      }],
      error: null,
    });
    const from = vi.fn((table: string) => {
      expect(table).toBe("coffee_offerings");
      return offeringQuery;
    });
    const rpc = vi.fn().mockResolvedValue({
      data: { archived_offering_count: 1, unlinked_menu_count: 1 },
      error: null,
    });
    const admin = { from, rpc } as unknown as SupabaseClient;

    await expect(applyMerchantDraftToSupabase(admin, removalDraft, ownerId))
      .resolves.toEqual(canonicalProfile);

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("apply_sold_out_offering_removal_draft", {
      p_draft_id: draftId,
      p_cafe_id: cafeId,
      p_reviewer_id: ownerId,
      p_reviewed_at: expect.any(String),
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(profileMocks.loadSupabaseMerchantProfile).toHaveBeenCalledTimes(2);
  });

  it("does not reload or claim success when the atomic RPC fails", async () => {
    const offeringQuery = resolvedQuery({
      data: [{
        id: offeringId,
        bean_name: "น่านล็อต 07",
        updated_at: updatedAt,
        approval_status: "approved",
        published_at: updatedAt,
      }],
      error: null,
    });
    const admin = {
      from: vi.fn(() => offeringQuery),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "transaction rolled back" } }),
    } as unknown as SupabaseClient;

    await expect(applyMerchantDraftToSupabase(admin, removalDraft, ownerId))
      .rejects.toThrow("Unable to archive sold-out Single Origin beans: transaction rolled back");
    expect(profileMocks.loadSupabaseMerchantProfile).toHaveBeenCalledTimes(1);
  });
});
