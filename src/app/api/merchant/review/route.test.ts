import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isDemoMode: () => true }));
vi.mock("@/lib/auth/demo-merchant-session", () => ({
  requireDemoMerchantSession: vi.fn(),
}));
vi.mock("@/lib/demo/merchant", () => ({ getDemoMerchantProfile: vi.fn() }));

import { POST } from "./route";
import { requireDemoMerchantSession } from "@/lib/auth/demo-merchant-session";
import { getDemoMerchantProfile } from "@/lib/demo/merchant";
import { buildMerchantDraftFromStructuredUpdate } from "@/lib/domain";
import type { MerchantProfileSnapshot } from "@/lib/merchant/profile";

describe("POST /api/merchant/review demo authentication", () => {
  beforeEach(() => {
    vi.mocked(requireDemoMerchantSession).mockReset();
    vi.mocked(requireDemoMerchantSession).mockResolvedValue({
      ok: false,
      status: 401,
      message: "กรุณาเข้าสู่ระบบร้านค้า",
    });
    vi.mocked(getDemoMerchantProfile).mockReset();
  });

  it("rejects an anonymous request before parsing its draft", async () => {
    const response = await POST(new Request("http://localhost/api/merchant/review", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "กรุณาเข้าสู่ระบบร้านค้า" });
  });

  it("preserves an edited availability status through draft approval", async () => {
    vi.mocked(requireDemoMerchantSession).mockResolvedValueOnce({
      ok: true,
      userId: "auth-user-1",
      ownerProfileId: "merchant-demo-01",
    });
    const currentProfile: MerchantProfileSnapshot = {
      cafe: {
        id: "cafe-finder-demo-01",
        slug: "demo-cafe",
        nameTh: "ร้านกาแฟเดโม",
      },
      featuredOffering: {
        id: "offering-01",
        beanName: "ดอยสวนยาหลวง",
        process: "washed",
        roastLevel: "light",
        tastingNotes: [],
        tasteProfiles: [],
        brewMethods: ["filter"],
        availability: "available",
      },
      offerings: [{
        id: "offering-01",
        beanName: "ดอยสวนยาหลวง",
        process: "washed",
        roastLevel: "light",
        tastingNotes: [],
        tasteProfiles: [],
        brewMethods: ["filter"],
        availability: "available",
      }],
      menuItems: [],
      updatedAt: "2026-07-13T03:00:00.000Z",
    };
    vi.mocked(getDemoMerchantProfile).mockReturnValue(currentProfile);

    const draft = buildMerchantDraftFromStructuredUpdate(
      "ปรับสถานะเมล็ดดอยสวนยาหลวงเป็นมีจำนวนจำกัด",
      {
        kinds: ["offering"],
        offering: {
          beanName: "ดอยสวนยาหลวง",
          tastingNotes: [],
          tasteProfiles: [],
          brewMethods: [],
          availability: "limited",
        },
        fieldEvidence: [],
        unresolvedFields: [],
        extractorVersion: "test-v1",
      },
      {
        cafeId: currentProfile.cafe.id,
        ownerProfileId: "merchant-demo-01",
        draftId: "draft-availability-01",
        createdAt: "2026-07-13T04:00:00.000Z",
      },
    );

    const response = await POST(new Request("http://localhost/api/merchant/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", draft }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.draft.status).toBe("approved");
    expect(payload.draft.structuredUpdate.offering.availability).toBe("limited");
    expect(payload.proposedProfile.featuredOffering.availability).toBe("limited");
    expect(payload.proposedProfile.offerings[0].availability).toBe("limited");
  });
});
