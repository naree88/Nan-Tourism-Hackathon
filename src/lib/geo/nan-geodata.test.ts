import { describe, expect, it } from "vitest";

import {
  nanBoundary,
  nanDistrictOptions,
  nanGeodata,
  nanMvpPlaces,
  nanPlaceIndex,
  nanProvinceOption,
  nanSubdistrictOptions,
  resolveNanPlace,
} from "./nan-geodata";

describe("Nan geodata", () => {
  it("contains only the Nan Polygon and the complete 99-row place source", () => {
    expect(nanBoundary.type).toBe("Polygon");
    expect(nanBoundary.coordinates).toHaveLength(1);
    expect(nanBoundary.coordinates[0]).toHaveLength(70);
    expect(nanGeodata.metadata.statistics.sourceRowCount).toBe(99);
    expect(nanSubdistrictOptions).toHaveLength(99);
    expect(nanDistrictOptions).toHaveLength(15);
    expect(nanPlaceIndex).toHaveLength(118);
    expect(nanProvinceOption?.label).toBe("จังหวัดน่าน");
  });

  it("prioritizes the three exact MVP locations at the top of the index", () => {
    expect(nanMvpPlaces.map((place) => place.label)).toEqual([
      "ท่าอากาศยานน่านนคร",
      "วัดภูมินทร์",
      "วัดพระธาตุแช่แห้ง",
    ]);
    expect(nanPlaceIndex.slice(0, 3)).toEqual(nanMvpPlaces);
    expect(nanMvpPlaces[1]).toMatchObject({
      lat: 18.775629994889727,
      lng: 100.77132600164254,
      source: "mvp-input",
    });
  });

  it("provides finite coordinates and flags the four centroid fallbacks", () => {
    expect(
      nanPlaceIndex.every(
        (place) => Number.isFinite(place.lat) && Number.isFinite(place.lng),
      ),
    ).toBe(true);

    const imputed = nanSubdistrictOptions.filter(
      (place) => place.coordinateSource === "district-centroid",
    );
    expect(imputed.map((place) => place.subdistrict)).toEqual([
      "นาซาว",
      "บ่อสวก",
      "เจดีย์ชัย",
      "ผาทอง",
    ]);
    expect(nanGeodata.metadata.statistics.imputedSubdistrictCoordinateCount).toBe(
      4,
    );
  });
});

describe("resolveNanPlace", () => {
  it("matches exact MVP names before administrative partial matches", () => {
    expect(resolveNanPlace(" วัดภูมินทร์ ")).toMatchObject({
      kind: "mvp-place",
      id: "mvp:wat-phumin",
    });
    expect(resolveNanPlace("ท่าอากาศยาน น่านนคร")).toMatchObject({
      kind: "mvp-place",
      id: "mvp:nan-nakhon-airport",
    });
  });

  it("ignores case and whitespace", () => {
    expect(resolveNanPlace(" N A N ")).toMatchObject({
      kind: "province",
      province: "น่าน",
    });
    expect(resolveNanPlace("อำเภอ เมืองน่าน")).toMatchObject({
      kind: "district",
      district: "เมืองน่าน",
    });
  });

  it("uses district-qualified aliases to disambiguate duplicate subdistricts", () => {
    expect(resolveNanPlace("ตำบลสถาน อำเภอนาน้อย")).toMatchObject({
      kind: "subdistrict",
      district: "นาน้อย",
      subdistrict: "สถาน",
    });
  });

  it("finds the longest useful place inside natural-language input", () => {
    expect(
      resolveNanPlace("วันนี้ไปวัดพระธาตุแช่แห้ง แล้วหาร้านกาแฟระหว่างทาง"),
    ).toMatchObject({
      kind: "mvp-place",
      id: "mvp:wat-phrathat-chae-haeng",
    });
    expect(resolveNanPlace("เชียง")).toMatchObject({
      kind: "district",
      district: "เชียงกลาง",
    });
  });

  it("returns undefined for blank or overly broad one-character input", () => {
    expect(resolveNanPlace("  ")).toBeUndefined();
    expect(resolveNanPlace("น")).toBeUndefined();
  });
});
