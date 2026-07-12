import type {
  Cafe,
  CafeBadge,
  CoffeeProcess,
  GeoPoint,
  RoastLevel,
  TasteProfile,
} from "../domain/types";

const EARTH_RADIUS_KM = 6_371.0088;

export const DEFAULT_CAFE_RADIUS_KM = 15;
export const DEFAULT_ROUTE_CORRIDOR_KM = 5;

export type CoffeeProcessCriterion =
  | Extract<CoffeeProcess, "natural" | "washed" | "honey" | "anaerobic">
  | "carbonic-maceration";

export type CoffeeTasteCriterion = Extract<TasteProfile, "nutty" | "floral" | "fruity">;
export type CoffeeRoastCriterion = Extract<RoastLevel, "light" | "medium" | "dark">;
export type NanCoffeeCriterion = Extract<CafeBadge, "nan-grown-beans" | "nan-roasted">;

/** An ordered search point. Consecutive points form route-corridor segments. */
export interface CoffeeFilterLocation extends GeoPoint {
  id?: string;
  label?: string;
}

export interface CoffeeFilterCriteria {
  locations?: readonly CoffeeFilterLocation[];
  processes?: readonly CoffeeProcessCriterion[];
  tastes?: readonly CoffeeTasteCriterion[];
  roasts?: readonly CoffeeRoastCriterion[];
  nanCoffee?: readonly NanCoffeeCriterion[];
  /** `true` requires workation data; `false`/omitted leaves this category unfiltered. */
  workation?: boolean;
}

interface SegmentProjection {
  distanceKm: number;
  projection: number;
  isDegenerate: boolean;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function wrappedLongitudeDeltaRadians(fromLongitude: number, toLongitude: number): number {
  const delta = toRadians(toLongitude - fromLongitude);
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

/** Great-circle distance between two WGS84-style latitude/longitude points. */
export function haversineDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = wrappedLongitudeDeltaRadians(from.longitude, to.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

/**
 * Projects a point onto a segment in a local tangent plane. This is sufficiently
 * accurate for the short, province-scale routes used by the app.
 */
function projectOntoSegment(point: GeoPoint, start: GeoPoint, end: GeoPoint): SegmentProjection {
  const referenceLatitude = toRadians((start.latitude + end.latitude) / 2);
  const segmentX =
    EARTH_RADIUS_KM * wrappedLongitudeDeltaRadians(start.longitude, end.longitude) * Math.cos(referenceLatitude);
  const segmentY = EARTH_RADIUS_KM * toRadians(end.latitude - start.latitude);
  const pointX =
    EARTH_RADIUS_KM * wrappedLongitudeDeltaRadians(start.longitude, point.longitude) * Math.cos(referenceLatitude);
  const pointY = EARTH_RADIUS_KM * toRadians(point.latitude - start.latitude);
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared <= Number.EPSILON) {
    return {
      distanceKm: haversineDistanceKm(point, start),
      projection: 0,
      isDegenerate: true,
    };
  }

  const projection = (pointX * segmentX + pointY * segmentY) / segmentLengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestX = clampedProjection * segmentX;
  const closestY = clampedProjection * segmentY;

  return {
    distanceKm: Math.hypot(pointX - closestX, pointY - closestY),
    projection,
    isDegenerate: false,
  };
}

/** Shortest local-plane distance to a finite line segment, including its endpoints. */
export function distanceToSegmentKm(point: GeoPoint, start: GeoPoint, end: GeoPoint): number {
  return projectOntoSegment(point, start, end).distanceKm;
}

function simplifiedRoastLevel(level: RoastLevel): CoffeeRoastCriterion | undefined {
  if (level === "light" || level === "dark") return level;
  if (level === "medium-light" || level === "medium" || level === "medium-dark") return "medium";
  return undefined;
}

function matchesCoffeeCriteria(cafe: Cafe, criteria: CoffeeFilterCriteria): boolean {
  const processes = criteria.processes ?? [];
  const tastes = criteria.tastes ?? [];
  const roasts = criteria.roasts ?? [];
  const nanCoffee = criteria.nanCoffee ?? [];
  const hasOfferingCriteria = processes.length > 0 || tastes.length > 0 || roasts.length > 0;

  if (criteria.workation === true && !cafe.workation) return false;
  if (
    nanCoffee.length > 0 &&
    !nanCoffee.some((criterion) => cafe.badges.includes(criterion))
  ) {
    return false;
  }
  if (!hasOfferingCriteria) return true;

  return cafe.offerings.some((offering) => {
    const processMatches =
      processes.length === 0 ||
      processes.includes(offering.process as CoffeeProcessCriterion);
    const tasteMatches =
      tastes.length === 0 ||
      tastes.some((taste) => offering.tasteProfiles.includes(taste));
    const simplifiedRoast = simplifiedRoastLevel(offering.roastLevel);
    const roastMatches =
      roasts.length === 0 ||
      (simplifiedRoast !== undefined && roasts.includes(simplifiedRoast));

    return processMatches && tasteMatches && roastMatches;
  });
}

function isInLocationRange(coordinates: GeoPoint, locations: readonly CoffeeFilterLocation[]): boolean {
  if (locations.length === 0) return true;

  if (
    locations.some(
      (location) => haversineDistanceKm(coordinates, location) <= DEFAULT_CAFE_RADIUS_KM,
    )
  ) {
    return true;
  }

  for (let index = 0; index < locations.length - 1; index += 1) {
    const projection = projectOntoSegment(coordinates, locations[index], locations[index + 1]);

    if (
      !projection.isDegenerate &&
      projection.projection >= 0 &&
      projection.projection <= 1 &&
      projection.distanceKm <= DEFAULT_ROUTE_CORRIDOR_KM
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Filters without mutating or reordering the source array. Values selected inside
 * one category are ORed; populated categories are ANDed with each other.
 */
export function filterCafes(
  cafes: readonly Cafe[],
  criteria: CoffeeFilterCriteria = {},
): Cafe[] {
  const locations = criteria.locations ?? [];

  return cafes.filter(
    (cafe) =>
      matchesCoffeeCriteria(cafe, criteria) &&
      isInLocationRange(cafe.coordinates, locations),
  );
}
