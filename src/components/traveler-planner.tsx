"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Check,
  Coffee,
  Footprints,
  Laptop,
  MapPin,
  Navigation,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { LocationConsent, type ConsentedLocation } from "./location-consent";
import {
  NanCoffeeMap,
  type NanMapCafe,
  type NanMapLocation,
} from "./nan-coffee-map";
import {
  demoFinderCafes,
  unseenNearbyForFinderCafe,
} from "@/lib/demo/finder-cafes";
import { cleanDemoCopy } from "@/lib/demo/presentation";
import type { GeoPoint, TransportMode } from "@/lib/domain/types";
import {
  DEFAULT_CAFE_RADIUS_KM,
  DEFAULT_ROUTE_CORRIDOR_KM,
  distanceToSegmentKm,
  filterCafes,
  haversineDistanceKm,
  type CoffeeProcessCriterion,
  type CoffeeRoastCriterion,
  type CoffeeTasteCriterion,
  type NanCoffeeCriterion,
} from "@/lib/geo/coffee-filter";
import {
  nanBoundary,
  nanPlaceIndex,
  resolveNanPlace,
  type NanPlace,
} from "@/lib/geo/nan-geodata";
import {
  estimateTravelMinutes,
  formatTravelDurationThai,
} from "@/lib/geo/travel-estimate";

type FinderTransport = Extract<TransportMode, "car" | "bicycle" | "walk">;

type SelectedLocation = NanMapLocation & GeoPoint & {
  accuracyMeters?: number;
};

type FinderSearch = {
  locations: SelectedLocation[];
  transport: FinderTransport | null;
  processes: CoffeeProcessCriterion[];
  tastes: CoffeeTasteCriterion[];
  roasts: CoffeeRoastCriterion[];
  nanCoffee: NanCoffeeCriterion[];
  workation: boolean;
};

const EMPTY_SEARCH: FinderSearch = {
  locations: [],
  transport: null,
  processes: [],
  tastes: [],
  roasts: [],
  nanCoffee: [],
  workation: false,
};

const transportOptions: ReadonlyArray<{
  value: FinderTransport;
  label: string;
  icon: typeof Footprints;
}> = [
  { value: "car", label: "รถยนต์", icon: Navigation },
  { value: "bicycle", label: "จักรยาน", icon: Bike },
  { value: "walk", label: "เดิน", icon: Footprints },
];

const processOptions: ReadonlyArray<{ value: CoffeeProcessCriterion; label: string }> = [
  { value: "natural", label: "Natural" },
  { value: "washed", label: "Wash" },
  { value: "honey", label: "Honey" },
  { value: "anaerobic", label: "Anaerobic" },
  { value: "carbonic-maceration", label: "Carbonic Maceration" },
];

const tasteOptions: ReadonlyArray<{ value: CoffeeTasteCriterion; label: string }> = [
  { value: "nutty", label: "Nutty" },
  { value: "floral", label: "Floral" },
  { value: "fruity", label: "Fruity" },
];

const roastOptions: ReadonlyArray<{ value: CoffeeRoastCriterion; label: string }> = [
  { value: "light", label: "คั่วอ่อน" },
  { value: "medium", label: "คั่วกลาง" },
  { value: "dark", label: "คั่วเข้ม" },
];

const nanCoffeeOptions: ReadonlyArray<{ value: NanCoffeeCriterion; label: string }> = [
  { value: "nan-grown-beans", label: "เมล็ดปลูกในน่าน / Nan-grown" },
  { value: "nan-roasted", label: "คั่วในน่าน / Nan-roasted" },
];

const processLabels = Object.fromEntries(
  processOptions.map((option) => [option.value, option.label]),
) as Record<CoffeeProcessCriterion, string>;

const tasteLabels = Object.fromEntries(
  tasteOptions.map((option) => [option.value, option.label]),
) as Record<CoffeeTasteCriterion, string>;

const roastLabels = Object.fromEntries(
  roastOptions.map((option) => [option.value, option.label]),
) as Record<CoffeeRoastCriterion, string>;

function toggleValue<T>(items: readonly T[], value: T): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function searchFromDraft(search: FinderSearch): FinderSearch {
  return {
    ...search,
    locations: [...search.locations],
    processes: [...search.processes],
    tastes: [...search.tastes],
    roasts: [...search.roasts],
    nanCoffee: [...search.nanCoffee],
  };
}

function selectedLocationFromPlace(place: NanPlace): SelectedLocation {
  return {
    id: place.id,
    label: place.label,
    lat: place.lat,
    lng: place.lng,
    latitude: place.lat,
    longitude: place.lng,
    source: place.source,
  };
}

