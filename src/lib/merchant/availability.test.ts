import { describe, expect, it } from "vitest";

import type { OfferingAvailabilityStatus } from "@/lib/domain";
import {
  MERCHANT_AVAILABILITY_OPTIONS,
  merchantAvailabilityLabel,
} from "./availability";

describe("merchant availability labels", () => {
  it("provides one Thai option for every persisted availability status", () => {
    expect(MERCHANT_AVAILABILITY_OPTIONS).toEqual([
      { value: "available", label: "พร้อมจำหน่าย" },
      { value: "limited", label: "มีจำนวนจำกัด" },
      { value: "unavailable", label: "ไม่พร้อมจำหน่าย" },
      { value: "unknown", label: "ยังไม่ยืนยันสถานะ" },
    ] satisfies ReadonlyArray<{
      value: OfferingAvailabilityStatus;
      label: string;
    }>);
  });

  it("uses the unconfirmed label when availability is absent", () => {
    expect(merchantAvailabilityLabel(undefined)).toBe("ยังไม่ยืนยันสถานะ");
  });
});
