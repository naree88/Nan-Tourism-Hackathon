import { describe, expect, it } from "vitest";

import { demoCafes } from "../demo";
import type {
  Cafe,
  CafeBadge,
  CoffeeProcess,
  RoastLevel,
  TasteProfile,
} from "../domain/types";
import {
  DEFAULT_CAFE_RADIUS_KM,
  distanceToSegmentKm,
  filterCafes,
  haversineDistanceKm,
  type CoffeeFilterLocation,
} from "./coffee-filter";

const BASE_CAFE = demoCafes[0] as Cafe;

interface OfferingFixture {
  process: CoffeeProcess | "carbonic-maceration";
  tastes: TasteProfile[];
  roast: RoastLevel;
}

function makeCafe(options: {
  id: string;
  coordinates?: CoffeeFilterLocation;
  offerings?: OfferingFixture[];
  workation?: boolean;
  badges?: CafeBadge[];
}): Cafe {
  const offerings = options.offerings ?? [
    { process: "natural", tastes: ["fruity"], roast: "light" },
  ];

  return {
    ...BASE_CAFE,
    id: options.id,
    slug: options.id,
    coordinates: options.coordinates ?? { latitude: 18.78, longitude: 100.77 },
    badges: options.badges ?? [],
    offerings: offerings.map((offering, index) => ({
      ...BASE_CAFE.offerings[0],
      id: `${options.id}-offering-${index}`,
      cafeId: options.id,
      process: offering.process as CoffeeProcess,
      tasteProfiles: offering.tastes,
      roastLevel: offering.roast,
    })),
    workation: options.workation
      ? BASE_CAFE.workation && { ...BASE_CAFE.workation, cafeId: options.id }
      : undefined,
  };
}

describe("geo distance helpers", () => {
  it("calculates great-circle distance and handles the antimeridian", () => {
    expect(
      haversineDistanceKm(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0 },
      ),
    ).toBe(0);
    expect(
      haversineDistanceKm(
        { latitude: 0, longitude: 0 },
        { latitude: 1, longitude: 0 },
      ),
    ).toBeCloseTo(111.195, 2);
    expect(
      haversineDistanceKm(
        { latitude: 0, longitude: 179.9 },
        { latitude: 0, longitude: -179.9 },
      ),
    ).toBeCloseTo(22.239, 2);
  });

  it("measures perpendicular and endpoint distances to a finite segment", () => {
    const start = { latitude: 0, longitude: 0 };
    const end = { latitude: 0, longitude: 1 };

    expect(
      distanceToSegmentKm({ latitude: 0.01, longitude: 0.5 }, start, end),
    ).toBeCloseTo(1.112, 2);
    expect(
      distanceToSegmentKm({ latitude: 0, longitude: 1.1 }, start, end),
    ).toBeCloseTo(11.12, 1);
  });

  it("falls back to point distance for a degenerate segment", () => {
    const endpoint = { latitude: 18, longitude: 100 };
    expect(
      distanceToSegmentKm({ latitude: 18.01, longitude: 100 }, endpoint, endpoint),
    ).toBeCloseTo(1.112, 2);
  });
});

