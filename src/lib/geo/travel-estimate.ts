import type { TransportMode } from "../domain/types";

export type FinderTravelMode = Extract<TransportMode, "car" | "bicycle" | "walk">;

export const FINDER_TRAVEL_SPEED_KM_PER_HOUR: Readonly<Record<FinderTravelMode, number>> =
  Object.freeze({
    car: 80,
    bicycle: 15,
    walk: 5,
  });

/** Deterministic MVP estimate based on straight-line distance and the selected mode. */
export function estimateTravelMinutes(
  distanceKm: number,
  mode: FinderTravelMode,
): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new RangeError("distanceKm must be a finite, non-negative number");
  }

  const minutes = (distanceKm / FINDER_TRAVEL_SPEED_KM_PER_HOUR[mode]) * 60;
  return Math.max(1, Math.round(minutes));
}

export function formatTravelDurationThai(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 1) {
    throw new RangeError("minutes must be a positive integer");
  }

  if (minutes < 60) return `${minutes.toLocaleString("th-TH")} นาที`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourLabel = `${hours.toLocaleString("th-TH")} ชม.`;

  return remainingMinutes === 0
    ? hourLabel
    : `${hourLabel} ${remainingMinutes.toLocaleString("th-TH")} นาที`;
}
