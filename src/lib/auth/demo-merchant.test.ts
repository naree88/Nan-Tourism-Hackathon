import { describe, expect, it } from "vitest";

import {
  DEMO_MERCHANT_EMAIL,
  DEMO_MERCHANT_USERNAME,
  getSafeMerchantNextPath,
  mapMerchantLoginToEmail,
} from "./demo-merchant";

describe("demo merchant login mapping", () => {
  it("maps the public username and internal email to the demo Auth email", () => {
    expect(mapMerchantLoginToEmail(DEMO_MERCHANT_USERNAME)).toBe(DEMO_MERCHANT_EMAIL);
    expect(mapMerchantLoginToEmail(`  ${DEMO_MERCHANT_EMAIL.toUpperCase()}  `)).toBe(DEMO_MERCHANT_EMAIL);
  });

  it("does not accept another username or email", () => {
    expect(mapMerchantLoginToEmail("another-merchant")).toBeNull();
    expect(mapMerchantLoginToEmail("owner@example.com")).toBeNull();
  });

  it("allows redirects only to the merchant dashboard", () => {
    expect(getSafeMerchantNextPath("/merchant")).toBe("/merchant");
    expect(getSafeMerchantNextPath("//evil.example")).toBe("/merchant");
    expect(getSafeMerchantNextPath("/api/merchant/draft")).toBe("/merchant");
    expect(getSafeMerchantNextPath(undefined)).toBe("/merchant");
  });
});
