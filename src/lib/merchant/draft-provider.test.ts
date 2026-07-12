import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  generateMerchantDraft,
  getMerchantDraftProviderMode,
} from "./draft-provider";
import type { MerchantProfileSnapshot } from "./profile";

const originalProvider = process.env.MERCHANT_DRAFT_PROVIDER;

const currentProfile: MerchantProfileSnapshot = {
  cafe: {
    id: "cafe-mvp-01",
    slug: "nan-mvp-cafe",
    nameTh: "ร้านกาแฟน่าน MVP",
  },
  menuItems: [],
  updatedAt: "2026-07-13T09:00:00+07:00",
};

afterEach(() => {
  if (originalProvider === undefined) delete process.env.MERCHANT_DRAFT_PROVIDER;
  else process.env.MERCHANT_DRAFT_PROVIDER = originalProvider;
});

describe.sequential("merchant draft provider selection", () => {
  it("defaults to local rules and accepts the explicit deploy modes", () => {
    delete process.env.MERCHANT_DRAFT_PROVIDER;
    expect(getMerchantDraftProviderMode()).toBe("rules");

    process.env.MERCHANT_DRAFT_PROVIDER = "rules";
    expect(getMerchantDraftProviderMode()).toBe("rules");

    process.env.MERCHANT_DRAFT_PROVIDER = "ai-gateway";
    expect(getMerchantDraftProviderMode()).toBe("ai-gateway");
  });

  it("rejects an unknown provider instead of silently selecting one", () => {
    process.env.MERCHANT_DRAFT_PROVIDER = "openai-direct";
    expect(() => getMerchantDraftProviderMode()).toThrow();
  });

  it("keeps image bytes out of a rules draft and reports that the image was not analyzed", async () => {
    process.env.MERCHANT_DRAFT_PROVIDER = "rules";
    const draft = await generateMerchantDraft({
      currentProfile,
      rawInput: "",
      inputMethod: "photo",
      image: {
        name: "menu.jpg",
        mediaType: "image/jpeg",
        sizeBytes: 8,
        dataUrl: "data:image/jpeg;base64,/9j/2Q==",
      },
      context: {
        cafeId: "cafe-mvp-01",
        ownerProfileId: "merchant-01",
        draftId: "draft-rules-photo",
        createdAt: "2026-07-13T10:00:00+07:00",
      },
    });

    expect(draft.generation).toEqual({
      provider: "rules",
      promptVersion: "merchant-rules-v1.0.0",
      imageAnalysis: "not-supported",
    });
    expect(draft.sourceImages).toEqual([{
      name: "menu.jpg",
      mediaType: "image/jpeg",
      sizeBytes: 8,
    }]);
    expect(JSON.stringify(draft)).not.toContain("data:image/jpeg");
    expect(draft.structuredUpdate.kinds).toEqual([]);
    expect(draft.status).toBe("draft");
  });
});
