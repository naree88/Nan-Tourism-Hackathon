import { describe, expect, it } from "vitest";

import { demoCafes } from "@/lib/demo";
import type { StructuredMerchantUpdate } from "@/lib/domain";
import {
  applyMerchantUpdateToProfile,
  mapCafeToMerchantProfile,
  type MerchantProfileSnapshot,
} from "./profile";

const currentProfile: MerchantProfileSnapshot = {
  cafe: {
    id: "cafe-mvp-01",
    slug: "nan-mvp-cafe",
    nameTh: "ร้านกาแฟน่าน MVP",
    storyTh: "ร้านกาแฟสำหรับทดสอบ",
    addressTh: "อำเภอเมืองน่าน",
  },
  featuredOffering: {
    id: "offering-01",
    beanName: "ดอยสวนยาหลวง",
    originProvince: "น่าน",
    originName: "สวนยาหลวง",
    process: "washed",
    roastLevel: "light",
    tastingNotes: [{ th: "ส้ม", en: "orange" }],
    tasteProfiles: ["fruity"],
    brewMethods: ["filter"],
    price: { amount: 120, currency: "THB" },
    availability: "available",
  },
  offerings: [{
    id: "offering-01",
    beanName: "ดอยสวนยาหลวง",
    originProvince: "น่าน",
    originName: "สวนยาหลวง",
    process: "washed",
    roastLevel: "light",
    tastingNotes: [{ th: "ส้ม", en: "orange" }],
    tasteProfiles: ["fruity"],
    brewMethods: ["filter"],
    price: { amount: 120, currency: "THB" },
    availability: "available",
  }],
  menuItems: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      nameTh: "Orange Coffee",
      nameEn: "Orange Coffee",
      descriptionTh: "กาแฟส้ม",
      priceThb: 110,
      isAvailable: true,
      isCafePick: true,
      usesFeaturedSingleOrigin: true,
    },
  ],
  workation: {
    wifi: "available",
    downloadMbps: 80,
    uploadMbps: 35,
    pingMs: 18,
    outlets: "some",
    workSeating: "good",
    videoCalls: "possible",
    policyText: "นั่งทำงานได้ 2 ชั่วโมง",
  },
  openingNote: "เปิดทุกวัน",
  updatedAt: "2026-07-13T09:00:00+07:00",
};

function removalProfile(): MerchantProfileSnapshot {
  const featured = {
    id: "offering-01",
    beanName: "ดอยสวนยาหลวง",
    originProvince: "น่าน",
    process: "washed" as const,
    roastLevel: "light" as const,
    tastingNotes: [{ th: "ส้ม", en: "orange" }],
    tasteProfiles: ["fruity" as const],
    brewMethods: ["filter" as const],
    availability: "available" as const,
    updatedAt: "2026-07-13T03:00:00.000Z",
  };
  const fallback = {
    id: "offering-02",
    beanName: "ดอยหมอกล็อต 02",
    originProvince: "น่าน",
    process: "natural" as const,
    roastLevel: "light" as const,
    tastingNotes: [{ th: "สตรอว์เบอร์รี", en: "strawberry" }],
    tasteProfiles: ["fruity" as const],
    brewMethods: ["filter" as const],
    availability: "available" as const,
    updatedAt: "2026-07-12T03:00:00.000Z",
  };

  return {
    ...structuredClone(currentProfile),
    featuredOffering: structuredClone(featured),
    offerings: [structuredClone(featured), structuredClone(fallback)],
    menuItems: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        nameTh: "Orange Coffee",
        isAvailable: true,
        isCafePick: true,
        featuredOfferingId: "offering-01",
        usesFeaturedSingleOrigin: true,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        nameTh: "Strawberry Filter",
        isAvailable: true,
        isCafePick: false,
        featuredOfferingId: "offering-02",
        usesFeaturedSingleOrigin: false,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        nameTh: "Espresso Tonic",
        isAvailable: true,
        isCafePick: false,
        usesFeaturedSingleOrigin: false,
      },
    ],
  };
}

function removeOffering(
  removal: NonNullable<StructuredMerchantUpdate["offeringRemovals"]>[number],
): StructuredMerchantUpdate {
  return {
    kinds: ["offering"],
    offeringRemovals: [removal],
    fieldEvidence: [],
    unresolvedFields: [],
    extractorVersion: "test-removal-v1",
  };
}

