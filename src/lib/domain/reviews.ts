import type { CheckIn, Review, ReviewRatings } from "./types";

export type ReviewEligibilityCode =
  | "eligible"
  | "check-in-not-verified"
  | "traveler-mismatch"
  | "duplicate-review";

export interface ReviewEligibility {
  allowed: boolean;
  code: ReviewEligibilityCode;
  message: { th: string; en: string };
}

export function getReviewEligibility(
  checkIn: CheckIn,
  travelerProfileId: string,
  existingReviews: readonly Review[],
): ReviewEligibility {
  if (checkIn.travelerProfileId !== travelerProfileId) {
    return {
      allowed: false,
      code: "traveler-mismatch",
      message: { th: "เช็กอินนี้เป็นของผู้เดินทางคนอื่น", en: "This check-in belongs to another traveler." },
    };
  }
  if (checkIn.verificationState !== "verified") {
    return {
      allowed: false,
      code: "check-in-not-verified",
      message: { th: "ต้องยืนยันการเช็กอินก่อนเขียนรีวิว", en: "The check-in must be verified before a review can be created." },
    };
  }
  if (existingReviews.some((review) => review.checkInId === checkIn.id)) {
    return {
      allowed: false,
      code: "duplicate-review",
      message: { th: "หนึ่งการเยี่ยมชมที่ยืนยันแล้วเขียนรีวิวได้หนึ่งครั้ง", en: "Each verified visit can be reviewed only once." },
    };
  }
  return {
    allowed: true,
    code: "eligible",
    message: { th: "เช็กอินยืนยันแล้ว เขียนรีวิวได้", en: "Verified check-in; this visit is eligible for a review." },
  };
}

export interface ReviewRatingIssue {
  field: keyof ReviewRatings;
  message: string;
}

/** Runtime guard for request payloads before they are converted to `Rating`. */
export function validateReviewRatings(ratings: Record<string, unknown>): ReviewRatingIssue[] {
  const required: Array<keyof ReviewRatings> = ["coffeeQuality", "beanStory", "service", "value", "atmosphere"];
  const optional: Array<keyof ReviewRatings> = ["workSuitability"];
  const issues: ReviewRatingIssue[] = [];
  for (const field of [...required, ...optional]) {
    const value = ratings[field];
    if (value === undefined && optional.includes(field)) continue;
    if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
      issues.push({ field, message: `${field} must be an integer from 1 to 5.` });
    }
  }
  return issues;
}

