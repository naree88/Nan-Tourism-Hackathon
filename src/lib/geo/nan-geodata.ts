import rawNanGeodata from "./nan-geodata.json";

export type NanPosition = readonly [longitude: number, latitude: number];

export interface NanBoundary {
  type: "Polygon";
  coordinates: readonly (readonly NanPosition[])[];
}

interface NanPlaceBase {
  id: string;
  label: string;
  province: "น่าน";
  lat: number;
  lng: number;
}

export interface NanMvpPlace extends NanPlaceBase {
  kind: "mvp-place";
  source: "mvp-input";
  coordinateSource: "mvp-input";
}

export interface NanProvincePlace extends NanPlaceBase {
  kind: "province";
  source: "spicydog-output-csv";
  coordinateSource: "province-centroid";
}

export interface NanDistrictPlace extends NanPlaceBase {
  kind: "district";
  source: "spicydog-output-csv";
  coordinateSource: "district-centroid";
  district: string;
}

export interface NanSubdistrictPlace extends NanPlaceBase {
  kind: "subdistrict";
  source: "spicydog-output-csv";
  coordinateSource: "source" | "district-centroid";
  district: string;
  subdistrict: string;
  zipcode: string;
}

export type NanPlace =
  | NanMvpPlace
  | NanProvincePlace
  | NanDistrictPlace
  | NanSubdistrictPlace;

export interface NanGeodataSource {
  id: string;
  role: string;
  repository?: string;
  file?: string;
  license: string;
  licenseUrl?: string;
  copyright?: string;
}

export interface NanGeodata {
  metadata: {
    schemaVersion: number;
    scope: string;
    coordinateReferenceSystem: string;
    boundaryCoordinateOrder: string;
    derivation: {
      provinceCentroid: string;
      districtCentroids: string;
      missingSubdistrictCoordinates: string;
    };
    statistics: {
      boundaryCoordinateCount: number;
      sourceRowCount: number;
      districtCount: number;
      subdistrictCount: number;
      imputedSubdistrictCoordinateCount: number;
      mvpPlaceCount: number;
      placeIndexCount: number;
    };
    sources: NanGeodataSource[];
  };
  boundary: NanBoundary;
  places: NanPlace[];
}

export const nanGeodata = rawNanGeodata as unknown as NanGeodata;
export const nanBoundary = nanGeodata.boundary;
export const nanPlaceIndex = nanGeodata.places;

export const nanMvpPlaces = nanPlaceIndex.filter(
  (place): place is NanMvpPlace => place.kind === "mvp-place",
);
export const nanProvinceOption = nanPlaceIndex.find(
  (place): place is NanProvincePlace => place.kind === "province",
);
export const nanDistrictOptions = nanPlaceIndex.filter(
  (place): place is NanDistrictPlace => place.kind === "district",
);
export const nanSubdistrictOptions = nanPlaceIndex.filter(
  (place): place is NanSubdistrictPlace => place.kind === "subdistrict",
);

function normalizePlaceQuery(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("th-TH").replace(/\s+/gu, "");
}

function aliasesForPlace(place: NanPlace): string[] {
  if (place.kind === "mvp-place") {
    return [place.label, `${place.label} จังหวัดน่าน`];
  }

  if (place.kind === "province") {
    return [place.label, place.province, "Nan"];
  }

  if (place.kind === "district") {
    return [
      place.label,
      place.district,
      `${place.district} น่าน`,
      `${place.label} จังหวัดน่าน`,
    ];
  }

  return [
    place.label,
    place.subdistrict,
    `${place.subdistrict} ${place.district}`,
    `${place.label} อำเภอ${place.district}`,
    `${place.label} อำเภอ${place.district} จังหวัดน่าน`,
  ];
}

/**
 * Resolves a place in Nan from Thai administrative names or the curated MVP
 * places. Exact aliases win; otherwise the most specific useful partial match
 * is returned. Whitespace and casing do not affect matching.
 */
export function resolveNanPlace(query: string): NanPlace | undefined {
  const normalizedQuery = normalizePlaceQuery(query);

  if (!normalizedQuery) {
    return undefined;
  }

  const indexedAliases = nanPlaceIndex.map((place, index) => ({
    place,
    index,
    aliases: aliasesForPlace(place).map(normalizePlaceQuery),
  }));

  const exactMatch = indexedAliases.find(({ aliases }) =>
    aliases.includes(normalizedQuery),
  );

  if (exactMatch) {
    return exactMatch.place;
  }

  // One-character partial searches are too ambiguous to be useful.
  if (normalizedQuery.length < 2) {
    return undefined;
  }

  let bestMatch:
    | { place: NanPlace; score: number; index: number }
    | undefined;

  for (const entry of indexedAliases) {
    for (const alias of entry.aliases) {
      let score = 0;

      if (normalizedQuery.includes(alias)) {
        // Prefer the longest recognized place inside natural-language input.
        score = 30_000 + alias.length * 100;
      } else if (alias.startsWith(normalizedQuery)) {
        score = 20_000 + normalizedQuery.length * 100;
      } else if (alias.includes(normalizedQuery)) {
        score = 10_000 + normalizedQuery.length * 100;
      }

      if (
        score > 0 &&
        (!bestMatch ||
          score > bestMatch.score ||
          (score === bestMatch.score && entry.index < bestMatch.index))
      ) {
        bestMatch = { place: entry.place, score, index: entry.index };
      }
    }
  }

  return bestMatch?.place;
}