function selectedLocationFromCoordinates(input: string): SelectedLocation | undefined {
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/u);
  if (!match) return undefined;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  const normalizedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  return {
    id: `coordinates-${normalizedCoordinates.replace(/[^0-9-]/gu, "-")}`,
    label: `พิกัด ${normalizedCoordinates}`,
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
    source: "typed-coordinates",
  };
}

function nearestLocationDistance(
  point: GeoPoint,
  locations: readonly SelectedLocation[],
): { location: SelectedLocation; distanceKm: number } | undefined {
  if (locations.length === 0) return undefined;

  return locations.reduce<{ location: SelectedLocation; distanceKm: number } | undefined>(
    (nearest, location) => {
      const distanceKm = haversineDistanceKm(point, location);
      return !nearest || distanceKm < nearest.distanceKm
        ? { location, distanceKm }
        : nearest;
    },
    undefined,
  );
}

function isCorridorCafe(point: GeoPoint, locations: readonly SelectedLocation[]): boolean {
  if (locations.length < 2) return false;
  if (locations.some((location) => haversineDistanceKm(point, location) <= DEFAULT_CAFE_RADIUS_KM)) {
    return false;
  }

  for (let index = 0; index < locations.length - 1; index += 1) {
    if (distanceToSegmentKm(point, locations[index], locations[index + 1]) <= DEFAULT_ROUTE_CORRIDOR_KM) {
      return true;
    }
  }
  return false;
}

function activeFilterCount(search: FinderSearch): number {
  return (
    search.locations.length +
    search.processes.length +
    search.tastes.length +
    search.roasts.length +
    search.nanCoffee.length +
    Number(search.workation)
  );
}

