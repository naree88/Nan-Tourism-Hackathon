import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isNanProvince,
  toDatabaseAvailability,
  toDatabaseOutlets,
  toDatabaseProcess,
  toDatabaseRoastLevel,
  toDatabaseVideoCallSuitability,
  toDatabaseWorkSuitability,
} from "./supabase-apply";

describe("merchant domain to Supabase enum mapping", () => {
  it.each([
    ["natural", "natural"],
    ["washed", "washed"],
    ["honey", "honey"],
    ["anaerobic", "anaerobic"],
    ["carbonic-maceration", "carbonic_maceration"],
    ["other", "other"],
    ["unknown", "unknown"],
    [undefined, "unknown"],
  ] as const)("maps process %s to %s", (domainValue, databaseValue) => {
    expect(toDatabaseProcess(domainValue)).toBe(databaseValue);
  });

  it.each([
    ["light", "light"],
    ["medium-light", "medium_light"],
    ["medium", "medium"],
    ["medium-dark", "medium_dark"],
    ["dark", "dark"],
    ["unknown", "unspecified"],
    [undefined, "unspecified"],
  ] as const)("maps roast %s to %s", (domainValue, databaseValue) => {
    expect(toDatabaseRoastLevel(domainValue)).toBe(databaseValue);
  });

  it.each([
    ["available", "available"],
    ["limited", "limited"],
    ["unavailable", "unavailable"],
    ["unknown", "unknown"],
    [undefined, "unknown"],
  ] as const)("maps availability %s to %s", (domainValue, databaseValue) => {
    expect(toDatabaseAvailability(domainValue)).toBe(databaseValue);
  });

  it("maps Workation enums to their database equivalents", () => {
    expect(toDatabaseOutlets("at-most-seats")).toBe("most_seats");
    expect(toDatabaseOutlets("some")).toBe("limited");
    expect(toDatabaseOutlets("none")).toBe("none");
    expect(toDatabaseOutlets("unknown")).toBe("unknown");

    expect(toDatabaseWorkSuitability("good")).toBe("suitable");
    expect(toDatabaseWorkSuitability("possible")).toBe("limited");
    expect(toDatabaseWorkSuitability("not-suitable")).toBe("limited");
    expect(toDatabaseWorkSuitability("unknown")).toBe("not_assessed");

    expect(toDatabaseVideoCallSuitability("good")).toBe("suitable");
    expect(toDatabaseVideoCallSuitability("possible")).toBe("possible");
    expect(toDatabaseVideoCallSuitability("not-suitable")).toBe("not_recommended");
    expect(toDatabaseVideoCallSuitability("unknown")).toBe("not_assessed");
  });

  it.each(["Nan", "nan", "NAN", " น่าน ", "จังหวัดน่าน"])(
    "recognizes %s as Nan province",
    (province) => {
      expect(isNanProvince(province)).toBe(true);
    },
  );

  it.each(["Chiang Rai", "เชียงราย", "Nan Noi", "", undefined])(
    "does not classify %s as Nan province",
    (province) => {
      expect(isNanProvince(province)).toBe(false);
    },
  );
});
