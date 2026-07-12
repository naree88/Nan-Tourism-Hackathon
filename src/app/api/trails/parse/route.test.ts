import { describe, expect, it } from "vitest";

import { POST } from "./route";

function postJson(body: unknown) {
  return POST(new Request("http://localhost/api/trails/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("POST /api/trails/parse", () => {
  it("infers an existing plan when the text flow omits entryMode", async () => {
    const response = await postJson({
      text: "บ่ายนี้มีแผนจะไปวัดภูมินทร์ แล้วอยากหาร้านกาแฟนั่งทำงาน 90 นาที",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.parsed.entryMode).toBe("existing-plan");
    expect(payload.parsed.confirmationRequired).toBe(true);
  });

  it("keeps granted coordinates for the Current location flow", async () => {
    const response = await postJson({
      text: "เริ่มจากตำแหน่งปัจจุบัน มีเวลา 120 นาที เดิน",
      entryMode: "near-me",
      locationConsent: "granted",
      coordinates: { latitude: 18.775, longitude: 100.773 },
      locationAccuracyMeters: 24,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.parsed.entryMode).toBe("near-me");
    expect(payload.parsed.location).toEqual({
      consent: "granted",
      coordinates: { latitude: 18.775, longitude: 100.773 },
      accuracyMeters: 24,
    });
  });
});
