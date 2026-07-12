import { describe, expect, it } from "vitest";

import { parseTravelerRequest } from "./traveler-parser";

describe("parseTravelerRequest", () => {
  it("parses the Thai Wat Phumin trail request without skipping confirmation", () => {
    const result = parseTravelerRequest(
      "อยู่แถววัดภูมินทร์ มีเวลา ๒ ชั่วโมง ขับรถมา อยากได้กาแฟโทนผลไม้ คั่วอ่อน แล้วแวะที่ Unseen ใกล้ ๆ",
    );

    expect(result.detectedLanguage).toBe("mixed");
    expect(result.entryMode).toBe("ai-plan");
    expect(result.startPoint?.id).toBe("wat-phumin");
    expect(result.availableTimeMinutes).toBe(120);
    expect(result.transport).toBe("car");
    expect(result.tasteProfiles).toContain("fruity");
    expect(result.roastLevels).toEqual(["light"]);
    expect(result.wantsUnseen).toBe(true);
    expect(result.confirmationRequired).toBe(true);
    expect(result.notices.at(-1)?.code).toBe("confirmation-required");
  });

  it("parses an English existing-plan work request", () => {
    const result = parseTravelerRequest(
      "I'm going to Wat Phumin and want to work for 90 minutes with fruity medium-light filter coffee",
    );

    expect(result.detectedLanguage).toBe("en");
    expect(result.entryMode).toBe("existing-plan");
    expect(result.destinations.map((place) => place.id)).toContain("wat-phumin");
    expect(result.availableTimeMinutes).toBe(90);
    expect(result.useCases).toContain("work");
    expect(result.workDurationMinutes).toBe(90);
    expect(result.roastLevels).toEqual(["medium-light"]);
    expect(result.brewMethods).toContain("filter");
  });

  it("preserves explicit location denial and requests confirmation", () => {
    const result = parseTravelerRequest("หาร้านกาแฟใกล้ฉัน โทนช็อกโกแลต", {
      entryMode: "near-me",
      locationConsent: "denied",
    });

    expect(result.location).toEqual({ consent: "denied" });
    expect(result.tasteProfiles).toContain("chocolatey");
    expect(result.confirmationRequired).toBe(true);
  });

  it("extracts nutty from a submitted Thai taste note without inventing fruity", () => {
    const result = parseTravelerRequest("เย็นนี้จะไปวัดภูมินทร์ อยากได้กาแฟ Test Note ถั่ว");

    expect(result.tasteProfiles).toEqual(["nutty"]);
    expect(result.tasteProfiles).not.toContain("fruity");
  });
});
