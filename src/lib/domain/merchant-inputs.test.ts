import { describe, expect, it } from "vitest";

import { buildMerchantDraft, extractMerchantUpdate } from "./merchant";

describe("merchant menu and local photo rules", () => {
  it("extracts an explicitly named Thai menu without turning its price into a bean offering", () => {
    const update = extractMerchantUpdate("เพิ่มเมนู กาแฟส้ม ราคา 120 บาท พร้อมเสิร์ฟ");

    expect(update.kinds).toContain("menu");
    expect(update.menuItems).toEqual([
      {
        nameTh: "กาแฟส้ม",
        priceThb: 120,
        isAvailable: true,
        isCafePick: false,
      },
    ]);
    expect(update.offering).toBeUndefined();
    expect(update.fieldEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "menuItems[0].nameTh",
        sourceText: expect.stringContaining("กาแฟส้ม"),
      }),
      expect.objectContaining({ field: "menuItems[0].priceThb", sourceText: "ราคา 120 บาท" }),
    ]));
    expect(update.unresolvedFields).not.toContain("menuItems[0].priceThb");
  });

  it("extracts an English menu name and marks a missing price for confirmation", () => {
    const update = extractMerchantUpdate("Add new menu Yuzu Coffee");

    expect(update.menuItems).toEqual([
      {
        nameTh: "yuzu coffee",
        nameEn: "yuzu coffee",
        isCafePick: false,
      },
    ]);
    expect(update.unresolvedFields).toContain("menuItems[0].priceThb");
  });

  it("keeps a photo as evidence in rules mode without claiming to read or infer its contents", () => {
    const sourceImages = [{
      name: "coffee-bag.jpg",
      mediaType: "image/jpeg" as const,
      sizeBytes: 1_024,
    }];
    const draft = buildMerchantDraft("", {
      cafeId: "cafe-mvp-01",
      ownerProfileId: "merchant-01",
      draftId: "draft-photo-rules",
      createdAt: "2026-07-13T10:00:00+07:00",
      inputMethod: "photo",
      sourceImages,
      generation: {
        provider: "rules",
        promptVersion: "merchant-rules-v1.0.0",
        imageAnalysis: "not-supported",
      },
    });

    expect(draft.inputMethod).toBe("photo");
    expect(draft.sourceImages).toEqual(sourceImages);
    expect(draft.sourceImages).not.toBe(sourceImages);
    expect(draft.generation).toEqual({
      provider: "rules",
      promptVersion: "merchant-rules-v1.0.0",
      imageAnalysis: "not-supported",
    });
    expect(draft.structuredUpdate.kinds).toEqual([]);
    expect(draft.structuredUpdate.offering).toBeUndefined();
    expect(draft.structuredUpdate.menuItems).toBeUndefined();
    expect(draft.structuredUpdate.workation).toBeUndefined();
    expect(draft.safetyNotices.some((notice) => notice.en.includes("do not read its contents"))).toBe(true);
    expect(draft.status).toBe("draft");
    expect(draft.requiresExplicitApproval).toBe(true);
  });
});
