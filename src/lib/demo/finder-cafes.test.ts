import { describe, expect, it } from "vitest";

import {
  demoFinderCafeRecords,
  demoFinderCafes,
  finderCafeSpecs,
  unseenNearbyForFinderCafe,
} from "./finder-cafes";

const EXPECTED_LOCATIONS = [
  [18.790155412923813, 100.78530678254457, "โฮงเจ้าฟองคำ"],
  [18.79321656620621, 100.78141541790892, "วัดช้างเผือก"],
  [18.796312428611024, 100.7842287692962, "ร้านเสน่ห์เหนือ"],
  [18.794263958483132, 100.77499309995126, "สุสานคริสตจักร"],
  [18.782096957270138, 100.77279582589249, "ตลาดโต้รุ่ง"],
  [18.780267101327578, 100.76861588910326, "กำแพงเมืองเก่าน่าน"],
  [18.778629620565898, 100.7688185691823, "ห้องสมุดบ้านๆน่านๆ"],
  [18.775344051942913, 100.77087197906204, "กาดข่วงเมืองน่าน"],
  [18.77488333660043, 100.77185348360817, "ถนนคนเดินกลางคืนน่าน"],
  [18.773562466688162, 100.77837147495387, "แม่น้ำน่าน"],
  [18.767297776622552, 100.78147590831547, "หนองน้ำครก"],
  [18.76011879701974, 100.78899266651072, "สวนรุกขชาติแช่แห้ง"],
  [18.760058066423383, 100.79222139882796, "ภูเพียงโมเดล-รักษ์ป่าน่าน"],
] as const;

describe("finder cafe fixtures", () => {
  it("contains exactly 13 unique cafes", () => {
    expect(demoFinderCafeRecords).toHaveLength(13);
    expect(demoFinderCafes).toHaveLength(13);

    expect(new Set(demoFinderCafes.map((cafe) => cafe.id)).size).toBe(13);
    expect(new Set(demoFinderCafes.map((cafe) => cafe.slug)).size).toBe(13);
    expect(
      new Set(
        demoFinderCafes.map(
          (cafe) => `${cafe.coordinates.latitude},${cafe.coordinates.longitude}`,
        ),
      ).size,
    ).toBe(13);
  });

  it("preserves every supplied coordinate and its paired Unseen place", () => {
    expect(
      demoFinderCafeRecords.map(({ cafe, unseenNearby }) => [
        cafe.coordinates.latitude,
        cafe.coordinates.longitude,
        unseenNearby,
      ]),
    ).toEqual(EXPECTED_LOCATIONS);

    for (const record of demoFinderCafeRecords) {
      expect(unseenNearbyForFinderCafe(record.cafe.id)).toBe(record.unseenNearby);
    }
  });

  it("represents every processing, taste, and roast filter option", () => {
    const offerings = demoFinderCafes.flatMap((cafe) => cafe.offerings);

    expect(new Set(offerings.map((offering) => offering.process))).toEqual(
      new Set([
        "natural",
        "washed",
        "honey",
        "anaerobic",
        "carbonic-maceration",
      ]),
    );
    expect(
      new Set(offerings.flatMap((offering) => offering.tasteProfiles)),
    ).toEqual(new Set(["nutty", "floral", "fruity"]));
    expect(new Set(offerings.map((offering) => offering.roastLevel))).toEqual(
      new Set(["light", "medium", "dark"]),
    );
  });

  it("includes both workation and non-workation cafes", () => {
    expect(new Set(demoFinderCafes.map((cafe) => Boolean(cafe.workation)))).toEqual(
      new Set([true, false]),
    );
    for (const cafe of demoFinderCafes) {
      expect(Boolean(cafe.workation)).toBe(cafe.badges.includes("workation-friendly"));
    }
  });

  it("covers grown-only, roasted-only, both, and neither Nan bean badges", () => {
    const profiles = demoFinderCafes.map((cafe) => {
      const grown = cafe.badges.includes("nan-grown-beans");
      const roasted = cafe.badges.includes("nan-roasted");

      if (grown && roasted) return "both";
      if (grown) return "grown-only";
      if (roasted) return "roasted-only";
      return "neither";
    });

    expect(new Set(profiles)).toEqual(
      new Set(["grown-only", "roasted-only", "both", "neither"]),
    );
    expect(profiles).toHaveLength(13);
  });

  it("keeps the bean origin consistent with the Nan-grown badge", () => {
    for (const [index, cafe] of demoFinderCafes.entries()) {
      const isNanGrown = cafe.badges.includes("nan-grown-beans");
      const offering = cafe.offerings[0];
      const spec = finderCafeSpecs[index];

      expect(offering.origin.province === "น่าน").toBe(isNanGrown);
      expect(offering.name).toEqual(spec.beanName);
      expect(offering.origin.locality).toBe(spec.originLocality);
      expect(offering.origin.producer).toBe(spec.producerOrCommunity.th);
      expect(offering.brewMethods).toEqual(spec.brewMethods);
      expect(offering.tastingNotes).toEqual(spec.tastingNotes);
    }
  });

  it("gives every Workation cafe its own complete internet metrics", () => {
    const workationCafes = demoFinderCafes.filter((cafe) => cafe.workation);
    const metricProfiles = workationCafes.map((cafe) => {
      const speed = cafe.workation?.speedReports[0];
      expect(speed?.downloadMbps).toBeGreaterThan(0);
      expect(speed?.uploadMbps).toBeGreaterThan(0);
      expect(speed?.pingMs).toBeGreaterThan(0);
      return `${speed?.downloadMbps}/${speed?.uploadMbps}/${speed?.pingMs}`;
    });

    expect(new Set(metricProfiles).size).toBe(workationCafes.length);
    expect(demoFinderCafes.filter((cafe) => !cafe.workation).every((cafe) => cafe.workation === undefined)).toBe(true);
  });
});