describe("filterCafes content criteria", () => {
  const naturalFruity = makeCafe({
    id: "natural-fruity",
    offerings: [{ process: "natural", tastes: ["fruity"], roast: "light" }],
  });
  const honeyNutty = makeCafe({
    id: "honey-nutty",
    offerings: [{ process: "honey", tastes: ["nutty"], roast: "dark" }],
    workation: true,
  });
  const washedFloral = makeCafe({
    id: "washed-floral",
    offerings: [{ process: "washed", tastes: ["floral"], roast: "medium-light" }],
  });
  const cafes = [naturalFruity, honeyNutty, washedFloral];

  it("returns every cafe in source order when all criteria are empty", () => {
    const result = filterCafes(cafes);

    expect(result.map((cafe) => cafe.id)).toEqual(cafes.map((cafe) => cafe.id));
    expect(result).not.toBe(cafes);
  });

  it("ORs values within a category", () => {
    expect(
      filterCafes(cafes, { processes: ["natural", "honey"] }).map(
        (cafe) => cafe.id,
      ),
    ).toEqual(["natural-fruity", "honey-nutty"]);

    expect(
      filterCafes(cafes, { tastes: ["nutty", "floral"] }).map(
        (cafe) => cafe.id,
      ),
    ).toEqual(["honey-nutty", "washed-floral"]);
  });

  it("ANDs populated process, taste, and roast categories", () => {
    expect(
      filterCafes(cafes, {
        processes: ["natural", "honey"],
        tastes: ["nutty"],
        roasts: ["dark"],
      }).map((cafe) => cafe.id),
    ).toEqual(["honey-nutty"]);
  });

  it("requires the same offering to satisfy all offering categories", () => {
    const splitMatch = makeCafe({
      id: "split-match",
      offerings: [
        { process: "natural", tastes: ["fruity"], roast: "light" },
        { process: "washed", tastes: ["nutty"], roast: "dark" },
      ],
    });

    expect(
      filterCafes([splitMatch], {
        processes: ["natural"],
        tastes: ["nutty"],
        roasts: ["dark"],
      }),
    ).toEqual([]);
  });

  it("maps detailed medium roasts into the form's medium category", () => {
    expect(
      filterCafes(cafes, { roasts: ["medium"] }).map((cafe) => cafe.id),
    ).toEqual(["washed-floral"]);
  });

  it("requires workation details only when workation is selected", () => {
    expect(
      filterCafes(cafes, { workation: true }).map((cafe) => cafe.id),
    ).toEqual(["honey-nutty"]);
    expect(filterCafes(cafes, { workation: false })).toHaveLength(3);
  });

  it("accepts carbonic maceration as a filter criterion", () => {
    const carbonic = makeCafe({
      id: "carbonic",
      offerings: [
        { process: "carbonic-maceration", tastes: ["fruity"], roast: "light" },
      ],
    });

    expect(
      filterCafes([naturalFruity, carbonic], {
        processes: ["carbonic-maceration"],
      }).map((cafe) => cafe.id),
    ).toEqual(["carbonic"]);
  });

  it("filters individually for each Nan coffee badge", () => {
    const nanGrown = makeCafe({
      id: "nan-grown",
      badges: ["nan-grown-beans"],
    });
    const nanRoasted = makeCafe({
      id: "nan-roasted",
      badges: ["nan-roasted"],
    });

    expect(
      filterCafes([nanGrown, nanRoasted], {
        nanCoffee: ["nan-grown-beans"],
      }).map((cafe) => cafe.id),
    ).toEqual(["nan-grown"]);
    expect(
      filterCafes([nanGrown, nanRoasted], {
        nanCoffee: ["nan-roasted"],
      }).map((cafe) => cafe.id),
    ).toEqual(["nan-roasted"]);
  });

  it("ORs multiple Nan coffee badge values", () => {
    const nanGrown = makeCafe({
      id: "nan-grown",
      badges: ["nan-grown-beans"],
    });
    const nanRoasted = makeCafe({
      id: "nan-roasted",
      badges: ["nan-roasted"],
    });
    const neither = makeCafe({ id: "neither" });

    expect(
      filterCafes([nanGrown, nanRoasted, neither], {
        nanCoffee: ["nan-grown-beans", "nan-roasted"],
      }).map((cafe) => cafe.id),
    ).toEqual(["nan-grown", "nan-roasted"]);
  });

  it("returns no match when no cafe has the selected Nan coffee badge", () => {
    expect(
      filterCafes([naturalFruity, honeyNutty, washedFloral], {
        nanCoffee: ["nan-grown-beans"],
      }),
    ).toEqual([]);
  });

  it("ANDs the Nan coffee category with offering criteria", () => {
    const matching = makeCafe({
      id: "matching-nan-grown-fruity",
      badges: ["nan-grown-beans"],
      offerings: [{ process: "natural", tastes: ["fruity"], roast: "light" }],
    });
    const wrongTaste = makeCafe({
      id: "nan-grown-nutty",
      badges: ["nan-grown-beans"],
      offerings: [{ process: "natural", tastes: ["nutty"], roast: "light" }],
    });
    const wrongBadge = makeCafe({
      id: "nan-roasted-fruity",
      badges: ["nan-roasted"],
      offerings: [{ process: "natural", tastes: ["fruity"], roast: "light" }],
    });

    expect(
      filterCafes([matching, wrongTaste, wrongBadge], {
        nanCoffee: ["nan-grown-beans"],
        tastes: ["fruity"],
      }).map((cafe) => cafe.id),
    ).toEqual(["matching-nan-grown-fruity"]);
  });
});

