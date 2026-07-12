import { describe, expect, it } from "vitest";

import {
  DEMO_MERCHANT_CAFE_ID,
  getDemoMerchantProfile,
} from "./merchant";

describe("new finder merchant profile bridge", () => {
  it("links the MVP merchant to the first cafe shown by the new finder", () => {
    const profile = getDemoMerchantProfile();

    expect(profile?.cafe).toMatchObject({
      id: DEMO_MERCHANT_CAFE_ID,
      slug: "finder-demo-01",
      nameTh: "ฟองคำ คอฟฟี่พอยต์",
    });
    expect(profile?.featuredOffering).toMatchObject({
      beanName: "ดอยหมอกล็อต 01",
      originProvince: "น่าน",
      originName: "บ่อเกลือ",
      varietal: "Java",
      process: "natural",
      roastLevel: "light",
    });
    expect(profile?.menuItems).toHaveLength(3);
    expect(profile?.menuItems[0]).toMatchObject({
      nameTh: "ออเรนจ์บลอสซัมโคลด์บรูว์",
      isCafePick: true,
      usesFeaturedSingleOrigin: true,
    });
    expect(profile?.workation).toMatchObject({
      downloadMbps: 86,
      uploadMbps: 42,
      pingMs: 18,
    });
  });

  it("does not allow a legacy or unrelated demo cafe through the one-shop MVP bridge", () => {
    expect(getDemoMerchantProfile("cafe-demo-khuang-cloud")).toBeNull();
    expect(getDemoMerchantProfile("cafe-finder-demo-02")).toBeNull();
  });
});
