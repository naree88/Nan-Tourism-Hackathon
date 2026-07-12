import { describe, expect, it } from "vitest";

import { demoCafes, demoCafeUnseenLinks } from "../demo";
import { rankCafes } from "./ranking";
import { parseTravelerRequest } from "./traveler-parser";

describe("rankCafes", () => {
  const request = parseTravelerRequest(
    "อยู่แถววัดภูมินทร์ มีเวลา 2 ชั่วโมง ขับรถมา อยากได้กาแฟโทนผลไม้ คั่วอ่อน filter นั่งทำงาน แล้วแวะ Unseen",
  );

  it("ranks the matching fruity, light-roast fictional cafe first with evidence", () => {
    const results = rankCafes(request, demoCafes, { cafeUnseenLinks: demoCafeUnseenLinks });

    expect(results).toHaveLength(3);
    expect(results[0].cafe.id).toBe("cafe-demo-khuang-cloud");
    expect(results[0].matchedOfferingIds).toEqual(["offering-demo-huai-ton-natural"]);
    expect(results[0].score.total).toBeGreaterThan(results[1].score.total);
    expect(results[0].score.components).toHaveLength(7);
    expect(results[0].score.components.reduce((sum, part) => sum + part.maxScore, 0)).toBe(100);
    expect(results[0].whyThisFits.some((reason) => reason.en.includes("matches"))).toBe(true);
    expect(results[0].unseenNearbyIds).toContain("unseen-wat-hua-khuang");
    expect(results[0].cautions.some((notice) => notice.en.toLowerCase().includes("fictional"))).toBe(true);
  });

  it("is deterministic for identical structured input", () => {
    const first = rankCafes(request, demoCafes, { cafeUnseenLinks: demoCafeUnseenLinks });
    const second = rankCafes(request, demoCafes, { cafeUnseenLinks: demoCafeUnseenLinks });
    expect(second).toEqual(first);
  });

  it("honors the result limit without mutating the cafe array", () => {
    const idsBefore = demoCafes.map((cafe) => cafe.id);
    const results = rankCafes(request, demoCafes, { limit: 1 });
    expect(results).toHaveLength(1);
    expect(demoCafes.map((cafe) => cafe.id)).toEqual(idsBefore);
  });
});