describe("merchant profile mapping and preview merge", () => {
  it("maps the public demo cafe into the shared merchant profile shape", () => {
    const cafe = demoCafes[0];
    const profile = mapCafeToMerchantProfile(cafe);

    expect(profile.cafe).toMatchObject({
      id: cafe.id,
      slug: cafe.slug,
      nameTh: cafe.name.th,
    });
    expect(profile.featuredOffering?.id).toBe(
      cafe.offerings.find((offering) => offering.approvedForPublic)?.id,
    );
    expect(profile.offerings).toHaveLength(
      cafe.offerings.filter((offering) => offering.approvedForPublic).length,
    );
    expect(profile.menuItems).toHaveLength(
      cafe.menu.filter((menu) => menu.approvedForPublic).length,
    );
    expect(profile.workation).toMatchObject({
      wifi: cafe.workation?.wifi.availability,
      downloadMbps: cafe.workation?.speedReports[0]?.downloadMbps,
      uploadMbps: cafe.workation?.speedReports[0]?.uploadMbps,
      pingMs: cafe.workation?.speedReports[0]?.pingMs,
    });
  });

  it("appends a newly named Single Origin bean without replacing the current bean", () => {
    const before = structuredClone(currentProfile);
    const proposed = applyMerchantUpdateToProfile(currentProfile, {
      kinds: ["offering"],
      offering: {
        beanName: "ดอยหมอกล็อต 02",
        producer: "กลุ่มเกษตรกรบ้านมณีพฤกษ์",
        process: "natural",
        roastLevel: "light",
        tastingNotes: [{ th: "สตรอว์เบอร์รี", en: "strawberry" }],
        tasteProfiles: ["fruity"],
        brewMethods: ["filter"],
        availability: "available",
      },
      fieldEvidence: [],
      unresolvedFields: [],
      extractorVersion: "test-v1",
    });

    expect(currentProfile).toEqual(before);
    expect(proposed.offerings).toHaveLength(2);
    expect(proposed.offerings?.[0]).toEqual(currentProfile.offerings?.[0]);
    expect(proposed.offerings?.[1]).toMatchObject({
      beanName: "ดอยหมอกล็อต 02",
      producer: "กลุ่มเกษตรกรบ้านมณีพฤกษ์",
      process: "natural",
      brewMethods: ["filter"],
    });
    expect(proposed.offerings?.[1].id).toBeUndefined();
    expect(proposed.featuredOffering?.beanName).toBe("ดอยหมอกล็อต 02");
  });

  it("updates an exact normalized bean name without adding a duplicate", () => {
    const proposed = applyMerchantUpdateToProfile(currentProfile, {
      kinds: ["offering"],
      offering: {
        beanName: "  ดอยสวนยาหลวง  ",
        process: "honey",
        tastingNotes: [],
        tasteProfiles: [],
        brewMethods: [],
      },
      fieldEvidence: [],
      unresolvedFields: [],
      extractorVersion: "test-v1",
    });

    expect(proposed.offerings).toHaveLength(1);
    expect(proposed.offerings?.[0]).toMatchObject({ id: "offering-01", process: "honey" });
    expect(proposed.featuredOffering?.id).toBe("offering-01");
  });

  it("keeps every bean across sequential approvals in the local demo", () => {
    const addBean = (beanName: string): StructuredMerchantUpdate => ({
      kinds: ["offering"],
      offering: {
        beanName,
        originProvince: "น่าน",
        process: "natural",
        tastingNotes: [],
        tasteProfiles: [],
        brewMethods: ["filter"],
      },
      fieldEvidence: [],
      unresolvedFields: [],
      extractorVersion: "test-v1",
    });

    const afterSecondBean = applyMerchantUpdateToProfile(currentProfile, addBean("ดอยหมอกล็อต 02"));
    const afterThirdBean = applyMerchantUpdateToProfile(afterSecondBean, addBean("มณีพฤกษ์ล็อต 09"));

    expect(afterThirdBean.offerings?.map((item) => item.beanName)).toEqual([
      "ดอยสวนยาหลวง",
      "ดอยหมอกล็อต 02",
      "มณีพฤกษ์ล็อต 09",
    ]);
    expect(afterThirdBean.featuredOffering?.beanName).toBe("มณีพฤกษ์ล็อต 09");
  });

  it("removes a nonfeatured sold-out bean without changing the featured bean or unrelated menu references", () => {
    const current = removalProfile();
    const before = structuredClone(current);
    const proposed = applyMerchantUpdateToProfile(current, removeOffering({
      offeringId: "offering-02",
      beanName: "ดอยหมอกล็อต 02",
      reason: "sold-out",
      expectedUpdatedAt: "2026-07-12T03:00:00.000Z",
    }));

    expect(current).toEqual(before);
    expect(proposed.offerings?.map((offering) => offering.id)).toEqual(["offering-01"]);
    expect(proposed.featuredOffering?.id).toBe("offering-01");
    expect(proposed.menuItems[0]).toMatchObject({
      featuredOfferingId: "offering-01",
      usesFeaturedSingleOrigin: true,
    });
    expect(proposed.menuItems[1].featuredOfferingId).toBeUndefined();
    expect(proposed.menuItems[1].usesFeaturedSingleOrigin).toBe(false);
    expect(proposed.menuItems[2]).toEqual(current.menuItems[2]);
  });

  it("falls back to the first remaining bean and clears only menu references to the removed featured bean", () => {
    const current = removalProfile();
    const before = structuredClone(current);
    const proposed = applyMerchantUpdateToProfile(current, removeOffering({
      offeringId: "offering-01",
      beanName: "ดอยสวนยาหลวง",
      reason: "sold-out",
      expectedUpdatedAt: "2026-07-13T03:00:00.000Z",
    }));

    expect(current).toEqual(before);
    expect(proposed.offerings?.map((offering) => offering.id)).toEqual(["offering-02"]);
    expect(proposed.featuredOffering?.id).toBe("offering-02");
    expect(proposed.menuItems[0].featuredOfferingId).toBeUndefined();
    expect(proposed.menuItems[0].usesFeaturedSingleOrigin).toBe(false);
    expect(proposed.menuItems[1]).toEqual(current.menuItems[1]);
    expect(proposed.menuItems[2]).toEqual(current.menuItems[2]);
  });

  it("allows the last sold-out bean to be removed and leaves a deliberate empty Single Origin state", () => {
    const current = removalProfile();
    current.offerings = [structuredClone(current.offerings![0])];
    current.menuItems = [current.menuItems[0], current.menuItems[2]];
    const before = structuredClone(current);
    const proposed = applyMerchantUpdateToProfile(current, removeOffering({
      offeringId: "offering-01",
      beanName: "ดอยสวนยาหลวง",
      reason: "sold-out",
      expectedUpdatedAt: "2026-07-13T03:00:00.000Z",
    }));

    expect(current).toEqual(before);
    expect(proposed.offerings).toEqual([]);
    expect(proposed.featuredOffering).toBeUndefined();
    expect(proposed.menuItems[0].featuredOfferingId).toBeUndefined();
    expect(proposed.menuItems[0].usesFeaturedSingleOrigin).toBe(false);
    expect(proposed.menuItems[1]).toEqual(current.menuItems[1]);
  });

  it("rejects an unknown removal target without partially mutating the current profile", () => {
    const current = removalProfile();
    const before = structuredClone(current);

    expect(() => applyMerchantUpdateToProfile(current, removeOffering({
      offeringId: "offering-missing",
      beanName: "เมล็ดที่ไม่มีในร้าน",
      reason: "sold-out",
    }))).toThrow();
    expect(current).toEqual(before);
  });

  it("resolves a name-only removal by its normalized bean name", () => {
    const current = removalProfile();
    const byName = applyMerchantUpdateToProfile(current, removeOffering({
      beanName: "  ดอยหมอกล็อต 02  ",
      reason: "sold-out",
    }));

    expect(byName.offerings?.map((offering) => offering.id)).toEqual(["offering-01"]);
  });

  it("merges menu and Workation patches while leaving the current profile deeply immutable", () => {
    const before = structuredClone(currentProfile);
    const update: StructuredMerchantUpdate = {
      kinds: ["menu", "workation"],
      menuItems: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          nameTh: "Orange Coffee",
          priceThb: 125,
          isAvailable: false,
        },
        {
          nameTh: "Yuzu Coffee",
          nameEn: "Yuzu Coffee",
          priceThb: 135,
          usesFeaturedSingleOrigin: true,
        },
      ],
      workation: {
        downloadMbps: 120,
        pingMs: 12,
      },
      fieldEvidence: [],
      unresolvedFields: [],
      extractorVersion: "test-v1",
    };

    const proposed = applyMerchantUpdateToProfile(currentProfile, update);

    expect(currentProfile).toEqual(before);
    expect(proposed).not.toBe(currentProfile);
    expect(proposed.cafe).not.toBe(currentProfile.cafe);
    expect(proposed.featuredOffering).not.toBe(currentProfile.featuredOffering);
    expect(proposed.featuredOffering?.tastingNotes).not.toBe(currentProfile.featuredOffering?.tastingNotes);
    expect(proposed.menuItems[0]).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      nameTh: "Orange Coffee",
      nameEn: "Orange Coffee",
      descriptionTh: "กาแฟส้ม",
      priceThb: 125,
      isAvailable: false,
      isCafePick: true,
      usesFeaturedSingleOrigin: true,
    });
    expect(proposed.menuItems[1]).toEqual({
      nameTh: "Yuzu Coffee",
      nameEn: "Yuzu Coffee",
      priceThb: 135,
      isAvailable: true,
      isCafePick: false,
      usesFeaturedSingleOrigin: true,
    });
    expect(proposed.workation).toEqual({
      wifi: "available",
      downloadMbps: 120,
      uploadMbps: 35,
      pingMs: 12,
      outlets: "some",
      workSeating: "good",
      videoCalls: "possible",
      policyText: "นั่งทำงานได้ 2 ชั่วโมง",
    });
    expect(proposed.updatedAt).toBe(currentProfile.updatedAt);

    proposed.featuredOffering!.tastingNotes[0].th = "เปลี่ยนเฉพาะ preview";
    expect(currentProfile.featuredOffering?.tastingNotes[0].th).toBe("ส้ม");
  });
});