export function TravelerPlanner() {
  const [draft, setDraft] = useState<FinderSearch>(EMPTY_SEARCH);
  const [applied, setApplied] = useState<FinderSearch>(EMPTY_SEARCH);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationError, setLocationError] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    `แสดงร้านกาแฟทั้งหมด ${demoFinderCafes.length.toLocaleString("th-TH")} ร้านที่มีข้อมูลในแอป`,
  );

  const filteredCafes = useMemo(
    () => filterCafes(demoFinderCafes, {
      locations: applied.locations,
      processes: applied.processes,
      tastes: applied.tastes,
      roasts: applied.roasts,
      nanCoffee: applied.nanCoffee,
      workation: applied.workation,
    }),
    [applied],
  );

  const mapCafes = useMemo<readonly NanMapCafe[]>(
    () => filteredCafes.map((cafe) => ({
      id: cafe.id,
      name: cleanDemoCopy(cafe.name.th),
      lat: cafe.coordinates.latitude,
      lng: cafe.coordinates.longitude,
      isCorridorMatch: isCorridorCafe(cafe.coordinates, applied.locations),
    })),
    [applied.locations, filteredCafes],
  );

  function addLocation(location: SelectedLocation) {
    if (draft.locations.some((item) => item.id === location.id)) {
      setLocationError("เพิ่มสถานที่นี้ไว้แล้ว");
      return;
    }

    setDraft((current) => ({
      ...current,
      locations: [...current.locations, location],
    }));
    setLocationQuery("");
    setLocationError("");
  }

  function addTypedLocation() {
    const query = locationQuery.trim();
    if (!query) {
      setLocationError("พิมพ์ชื่อสถานที่หรือพิกัดก่อนกดเพิ่มสถานที่");
      return;
    }

    const place = resolveNanPlace(query);
    const location = place
      ? selectedLocationFromPlace(place)
      : selectedLocationFromCoordinates(query);

    if (!location) {
      setLocationError("ยังไม่พบสถานที่นี้ในข้อมูลจังหวัดน่าน ลองเลือกชื่อจากรายการแนะนำหรือใส่พิกัด latitude, longitude");
      return;
    }

    addLocation(location);
  }

  function useCurrentLocation(location: ConsentedLocation | null) {
    if (!location) return;

    const currentLocation: SelectedLocation = {
      id: "current-location",
      label: "ตำแหน่งปัจจุบัน",
      lat: location.latitude,
      lng: location.longitude,
      latitude: location.latitude,
      longitude: location.longitude,
      source: "current-location",
      accuracyMeters: location.accuracyMeters,
    };

    setDraft((current) => ({
      ...current,
      locations: current.locations.some((item) => item.id === currentLocation.id)
        ? current.locations.map((item) => item.id === currentLocation.id ? currentLocation : item)
        : [...current.locations, currentLocation],
    }));
    setLocationError("");
  }

  function removeLocation(id: string) {
    setDraft((current) => ({
      ...current,
      locations: current.locations.filter((location) => location.id !== id),
    }));
    setLocationError("");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = searchFromDraft(draft);
    const nextResults = filterCafes(demoFinderCafes, {
      locations: nextSearch.locations,
      processes: nextSearch.processes,
      tastes: nextSearch.tastes,
      roasts: nextSearch.roasts,
      nanCoffee: nextSearch.nanCoffee,
      workation: nextSearch.workation,
    });

    setApplied(nextSearch);
    setLocationError("");
    setStatusMessage(
      activeFilterCount(nextSearch) === 0
        ? `แสดงร้านกาแฟทั้งหมด ${nextResults.length.toLocaleString("th-TH")} ร้านที่มีข้อมูลในแอป`
        : `พบร้านกาแฟ ${nextResults.length.toLocaleString("th-TH")} ร้านจากตัวกรองที่เลือก`,
    );
  }

  function resetSearch() {
    const reset = searchFromDraft(EMPTY_SEARCH);
    setDraft(reset);
    setApplied(reset);
    setLocationQuery("");
    setLocationError("");
    setStatusMessage(
      `แสดงร้านกาแฟทั้งหมด ${demoFinderCafes.length.toLocaleString("th-TH")} ร้านที่มีข้อมูลในแอป`,
    );
  }

  const currentLocation = draft.locations.find((location) => location.id === "current-location");
  const currentLocationConsent = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracyMeters: currentLocation.accuracyMeters ?? 0,
      }
    : null;

  return (
    <section className="coffee-finder" aria-labelledby="coffee-finder-heading">
      <header className="coffee-finder__intro">
        <span className="eyebrow">Nan Coffee Finder</span>
        <h1 id="coffee-finder-heading">
          หาร้านกาแฟที่เข้ากับ <span className="coffee-finder__heading-nowrap">เส้นทางของคุณ</span>
        </h1>
        <p>
          เลือกเฉพาะข้อมูลที่ต้องการได้เลย ถ้าไม่เลือกอะไร ระบบจะแสดงร้านกาแฟทั้งหมดในจังหวัดน่านที่มีข้อมูลในแอป
        </p>
      </header>

      <div className="coffee-finder__layout">
        <form className="finder-panel" onSubmit={submitSearch}>
          <div className="finder-panel__heading">
            <div>
              <span className="eyebrow">ตัวกรอง</span>
              <h2>คุณกำลังมองหาร้านแบบไหน?</h2>
            </div>
            <button className="finder-reset" type="button" onClick={resetSearch}>
              <RotateCcw size={15} aria-hidden="true" /> ล้างทั้งหมด
            </button>
          </div>

          <fieldset className="finder-fieldset finder-fieldset--location">
            <legend>สถานที่</legend>
            <p className="field-hint" id="location-help">
              เพิ่มได้หลายจุดตามลำดับการเดินทาง หรือใส่พิกัดแบบ latitude, longitude
            </p>
            <div className="location-entry-row">
              <div className="location-input-wrap">
                <MapPin size={18} aria-hidden="true" />
                <label className="sr-only" htmlFor="finder-location">ชื่อสถานที่หรือพิกัดในจังหวัดน่าน</label>
                <input
                  id="finder-location"
                  className="input"
                  value={locationQuery}
                  onChange={(event) => {
                    setLocationQuery(event.target.value);
                    setLocationError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTypedLocation();
                    }
                  }}
                  list="nan-place-options"
                  placeholder="เช่น วัดภูมินทร์"
                  aria-describedby={`location-help${locationError ? " location-error" : ""}`}
                  aria-invalid={Boolean(locationError)}
                />
                <datalist id="nan-place-options">
                  {nanPlaceIndex.map((place) => (
                    <option key={place.id} value={place.label} />
                  ))}
                </datalist>
              </div>
              <button className="button button--secondary location-add-button" type="button" onClick={addTypedLocation}>
                <Plus size={17} aria-hidden="true" /> เพิ่มสถานที่
              </button>
            </div>

            <div className="location-current-row">
              <span>หรือ</span>
              <LocationConsent
                key={currentLocation ? "current-location-selected" : "current-location-empty"}
                initialLocation={currentLocationConsent}
                onLocation={useCurrentLocation}
              />
            </div>

            {locationError && <p className="field-error" id="location-error" role="alert">{locationError}</p>}

            {draft.locations.length > 0 && (
              <ol className="selected-location-list" aria-label="สถานที่ตามลำดับการเดินทาง">
                {draft.locations.map((location, index) => (
                  <li key={location.id}>
                    <span className="selected-location-list__order" aria-hidden="true">{index + 1}</span>
                    <span className="selected-location-list__copy">
                      <strong>{location.label}</strong>
                      <small>
                        {location.source === "current-location"
                          ? `Current location${location.accuracyMeters ? ` · แม่นยำประมาณ ${location.accuracyMeters.toLocaleString("th-TH")} ม.` : ""}`
                          : `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                      </small>
                    </span>
                    <button type="button" onClick={() => removeLocation(location.id)} aria-label={`ลบ ${location.label}`}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>วิธีเดินทาง</legend>
            <p className="field-hint">
              รัศมีค้นหาร้าน {DEFAULT_CAFE_RADIUS_KM} กม. · เวลาบนการ์ดคำนวณจากระยะเส้นตรงที่รถยนต์ 80,
              จักรยาน 15 และเดิน 5 กม./ชม. ไม่ใช่ข้อมูลเส้นทางหรือจราจรสด
            </p>
            <div className="chip-row">
              {transportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    className="chip"
                    type="button"
                    key={option.value}
                    aria-pressed={draft.transport === option.value}
                    onClick={() => setDraft((current) => ({
                      ...current,
                      transport: current.transport === option.value ? null : option.value,
                    }))}
                  >
                    <Icon size={15} aria-hidden="true" /> {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>กาแฟน่าน</legend>
            <p className="field-hint">เลือกตามแหล่งปลูกหรือสถานที่คั่วได้มากกว่า 1 ข้อ</p>
            <div className="chip-row">
              {nanCoffeeOptions.map((option) => (
                <button
                  className="chip"
                  type="button"
                  key={option.value}
                  aria-pressed={draft.nanCoffee.includes(option.value)}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    nanCoffee: toggleValue(current.nanCoffee, option.value),
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>Coffee Processing</legend>
            <div className="chip-row">
              {processOptions.map((option) => (
                <button
                  className="chip"
                  type="button"
                  key={option.value}
                  aria-pressed={draft.processes.includes(option.value)}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    processes: toggleValue(current.processes, option.value),
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>Taste Note</legend>
            <div className="chip-row">
              {tasteOptions.map((option) => (
                <button
                  className="chip"
                  type="button"
                  key={option.value}
                  aria-pressed={draft.tastes.includes(option.value)}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    tastes: toggleValue(current.tastes, option.value),
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>ระดับการคั่ว</legend>
            <div className="chip-row">
              {roastOptions.map((option) => (
                <button
                  className="chip"
                  type="button"
                  key={option.value}
                  aria-pressed={draft.roasts.includes(option.value)}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    roasts: toggleValue(current.roasts, option.value),
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder-fieldset">
            <legend>รูปแบบการใช้งาน</legend>
            <button
              className="finder-workation"
              type="button"
              aria-pressed={draft.workation}
              onClick={() => setDraft((current) => ({ ...current, workation: !current.workation }))}
            >
              <span><Laptop size={19} aria-hidden="true" /></span>
              <span><strong>Workation</strong><small>เลือกร้านที่มีข้อมูลรองรับการนั่งทำงาน</small></span>
              <Check size={18} aria-hidden="true" />
            </button>
          </fieldset>

          <p className="finder-optional-note">
            ทุกช่องเป็นตัวเลือก — กรอกเท่าที่ต้องการแล้วกดค้นหาเพื่ออัปเดตแผนที่
          </p>
          <button className="button button--primary button--full finder-submit" type="submit">
            <Search size={19} aria-hidden="true" /> ค้นหาร้านกาแฟ
          </button>
        </form>

        <aside className="finder-map-column" aria-label="แผนที่ผลการค้นหา">
          <NanCoffeeMap
            nanBoundary={nanBoundary}
            selectedLocations={applied.locations}
            cafes={mapCafes}
            radiusKm={DEFAULT_CAFE_RADIUS_KM}
            corridorKm={DEFAULT_ROUTE_CORRIDOR_KM}
            description={
              applied.locations.length > 1
                ? `ร้านในรัศมี ${DEFAULT_CAFE_RADIUS_KM} กม. จากแต่ละจุด รวมร้านที่อยู่ระหว่างเส้นทางตามลำดับสถานที่`
                : applied.locations.length === 1
                  ? `ร้านที่ตรงกับตัวกรองและอยู่ไม่เกิน ${DEFAULT_CAFE_RADIUS_KM} กม. จากสถานที่ที่เลือก`
                  : "ร้านกาแฟในจังหวัดน่านที่ตรงกับตัวกรอง"
            }
          />
        </aside>
      </div>

      <section className="finder-results" aria-labelledby="finder-results-heading">
        <div className="finder-results__heading">
          <div>
            <span className="eyebrow">ผลการค้นหา</span>
            <h2 id="finder-results-heading">
              {filteredCafes.length > 0
                ? `พบ ${filteredCafes.length.toLocaleString("th-TH")} ร้าน`
                : "ยังไม่พบร้านที่ตรงกับตัวกรอง"}
            </h2>
          </div>
          <p role="status" aria-live="polite">{statusMessage}</p>
        </div>

        {filteredCafes.length > 0 ? (
          <div className="finder-result-grid">
            {filteredCafes.map((cafe, resultIndex) => {
              const offering = cafe.offerings[0];
              const nearest = nearestLocationDistance(cafe.coordinates, applied.locations);
              const corridorMatch = isCorridorCafe(cafe.coordinates, applied.locations);
              const unseenNearby = unseenNearbyForFinderCafe(cafe.id);
              const process = offering.process as CoffeeProcessCriterion;
              const taste = offering.tasteProfiles[0] as CoffeeTasteCriterion;
              const roast = offering.roastLevel as CoffeeRoastCriterion;
              const selectedTransport = transportOptions.find(
                (option) => option.value === applied.transport,
              );
              const estimatedMinutes = nearest && applied.transport
                ? estimateTravelMinutes(nearest.distanceKm, applied.transport)
                : undefined;
              const nearestDistanceText = nearest
                ? `${nearest.distanceKm.toLocaleString("th-TH", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} กม. จาก${nearest.location.label}`
                : undefined;
              const distanceText = corridorMatch && nearestDistanceText
                ? `ร้านแวะระหว่างเส้นทาง · ${nearestDistanceText}`
                : nearestDistanceText ?? "ร้านกาแฟในจังหวัดน่าน";
              const travelTimeText = estimatedMinutes && selectedTransport
                ? `ใช้เวลาประมาณ ${formatTravelDurationThai(estimatedMinutes)} · ${selectedTransport.label}`
                : undefined;
              const TransportIcon = selectedTransport?.icon;

              return (
                <Link
                  className="finder-result-card"
                  href={`/cafes/${cafe.slug}`}
                  key={cafe.id}
                  aria-label={[
                    `ดูรายละเอียดร้าน ${cleanDemoCopy(cafe.name.th)}`,
                    distanceText,
                    travelTimeText,
                  ].filter(Boolean).join(" · ")}
                >
                  <div className="finder-result-card__topline">
                    <span><Coffee size={15} aria-hidden="true" /> ร้าน {String(resultIndex + 1).padStart(2, "0")}</span>
                    {cafe.workation && <span><Laptop size={14} aria-hidden="true" /> Workation</span>}
                  </div>
                  <h3>{cleanDemoCopy(cafe.name.th)}</h3>
                  <p className="finder-result-card__unseen"><MapPin size={15} aria-hidden="true" /> Unseen ใกล้ร้าน: {unseenNearby}</p>
                  <div className="finder-result-card__tags" aria-label="ข้อมูลกาแฟ">
                    {cafe.badges.includes("nan-grown-beans") && <span>เมล็ดปลูกในน่าน</span>}
                    {cafe.badges.includes("nan-roasted") && <span>คั่วในน่าน</span>}
                    <span>{processLabels[process] ?? offering.process}</span>
                    <span>{tasteLabels[taste] ?? offering.tasteProfiles[0]}</span>
                    <span>{roastLabels[roast] ?? offering.roastLevel}</span>
                  </div>
                  <div className="finder-result-card__distance">
                    <span className="finder-result-card__distance-copy">
                      <span>{distanceText}</span>
                      {travelTimeText && TransportIcon ? (
                        <small className="finder-result-card__eta">
                          <TransportIcon size={13} aria-hidden="true" />
                          {travelTimeText}
                        </small>
                      ) : null}
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="finder-empty" role="status">
            <Search size={24} aria-hidden="true" />
            <h3>ลองลดตัวกรองบางรายการ</h3>
            <p>ระบบใช้เงื่อนไขทุกหมวดที่เลือกพร้อมกัน และค้นหาร้านภายในรัศมีหรือแนวเส้นทางที่กำหนด</p>
          </div>
        )}
      </section>
    </section>
  );
}
