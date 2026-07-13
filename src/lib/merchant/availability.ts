import type { OfferingAvailabilityStatus } from "@/lib/domain";

export const MERCHANT_AVAILABILITY_OPTIONS = [
  { value: "available", label: "พร้อมจำหน่าย" },
  { value: "limited", label: "มีจำนวนจำกัด" },
  { value: "unavailable", label: "ไม่พร้อมจำหน่าย" },
  { value: "unknown", label: "ยังไม่ยืนยันสถานะ" },
] as const satisfies ReadonlyArray<{
  value: OfferingAvailabilityStatus;
  label: string;
}>;

export function merchantAvailabilityLabel(
  status: OfferingAvailabilityStatus | undefined,
): string {
  return MERCHANT_AVAILABILITY_OPTIONS.find(
    (option) => option.value === (status ?? "unknown"),
  )?.label ?? "ยังไม่ยืนยันสถานะ";
}
