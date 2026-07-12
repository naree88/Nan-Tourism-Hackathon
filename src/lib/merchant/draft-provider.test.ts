import { afterEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";

vi.mock("server-only", () => ({}));

import {
  classifyMerchantDraftProviderError,
  generateMerchantDraft,
  getMerchantDraftProviderMode,
} from "./draft-provider";
import type { MerchantProfileSnapshot } from "./profile";

const originalProvider = process.env.MERCHANT_DRAFT_PROVIDER;
const originalModel = process.env.MERCHANT_AI_MODEL;
const originalOpenAIKey = process.env.OPENAI_API_KEY;

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
  if (originalModel === undefined) delete process.env.MERCHANT_AI_MODEL;
  else process.env.MERCHANT_AI_MODEL = originalModel;
  if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAIKey;
});

describe.sequential("merchant draft provider selection", () => {
  it("defaults to local rules and accepts the explicit deploy modes", () => {
    delete process.env.MERCHANT_DRAFT_PROVIDER;
    expect(getMerchantDraftProviderMode()).toBe("rules");

    process.env.MERCHANT_DRAFT_PROVIDER = "rules";
    expect(getMerchantDraftProviderMode()).toBe("rules");

    process.env.MERCHANT_DRAFT_PROVIDER = "openai-direct";
    expect(getMerchantDraftProviderMode()).toBe("openai-direct");
  });

  it("rejects an unknown provider instead of silently selecting one", () => {
    process.env.MERCHANT_DRAFT_PROVIDER = "ai-gateway";
    expect(() => getMerchantDraftProviderMode()).toThrow();
  });

  it("fails closed before a provider call when direct OpenAI configuration is missing", async () => {
    process.env.MERCHANT_DRAFT_PROVIDER = "openai-direct";
    process.env.MERCHANT_AI_MODEL = "gpt-5.6-luna";
    delete process.env.OPENAI_API_KEY;

    await expect(generateMerchantDraft({
      currentProfile,
      rawInput: "อัปเดตเมนูกาแฟวันนี้",
      inputMethod: "text",
      context: {
        cafeId: "cafe-mvp-01",
        ownerProfileId: "merchant-01",
        draftId: "draft-missing-openai-key",
        createdAt: "2026-07-13T10:00:00+07:00",
      },
    })).rejects.toMatchObject({
      code: "AI_CONFIGURATION_ERROR",
      status: 503,
    });
  });

  it("rejects a Gateway-style model string in direct OpenAI mode", async () => {
    process.env.MERCHANT_DRAFT_PROVIDER = "openai-direct";
    process.env.MERCHANT_AI_MODEL = "openai/gpt-5.6-luna";
    process.env.OPENAI_API_KEY = "sk-test-never-sent";

    await expect(generateMerchantDraft({
      currentProfile,
      rawInput: "อัปเดตเมนูกาแฟวันนี้",
      inputMethod: "text",
      context: {
        cafeId: "cafe-mvp-01",
        ownerProfileId: "merchant-01",
        draftId: "draft-invalid-direct-model",
        createdAt: "2026-07-13T10:00:00+07:00",
      },
    })).rejects.toMatchObject({ code: "AI_CONFIGURATION_ERROR" });
  });

  it("distinguishes exhausted project spend from a transient 429", async () => {
    const exhausted = new APICallError({
      message: "quota",
      url: "https://api.openai.com/v1/responses",
      requestBodyValues: {},
      statusCode: 429,
      responseBody: JSON.stringify({ error: { code: "insufficient_quota" } }),
    });
    const busy = new APICallError({
      message: "rate limited",
      url: "https://api.openai.com/v1/responses",
      requestBodyValues: {},
      statusCode: 429,
      responseHeaders: { "retry-after": "12" },
      responseBody: JSON.stringify({ error: { code: "rate_limit_exceeded" } }),
    });

    await expect(classifyMerchantDraftProviderError(exhausted)).resolves.toMatchObject({
      code: "AI_BUDGET_EXHAUSTED",
      status: 429,
    });
    await expect(classifyMerchantDraftProviderError(busy)).resolves.toMatchObject({
      code: "AI_RATE_LIMITED",
      status: 429,
      retryAfter: "12",
    });
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
