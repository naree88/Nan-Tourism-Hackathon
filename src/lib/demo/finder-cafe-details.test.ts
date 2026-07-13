import { describe, expect, it } from "vitest";

import {
  demoFinderCafeDetails,
  finderCafeDetailById,
  getFinderCafeDetail,
} from "./finder-cafe-details";
import {
  demoFinderCafeRecords,
  demoFinderCafes,
  finderCafeSpecs,
} from "./finder-cafes";

const workWords = /ทำงาน|โน้ตบุ๊ก|ประชุม/;

describe("finder cafe detail fixtures", () => {
  it("provides one uniquely addressable detail record for every finder cafe", () => {
    expect(demoFinderCafeDetails).toHaveLength(13);
    expect(finderCafeDetailById.size).toBe(13);
    expect(new Set(demoFinderCafeDetails.map((detail) => detail.cafeId)).size).toBe(13);

    for (const cafe of demoFinderCafes) {
      const detail = getFinderCafeDetail(cafe.id);
      expect(detail?.cafeId).toBe(cafe.id);
      expect(finderCafeDetailById.get(cafe.id)).toBe(detail);
    }

    expect(getFinderCafeDetail("missing-cafe")).toBeUndefined();
  });

  it("has three complete recommended menus and two reviews per cafe", () => {
    const menuIds = new Set<string>();
    const reviewIds = new Set<string>();

    for (const detail of demoFinderCafeDetails) {
      expect(detail.recommendedMenus).toHaveLength(3);
      expect(detail.customerReviews).toHaveLength(2);

      for (const menu of detail.recommendedMenus) {
        expect(menuIds.has(menu.id)).toBe(false);
        menuIds.add(menu.id);
        expect(menu.name.th.trim()).not.toBe("");
        expect(menu.name.en.trim()).not.toBe("");
        expect(menu.description.th.trim()).not.toBe("");
        expect(menu.description.en.trim()).not.toBe("");
        expect(menu.price).toEqual({ amount: expect.any(Number), currency: "THB" });
        expect(menu.price.amount).toBeGreaterThan(0);
        expect(menu.sensoryTags.length).toBeGreaterThanOrEqual(2);
        expect(menu.sensoryTags.every((tag) => tag.th.trim() && tag.en.trim())).toBe(true);
        expect(typeof menu.usesFeaturedSingleOrigin).toBe("boolean");
      }

      expect(
        detail.recommendedMenus.some((menu) => menu.usesFeaturedSingleOrigin),
      ).toBe(true);
      expect(
        detail.recommendedMenus.some((menu) => !menu.usesFeaturedSingleOrigin),
      ).toBe(true);

      const validMenuIds = new Set(detail.recommendedMenus.map((menu) => menu.id));
      for (const review of detail.customerReviews) {
        expect(reviewIds.has(review.id)).toBe(false);
        reviewIds.add(review.id);
        expect(review.reviewerName.trim()).not.toBe("");
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
        expect(review.body.th.trim()).not.toBe("");
        expect(review.body.en.trim()).not.toBe("");
        expect(review.referencedMenuIds.length).toBeGreaterThan(0);
        expect(review.referencedMenuIds.every((menuId) => validMenuIds.has(menuId))).toBe(true);
      }
    }

    expect(menuIds.size).toBe(39);
    expect(reviewIds.size).toBe(26);
  });

  it("keeps each single origin coherent with its cafe filters and Nan bean badges", () => {
    for (const [index, cafe] of demoFinderCafes.entries()) {
      const detail = getFinderCafeDetail(cafe.id);
      const offering = cafe.offerings[0];
      const spec = finderCafeSpecs[index];

      expect(detail).toBeDefined();
      if (!detail) continue;

      expect(detail.singleOrigin.process).toBe(offering.process);
      expect(detail.singleOrigin.roastLevel).toBe(offering.roastLevel);
      expect(detail.singleOrigin.tasteProfiles).toEqual(offering.tasteProfiles);
      expect(detail.singleOrigin.name).toEqual(offering.name);
      expect(detail.singleOrigin.origin.province).toBe(offering.origin.province);
      expect(detail.singleOrigin.origin.locality).toBe(offering.origin.locality);
      expect(detail.singleOrigin.brewMethods).toContain("filter");
      expect(detail.singleOrigin.name.th.trim()).not.toBe("");
      expect(detail.singleOrigin.origin.country).toBe("Thailand");
      expect(detail.singleOrigin.origin.locality.trim()).not.toBe("");
      expect(detail.singleOrigin.processingLocation).toEqual({
        province: spec.processingProvince,
        locality: spec.processingLocality,
      });
      expect(detail.singleOrigin.producerOrCommunity.th.trim()).not.toBe("");
      expect(detail.singleOrigin.altitudeMeters.min).toBeGreaterThan(0);
      expect(detail.singleOrigin.altitudeMeters.max).toBeGreaterThan(
        detail.singleOrigin.altitudeMeters.min,
      );
      expect(detail.singleOrigin.varietal.trim()).not.toBe("");
      expect(detail.singleOrigin.tasteNotes.length).toBeGreaterThanOrEqual(3);

      const isNanGrown = cafe.badges.includes("nan-grown-beans");
      const isNanRoasted = cafe.badges.includes("nan-roasted");
      expect(detail.singleOrigin.origin.province === "น่าน").toBe(isNanGrown);
      expect(detail.singleOrigin.roasterLocation.province === "น่าน").toBe(isNanRoasted);
    }

    expect(
      demoFinderCafeDetails.some(
        (detail) => detail.singleOrigin.processingLocation.locality
          !== detail.singleOrigin.origin.locality,
      ),
    ).toBe(true);
  });

  it("anchors reviews to that cafe's menus, nearby place, and workation context", () => {
    for (const { cafe, unseenNearby } of demoFinderCafeRecords) {
      const detail = getFinderCafeDetail(cafe.id);
      expect(detail).toBeDefined();
      if (!detail) continue;

      const nearbyReview = detail.customerReviews.find((review) => review.mentionsUnseenNearby);
      expect(nearbyReview?.body.th).toContain(unseenNearby);

      for (const review of detail.customerReviews) {
        const referencedNames = review.referencedMenuIds.map(
          (menuId) => detail.recommendedMenus.find((menu) => menu.id === menuId)?.name.th,
        );
        expect(referencedNames.every(Boolean)).toBe(true);
        expect(referencedNames.some((name) => name && review.body.th.includes(name))).toBe(true);
      }

      const workReviews = detail.customerReviews.filter((review) => review.workContext);
      if (cafe.badges.includes("workation-friendly")) {
        expect(workReviews).toHaveLength(1);
        expect(workReviews[0].body.th).toMatch(workWords);
      } else {
        expect(workReviews).toHaveLength(0);
      }
    }
  });

  it("uses the referenced Nan coffee areas with corrected names and spelling", () => {
    const nanOrigins = demoFinderCafeDetails
      .map((detail) => detail.singleOrigin)
      .filter((origin) => origin.origin.province === "น่าน");

    expect(nanOrigins.map((origin) => origin.origin.locality)).toEqual([
      "บ้านห้วยโทน อำเภอบ่อเกลือ",
      "บ้านสันเจริญ อำเภอท่าวังผา",
      "อำเภอแม่จริม",
      "บ้านสะจุก–สะเกี้ยง ตำบลขุนน่าน อำเภอเฉลิมพระเกียรติ",
      "บ้านมณีพฤกษ์ อำเภอทุ่งช้าง",
      "อำเภอนาน้อย",
      "บ้านห้วยเลา อำเภอสองแคว",
    ]);
    expect(new Set(nanOrigins.map((origin) => origin.varietal))).toEqual(
      new Set(["Java", "Catimor", "Robusta", "Geisha"]),
    );

    const serialized = JSON.stringify(nanOrigins);
    expect(serialized).not.toContain("บ้านห้วยโท้น");
    expect(serialized).not.toContain("บ้านศพขุน");
    expect(serialized).not.toContain("บ้านห้วยเหล่า");
    expect(serialized).not.toContain("Cartimor");
  });

  it("does not reuse brand-identifying copy from the supplied packaging examples", () => {
    const serialized = JSON.stringify(demoFinderCafeDetails).toLowerCase();

    expect(serialized).not.toContain("single origin store");
    expect(serialized).not.toContain("ching java");
  });
});
