import type { OfferingAvailabilityStatus } from "../domain/types";

/**
 * Keeps fixture markers in the source data while removing repeated qualifiers
 * from UI copy. Demo mode remains visible globally in the application header.
 */
export function cleanDemoCopy(value: string): string {
  return value
    .replace(/\s*\((?:ร้าน|นโยบาย)?สมมติ\)/g, "")
    .replace(/\s*\(scenario label only\)/gi, "")
    .replace(/\s*ล็อตเดโม\b/g, " ล็อต")
    .replace(/สถานการณ์เดโม/g, "")
    .replace(/ร้านสมมติ/g, "ร้าน")
    .replace(/ข้อมูลสมมติ/g, "ข้อมูล")
    .replace(/สมมติ/g, "")
    .replace(/เดโม/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

export function availabilityLabel(status: OfferingAvailabilityStatus): string {
  const labels: Record<OfferingAvailabilityStatus, string> = {
    available: "พร้อมเสิร์ฟ",
    limited: "เหลือจำนวนจำกัด",
    unavailable: "ยังไม่พร้อมเสิร์ฟ",
    unknown: "รอยืนยันสถานะ",
  };

  return labels[status];
}
