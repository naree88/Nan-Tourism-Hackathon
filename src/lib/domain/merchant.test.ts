import { describe, expect, it } from "vitest";

import { demoMerchantVoiceUpdate } from "../demo";
import {
  approveMerchantDraft,
  buildMerchantDraft,
  createBilingualMerchantCopy,
  extractMerchantUpdate,
} from "./merchant";

describe("merchant co-pilot rules", () => {
  it("extracts the linked finder-cafe example without inferring an unspoken Nan origin", () => {
    const update = extractMerchantUpdate(demoMerchantVoiceUpdate);

    expect(update.kinds).toContain("offering");
    expect(update.offering).toMatchObject({
      beanName: "ดอยหมอกล็อต 01",
      originName: "ดอยหมอกล็อต 01",
      process: "natural",
      roastLevel: "light",
      brewMethods: ["filter"],
      price: { amount: 120, currency: "THB" },
      availability: "available",
    });
    expect(update.offering?.originProvince).toBeUndefined();
    expect(update.offering?.tastingNotes.map((note) => note.en)).toEqual(["strawberry", "orange"]);
    expect(update.unresolvedFields).not.toContain("offering.producer");
    expect(update.unresolvedFields).not.toContain("offering.originName");
  });

  it("creates a bilingual, review-before-approval draft", () => {
    const update = extractMerchantUpdate(demoMerchantVoiceUpdate);
    const copy = createBilingualMerchantCopy(update);
    const draft = buildMerchantDraft(demoMerchantVoiceUpdate, {
      cafeId: "cafe-finder-demo-01",
      ownerProfileId: "merchant-demo-01",
      createdAt: "2026-07-11T09:00:00+07:00",
    });

    expect(copy.th).toContain("สตรอว์เบอร์รี");
    expect(copy.en).toContain("strawberry");
    expect(copy.en).toContain("THB 120");
    expect(draft.status).toBe("draft");
    expect(draft.requiresExplicitApproval).toBe(true);
    expect(draft.safetyNotices[0].en).toContain("not public");
  });

  it("allows only the owning merchant to approve and leaves the original immutable", () => {
    const draft = buildMerchantDraft(demoMerchantVoiceUpdate, {
      cafeId: "cafe-finder-demo-01",
      ownerProfileId: "merchant-demo-01",
      createdAt: "2026-07-11T09:00:00+07:00",
    });

    expect(() =>
      approveMerchantDraft(draft, {
        profileId: "merchant-other",
        reviewedAt: "2026-07-11T09:05:00+07:00",
      }),
    ).toThrow(/owning merchant/i);

    const approved = approveMerchantDraft(draft, {
      profileId: "merchant-demo-01",
      reviewedAt: "2026-07-11T09:05:00+07:00",
    });
    expect(approved.status).toBe("approved");
    expect(draft.status).toBe("draft");
  });
});
