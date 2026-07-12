import { describe, expect, it } from "vitest";

import {
  FINDER_TRAVEL_SPEED_KM_PER_HOUR,
  estimateTravelMinutes,
  formatTravelDurationThai,
} from "./travel-estimate";

describe("finder travel estimates", () => {
  it("uses the MVP speed for each traveler mode", () => {
    expect(FINDER_TRAVEL_SPEED_KM_PER_HOUR).toEqual({
      car: 80,
      bicycle: 15,
      walk: 5,
    });
    expect(estimateTravelMinutes(8, "car")).toBe(6);
    expect(estimateTravelMinutes(3.75, "bicycle")).toBe(15);
    expect(estimateTravelMinutes(2.5, "walk")).toBe(30);
  });

  it("rounds to a minimum of one minute", () => {
    expect(estimateTravelMinutes(0, "car")).toBe(1);
    expect(estimateTravelMinutes(0.1, "car")).toBe(1);
  });

  it("formats short and long Thai durations", () => {
    expect(formatTravelDurationThai(9)).toBe("9 นาที");
    expect(formatTravelDurationThai(60)).toBe("1 ชม.");
    expect(formatTravelDurationThai(185)).toBe("3 ชม. 5 นาที");
  });

  it("rejects invalid inputs", () => {
    expect(() => estimateTravelMinutes(-1, "walk")).toThrow(RangeError);
    expect(() => estimateTravelMinutes(Number.NaN, "car")).toThrow(RangeError);
    expect(() => formatTravelDurationThai(0)).toThrow(RangeError);
  });
});
