import { describe, expect, it } from "vitest";

import {
  merchantDraftGenerationSchema,
  merchantDraftRequestSchema,
  structuredMerchantUpdateSchema,
} from "./contracts";

const validPhotoRequest = {
  cafeId: "cafe-mvp-01",
  rawInput: "",
  inputMethod: "photo" as const,
  image: {
    name: "coffee-bag.jpg",
    mediaType: "image/jpeg" as const,
    sizeBytes: 8,
    dataUrl: "data:image/jpeg;base64,/9j/2Q==",
  },
};

describe("merchant photo request contract", () => {
  it("accepts one supported photo without requiring fallback text", () => {
    expect(merchantDraftRequestSchema.parse(validPhotoRequest)).toEqual(validPhotoRequest);
  });

  it.each([
    {
      label: "unsupported MIME type",
      request: {
        ...validPhotoRequest,
        image: { ...validPhotoRequest.image, mediaType: "image/gif", dataUrl: "data:image/gif;base64,R0lGODlh" },
      },
    },
    {
      label: "oversized image metadata",
      request: {
        ...validPhotoRequest,
        image: { ...validPhotoRequest.image, sizeBytes: 2 * 1024 * 1024 + 1 },
      },
    },
    {
      label: "malformed data URL",
      request: {
        ...validPhotoRequest,
        image: { ...validPhotoRequest.image, dataUrl: "https://example.com/coffee-bag.jpg" },
      },
    },
    {
      label: "unknown request field",
      request: { ...validPhotoRequest, publishImmediately: true },
    },
  ])("rejects $label", ({ request }) => {
    expect(merchantDraftRequestSchema.safeParse(request).success).toBe(false);
  });

  it("requires the declared media type to match the image data URL", () => {
    const mismatch = {
      ...validPhotoRequest,
      image: {
        ...validPhotoRequest.image,
        dataUrl: "data:image/png;base64,iVBORw0KGgo=",
      },
    };

    expect(merchantDraftRequestSchema.safeParse(mismatch).success).toBe(false);
  });

  it("requires photo and multimodal methods to match the supplied inputs", () => {
    expect(merchantDraftRequestSchema.safeParse({
      ...validPhotoRequest,
      inputMethod: "text",
    }).success).toBe(false);
    expect(merchantDraftRequestSchema.safeParse({
      ...validPhotoRequest,
      rawInput: "เมนูใหม่ในวันนี้",
      inputMethod: "photo",
    }).success).toBe(false);
    expect(merchantDraftRequestSchema.safeParse({
      ...validPhotoRequest,
      rawInput: "เมนูใหม่ในวันนี้",
      inputMethod: "multimodal",
    }).success).toBe(true);
    expect(merchantDraftRequestSchema.safeParse({
      cafeId: "cafe-mvp-01",
      rawInput: "เมนูใหม่ในวันนี้",
      inputMethod: "photo",
    }).success).toBe(false);
  });

  it("rejects a short empty request when no photo is supplied", () => {
    expect(merchantDraftRequestSchema.safeParse({
      cafeId: "cafe-mvp-01",
      rawInput: "สั้น",
      inputMethod: "text",
    }).success).toBe(false);
  });
});

describe("merchant generation provenance contract", () => {
  it("accepts direct OpenAI provenance without exposing a provider-prefixed Gateway model", () => {
    const generation = {
      provider: "openai-direct",
      model: "gpt-5.6-luna",
      promptVersion: "merchant-profile-patch-v1.0.0",
      imageAnalysis: "processed",
    } as const;

    expect(merchantDraftGenerationSchema.parse(generation)).toEqual(generation);
  });

  it("keeps legacy AI Gateway provenance readable without making it a runtime mode", () => {
    const legacyGeneration = {
      provider: "ai-gateway",
      model: "openai/gpt-5.6-luna",
      promptVersion: "merchant-profile-patch-v1.0.0",
      imageAnalysis: "processed",
    } as const;

    expect(merchantDraftGenerationSchema.parse(legacyGeneration)).toEqual(legacyGeneration);
  });
});

describe("sold-out Single Origin removal contract", () => {
  const baseUpdate = {
    kinds: ["offering"],
    fieldEvidence: [{
      field: "offeringRemovals[0]",
      sourceText: "เมล็ดดอยสวนยาหลวงหมดแล้ว เอาออกจากหน้าร้าน",
      confidence: "high",
    }],
    unresolvedFields: [],
    extractorVersion: "merchant-rules-v2",
  } as const;

  it("accepts a sold-out removal with an ID and optimistic timestamp", () => {
    const update = {
      ...baseUpdate,
      offeringRemovals: [{
        offeringId: "offering-01",
        beanName: "ดอยสวนยาหลวง",
        reason: "sold-out",
        expectedUpdatedAt: "2026-07-13T03:00:00.000Z",
      }],
    };

    expect(structuredMerchantUpdateSchema.parse(update)).toEqual(update);
  });

  it("accepts a name-only target so a provider can resolve a demo bean before approval", () => {
    const update = {
      ...baseUpdate,
      offeringRemovals: [{
        beanName: "ดอยสวนยาหลวง",
        reason: "sold-out",
      }],
    };

    expect(structuredMerchantUpdateSchema.parse(update)).toEqual(update);
  });

  it.each([
    {
      label: "an unsupported removal reason",
      offeringRemovals: [{ beanName: "ดอยสวนยาหลวง", reason: "season-ended" }],
    },
    {
      label: "a blank bean name",
      offeringRemovals: [{ beanName: "   ", reason: "sold-out" }],
    },
    {
      label: "a malformed optimistic timestamp",
      offeringRemovals: [{
        beanName: "ดอยสวนยาหลวง",
        reason: "sold-out",
        expectedUpdatedAt: "yesterday",
      }],
    },
    {
      label: "unknown fields on a removal",
      offeringRemovals: [{
        beanName: "ดอยสวนยาหลวง",
        reason: "sold-out",
        publishImmediately: true,
      }],
    },
  ])("rejects $label", ({ offeringRemovals }) => {
    expect(structuredMerchantUpdateSchema.safeParse({
      ...baseUpdate,
      offeringRemovals,
    }).success).toBe(false);
  });

  it.each([
    { label: "an opening note", extra: { openingNote: "เปิดถึง 18:00" } },
    { label: "a Workation edit", extra: { workation: { wifi: "available" } } },
    { label: "another update kind", extra: { kinds: ["offering", "workation"] } },
  ])("rejects a removal mixed with $label", ({ extra }) => {
    expect(structuredMerchantUpdateSchema.safeParse({
      ...baseUpdate,
      ...extra,
      offeringRemovals: [{ beanName: "ดอยสวนยาหลวง", reason: "sold-out" }],
    }).success).toBe(false);
  });
});