describe("filterCafes geographic criteria", () => {
  const origin = { latitude: 18, longitude: 100 };

  it("keeps cafes within 15 km of any supplied location", () => {
    const nearFirst = makeCafe({
      id: "near-first",
      coordinates: { latitude: 18.1, longitude: 100 },
    });
    const nearSecond = makeCafe({
      id: "near-second",
      coordinates: { latitude: 19.1, longitude: 101 },
    });
    const outside = makeCafe({
      id: "outside",
      coordinates: { latitude: 20, longitude: 102 },
    });

    expect(
      filterCafes([nearFirst, nearSecond, outside], {
        locations: [origin, { latitude: 19, longitude: 101 }],
      }).map((cafe) => cafe.id),
    ).toEqual(["near-first", "near-second"]);
  });

  it("includes the 15 km boundary and excludes a cafe just beyond it", () => {
    const equator = { latitude: 0, longitude: 0 };
    const degreesPerKilometer = 180 / (Math.PI * 6_371.0088);
    const atBoundary = makeCafe({
      id: "at-boundary",
      coordinates: {
        latitude: DEFAULT_CAFE_RADIUS_KM * degreesPerKilometer,
        longitude: 0,
      },
    });
    const justOutside = makeCafe({
      id: "just-outside",
      coordinates: {
        latitude: (DEFAULT_CAFE_RADIUS_KM + 0.001) * degreesPerKilometer,
        longitude: 0,
      },
    });

    expect(haversineDistanceKm(atBoundary.coordinates, equator)).toBeCloseTo(15, 8);
    expect(haversineDistanceKm(justOutside.coordinates, equator)).toBeGreaterThan(15);
    expect(
      filterCafes([atBoundary, justOutside], { locations: [equator] }).map(
        (cafe) => cafe.id,
      ),
    ).toEqual(["at-boundary"]);
  });

  it("includes a cafe over 15 km from both endpoints when it is in the 5 km route corridor", () => {
    const routeStart = { latitude: 18, longitude: 100 };
    const routeEnd = { latitude: 18, longitude: 101 };
    const enRoute = makeCafe({
      id: "en-route",
      coordinates: { latitude: 18.03, longitude: 100.5 },
    });

    expect(haversineDistanceKm(enRoute.coordinates, routeStart)).toBeGreaterThan(15);
    expect(haversineDistanceKm(enRoute.coordinates, routeEnd)).toBeGreaterThan(15);
    expect(
      filterCafes([enRoute], { locations: [routeStart, routeEnd] }).map(
        (cafe) => cafe.id,
      ),
    ).toEqual(["en-route"]);
  });

  it("excludes cafes farther than 5 km from the route corridor", () => {
    const tooFarFromRoute = makeCafe({
      id: "too-far-from-route",
      coordinates: { latitude: 18.06, longitude: 100.5 },
    });

    expect(
      filterCafes([tooFarFromRoute], {
        locations: [origin, { latitude: 18, longitude: 101 }],
      }),
    ).toEqual([]);
  });

  it("uses only ordered consecutive segments and requires an interior projection", () => {
    const nearNonConsecutiveDiagonal = makeCafe({
      id: "near-non-consecutive-diagonal",
      coordinates: { latitude: 18.5, longitude: 100.5 },
    });
    const pastRouteEnd = makeCafe({
      id: "past-route-end",
      coordinates: { latitude: 18, longitude: 101.4 },
    });

    expect(
      filterCafes([nearNonConsecutiveDiagonal, pastRouteEnd], {
        locations: [
          origin,
          { latitude: 18, longitude: 101 },
          { latitude: 19, longitude: 101 },
        ],
      }),
    ).toEqual([]);
  });

  it("ANDs geographic eligibility with content filters", () => {
    const nearWrongTaste = makeCafe({
      id: "near-wrong-taste",
      coordinates: { latitude: 18.1, longitude: 100 },
      offerings: [{ process: "natural", tastes: ["nutty"], roast: "light" }],
    });
    const nearMatching = makeCafe({
      id: "near-matching",
      coordinates: { latitude: 18.1, longitude: 100.01 },
      offerings: [{ process: "natural", tastes: ["fruity"], roast: "light" }],
    });
    const farMatching = makeCafe({
      id: "far-matching",
      coordinates: { latitude: 19, longitude: 100 },
      offerings: [{ process: "natural", tastes: ["fruity"], roast: "light" }],
    });

    expect(
      filterCafes([nearWrongTaste, nearMatching, farMatching], {
        locations: [origin],
        tastes: ["fruity"],
      }).map((cafe) => cafe.id),
    ).toEqual(["near-matching"]);
  });
});
