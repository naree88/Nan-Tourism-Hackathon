import { describe, expect, it } from "vitest";

import {
  UNSEEN_SOURCES_CHECKED_AT,
  demoCafeUnseenLinks,
  demoCafes,
  demoCheckIns,
  demoReviews,
  demoUnseenPlaces,
} from "../demo";
import { getReviewEligibility, validateReviewRatings } from "./reviews";

describe("demo data trust boundaries", () => {
  it("contains exactly three visibly fictional cafes and no verified cafe claims", () => {
    expect(demoCafes).toHaveLength(3);
    expect(new Set(demoCafes.map((cafe) => cafe.id)).size).toBe(3);
    for (const cafe of demoCafes) {
      expect(cafe.provenance.kind).toBe("fictional-demo");
      expect(cafe.provenance.isFictional).toBe(true);
      expect(cafe.name.en).toMatch(/fictional demo/i);
      expect(cafe.offerings.every((offering) => offering.provenance.isFictional)).toBe(true);
    }
  });

  it("contains the three source-checked real Unseen places with no-live-status notices", () => {
    expect(demoUnseenPlaces.map((place) => place.name.en)).toEqual([
      "Wat Hua Khuang",
      "Wat Si Phan Ton",
      "Hong Chao Fong Kham",
    ]);
    for (const place of demoUnseenPlaces) {
      expect(place.provenance.isFictional).toBe(false);
      expect(place.provenance.verifiedAt).toBe(UNSEEN_SOURCES_CHECKED_AT);
      expect(place.provenance.sourceUrl).toMatch(/^https:\/\//);
      expect(place.provenance.additionalSources?.[0]?.url).toMatch(/^https:\/\//);
      expect(place.openingOrAccessContext.en.toLowerCase()).toMatch(/no live|recheck/);
    }
  });

  it("labels cafe-to-real-place travel times as fictional demo estimates", () => {
    expect(demoCafeUnseenLinks.length).toBeGreaterThanOrEqual(3);
    expect(demoCafeUnseenLinks.every((link) => link.provenance.kind === "fictional-demo")).toBe(true);
  });
});

describe("verified-visit review rules", () => {
  it("permits one review only after a verified visit", () => {
    const checkIn = demoCheckIns[0];
    expect(getReviewEligibility(checkIn, checkIn.travelerProfileId, [])).toMatchObject({ allowed: true, code: "eligible" });
    expect(getReviewEligibility(checkIn, checkIn.travelerProfileId, demoReviews)).toMatchObject({
      allowed: false,
      code: "duplicate-review",
    });
  });

  it("runtime-validates rating bounds", () => {
    expect(
      validateReviewRatings({ coffeeQuality: 5, beanStory: 4, service: 3, value: 2, atmosphere: 1 }),
    ).toEqual([]);
    expect(
      validateReviewRatings({ coffeeQuality: 6, beanStory: 4, service: 3, value: 2, atmosphere: 0 }),
    ).toHaveLength(2);
  });
});

