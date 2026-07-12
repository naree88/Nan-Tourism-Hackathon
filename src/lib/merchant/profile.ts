import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  BrewMethod,
  Cafe,
  CoffeeProcess,
  MerchantMenuItemPatch,
  MerchantOfferingPatch,
  MerchantOfferingRemoval,
  MerchantWorkationPatch,
  OfferingAvailabilityStatus,
  RoastLevel,
  StructuredMerchantUpdate,
} from "@/lib/domain";

export type MerchantProfileOffering = MerchantOfferingPatch & {
  id?: string;
  updatedAt?: string;
};

export type MerchantProfileMenuItem = {
  id?: string;
  nameTh: string;
  nameEn?: string;
  descriptionTh?: string;
  descriptionEn?: string;
  priceThb?: number;
  isAvailable: boolean;
  isCafePick: boolean;
  usesFeaturedSingleOrigin?: boolean;
  featuredOfferingId?: string;
};

export type MerchantProfileSnapshot = {
  cafe: {
    id: string;
    slug: string;
    nameTh: string;
    storyTh?: string;
    addressTh?: string;
  };
  featuredOffering?: MerchantProfileOffering;
  offerings?: MerchantProfileOffering[];
  menuItems: MerchantProfileMenuItem[];
  workation?: MerchantWorkationPatch;
  openingNote?: string;
  updatedAt: string;
};

type ProfileMenuItem = MerchantProfileSnapshot["menuItems"][number];
type ProfileOffering = NonNullable<MerchantProfileSnapshot["featuredOffering"]>;

type CafeRow = {
  id: string;
  slug: string;
  name_th: string;
  description_th: string | null;
  address_th: string | null;
  opening_note_th: string | null;
  updated_at: string;
};

type OfferingRow = {
  id: string;
  bean_name: string;
  origin_province: string | null;
  origin_name: string | null;
  producer: string | null;
  altitude_min_m: number | string | null;
  altitude_max_m: number | string | null;
  varietal: string | null;
  process: string;
  process_detail: string | null;
  processing_province: string | null;
  processing_locality: string | null;
  roast_level: string;
  roaster_province: string | null;
  roaster_locality: string | null;
  tasting_notes_th: unknown;
  tasting_notes_en: unknown;
  brew_methods: unknown;
  price_thb: number | string | null;
  availability: string;
  updated_at: string;
};

type MenuRow = {
  id: string;
  name_th: string;
  name_en: string | null;
  description_th: string | null;
  description_en: string | null;
  price_thb: number | string | null;
  is_available: boolean;
  is_cafe_pick: boolean;
  featured_offering_id: string | null;
  updated_at: string;
};

type WorkationRow = {
  free_wifi: boolean;
  outlets: string;
  work_suitability: string;
  video_call_suitability: string;
  hours_policy_th: string | null;
  updated_at: string;
};

type SpeedRow = {
  download_mbps: number | string;
  upload_mbps: number | string;
  ping_ms: number | string;
  updated_at: string;
};

function nonEmptyText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const text = nonEmptyText(item);
    return text ? [text] : [];
  });
}

function mapProcess(value: unknown, detail?: unknown): CoffeeProcess {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replaceAll("_", "-") : "";
  if (normalized === "natural" || normalized === "washed" || normalized === "honey" || normalized === "anaerobic") {
    return normalized;
  }
  if (normalized === "carbonic-maceration" || /carbonic\s+maceration/i.test(String(detail ?? ""))) {
    return "carbonic-maceration";
  }
  if (normalized === "other") return "other";
  return "unknown";
}

function mapRoastLevel(value: unknown): RoastLevel {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replaceAll("_", "-") : "";
  if (
    normalized === "light"
    || normalized === "medium-light"
    || normalized === "medium"
    || normalized === "medium-dark"
    || normalized === "dark"
  ) {
    return normalized;
  }
  return "unknown";
}

function mapAvailability(value: unknown): OfferingAvailabilityStatus {
  switch (value) {
    case "available":
      return "available";
    case "limited":
    case "seasonal":
      return "limited";
    case "sold_out":
    case "unavailable":
      return "unavailable";
    default:
      return "unknown";
  }
}

function mapBrewMethods(value: unknown): BrewMethod[] {
  const methods = stringArray(value).map((method): BrewMethod => {
    switch (method.trim().toLowerCase().replaceAll("_", "-")) {
      case "filter":
        return "filter";
      case "espresso":
        return "espresso";
      case "aeropress":
        return "aeropress";
      case "cold-brew":
      case "coldbrew":
        return "cold-brew";
      case "moka-pot":
      case "mokapot":
        return "mokapot";
      default:
        return "other";
    }
  });
  return [...new Set(methods)];
}

function mapTastingNotes(thValue: unknown, enValue: unknown) {
  const thai = stringArray(thValue);
  const english = stringArray(enValue);
  const length = Math.max(thai.length, english.length);
  return Array.from({ length }, (_, index) => ({
    th: thai[index] ?? english[index] ?? "",
    en: english[index] ?? thai[index] ?? "",
  })).filter((note) => note.th && note.en);
}

function mapOfferingRow(offering: OfferingRow): ProfileOffering {
  return {
    id: offering.id,
    updatedAt: offering.updated_at,
    beanName: offering.bean_name,
    ...(nonEmptyText(offering.origin_province) ? { originProvince: offering.origin_province!.trim() } : {}),
    ...(nonEmptyText(offering.origin_name) ? { originName: offering.origin_name!.trim() } : {}),
    ...(nonEmptyText(offering.producer) ? { producer: offering.producer!.trim() } : {}),
    ...(finiteNumber(offering.altitude_min_m) !== undefined && finiteNumber(offering.altitude_max_m) !== undefined
      ? {
          altitudeMeters: {
            min: finiteNumber(offering.altitude_min_m)!,
            max: finiteNumber(offering.altitude_max_m)!,
          },
        }
      : {}),
    ...(nonEmptyText(offering.varietal) ? { varietal: offering.varietal!.trim() } : {}),
    process: mapProcess(offering.process, offering.process_detail),
    ...(nonEmptyText(offering.processing_province) || nonEmptyText(offering.processing_locality)
      ? {
          processingLocation: {
            ...(nonEmptyText(offering.processing_province) ? { province: offering.processing_province!.trim() } : {}),
            ...(nonEmptyText(offering.processing_locality) ? { locality: offering.processing_locality!.trim() } : {}),
          },
        }
      : {}),
    roastLevel: mapRoastLevel(offering.roast_level),
    ...(nonEmptyText(offering.roaster_province) || nonEmptyText(offering.roaster_locality)
      ? {
          roasterLocation: {
            ...(nonEmptyText(offering.roaster_province) ? { province: offering.roaster_province!.trim() } : {}),
            ...(nonEmptyText(offering.roaster_locality) ? { locality: offering.roaster_locality!.trim() } : {}),
          },
        }
      : {}),
    tastingNotes: mapTastingNotes(offering.tasting_notes_th, offering.tasting_notes_en),
    tasteProfiles: [],
    brewMethods: mapBrewMethods(offering.brew_methods),
    ...(finiteNumber(offering.price_thb) !== undefined
      ? { price: { amount: finiteNumber(offering.price_thb)!, currency: "THB" } }
      : {}),
    availability: mapAvailability(offering.availability),
  };
}

function mapOutlets(value: unknown): MerchantWorkationPatch["outlets"] {
  switch (value) {
    case "most_seats":
      return "at-most-seats";
    case "limited":
      return "some";
    case "none":
      return "none";
    default:
      return "unknown";
  }
}

function mapWorkSuitability(value: unknown): MerchantWorkationPatch["workSeating"] {
  switch (value) {
    case "very_suitable":
    case "suitable":
      return "good";
    case "limited":
      return "possible";
    default:
      return "unknown";
  }
}

function mapVideoCallSuitability(value: unknown): MerchantWorkationPatch["videoCalls"] {
  switch (value) {
    case "suitable":
      return "good";
    case "possible":
      return "possible";
    case "not_recommended":
      return "not-suitable";
    default:
      return "unknown";
  }
}

function latestTimestamp(fallback: string, values: Array<string | null | undefined>): string {
  let latestValue = fallback;
  let latestTime = Date.parse(fallback);
  if (!Number.isFinite(latestTime)) latestTime = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp) && timestamp > latestTime) {
      latestValue = value;
      latestTime = timestamp;
    }
  }
  return latestValue;
}

function cloneOffering(offering: ProfileOffering): ProfileOffering {
  return {
    ...offering,
    tastingNotes: offering.tastingNotes.map((note) => ({ ...note })),
    tasteProfiles: [...offering.tasteProfiles],
    brewMethods: [...offering.brewMethods],
    ...(offering.altitudeMeters ? { altitudeMeters: { ...offering.altitudeMeters } } : {}),
    ...(offering.processingLocation ? { processingLocation: { ...offering.processingLocation } } : {}),
    ...(offering.roasterLocation ? { roasterLocation: { ...offering.roasterLocation } } : {}),
    ...(offering.price ? { price: { ...offering.price } } : {}),
  };
}

function normalizedOfferingName(value?: string): string {
  return value?.trim().normalize("NFC").toLocaleLowerCase("th-TH") ?? "";
}

function matchesOfferingRemoval(
  offering: ProfileOffering,
  removal: MerchantOfferingRemoval,
): boolean {
  if (removal.offeringId) return offering.id === removal.offeringId;
  return Boolean(
    normalizedOfferingName(removal.beanName)
    && normalizedOfferingName(offering.beanName) === normalizedOfferingName(removal.beanName),
  );
}

function mergeOffering(current: ProfileOffering | undefined, patch: MerchantOfferingPatch): ProfileOffering {
  const base: ProfileOffering = current
    ? cloneOffering(current)
    : { tastingNotes: [], tasteProfiles: [], brewMethods: [] };
  const definedPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  const merged = { ...base, ...definedPatch } as ProfileOffering;

  merged.tastingNotes = patch.tastingNotes.length > 0
    ? patch.tastingNotes.map((note) => ({ ...note }))
    : base.tastingNotes;
  merged.tasteProfiles = patch.tasteProfiles.length > 0 ? [...patch.tasteProfiles] : base.tasteProfiles;
  merged.brewMethods = patch.brewMethods.length > 0 ? [...patch.brewMethods] : base.brewMethods;

  if (patch.processingLocation) {
    merged.processingLocation = { ...base.processingLocation, ...patch.processingLocation };
  }
  if (patch.roasterLocation) {
    merged.roasterLocation = { ...base.roasterLocation, ...patch.roasterLocation };
  }
  if (patch.altitudeMeters) merged.altitudeMeters = { ...patch.altitudeMeters };
  if (patch.price) merged.price = { ...patch.price };
  return merged;
}

function mergeMenuItem(current: ProfileMenuItem | undefined, patch: MerchantMenuItemPatch): ProfileMenuItem {
  const definedPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  return {
    nameTh: patch.nameTh,
    isAvailable: true,
    isCafePick: false,
    ...current,
    ...definedPatch,
  };
}

function mergeMenuItems(current: ProfileMenuItem[], patches: MerchantMenuItemPatch[]): ProfileMenuItem[] {
  const merged = current.map((item) => ({ ...item }));

  for (const patch of patches) {
    const normalizedName = patch.nameTh.trim().toLocaleLowerCase("th-TH");
    const index = merged.findIndex((item) =>
      (patch.id && item.id === patch.id)
      || (!patch.id && item.nameTh.trim().toLocaleLowerCase("th-TH") === normalizedName),
    );
    if (index >= 0) merged[index] = mergeMenuItem(merged[index], patch);
    else merged.push(mergeMenuItem(undefined, patch));
  }
  return merged;
}

function mapCafeOffering(offering: Cafe["offerings"][number]): ProfileOffering {
  return {
    id: offering.id,
    updatedAt: offering.updatedAt,
    beanName: offering.name.th,
    ...(offering.origin.province ? { originProvince: offering.origin.province } : {}),
    ...(offering.origin.farmOrCommunity ? { originName: offering.origin.farmOrCommunity } : {}),
    ...(offering.origin.producer ? { producer: offering.origin.producer } : {}),
    process: offering.process,
    roastLevel: offering.roastLevel,
    tastingNotes: offering.tastingNotes.map((note) => ({ ...note })),
    tasteProfiles: [...offering.tasteProfiles],
    brewMethods: [...offering.brewMethods],
    price: { ...offering.priceFrom },
    availability: offering.availability.status,
  };
}

/** Maps an in-memory/domain cafe into the profile shape used by merchant preview. */
export function mapCafeToMerchantProfile(cafe: Cafe): MerchantProfileSnapshot {
  const highlightedOfferingId = cafe.highlights.find((highlight) =>
    highlight.kind === "cafe-pick" && cafe.offerings.some((offering) => offering.id === highlight.offeringOrMenuItemId),
  )?.offeringOrMenuItemId;
  const offerings = cafe.offerings
    .filter((item) => item.approvedForPublic)
    .map(mapCafeOffering);
  const offering = offerings.find((item) => item.id === highlightedOfferingId) ?? offerings[0];
  const latestSpeed = cafe.workation?.speedReports
    .slice()
    .sort((left, right) => Date.parse(right.testedAt) - Date.parse(left.testedAt))[0];

  const featuredOffering: MerchantProfileSnapshot["featuredOffering"] = offering
    ? cloneOffering(offering)
    : undefined;

  const workation: MerchantWorkationPatch | undefined = cafe.workation
    ? {
        wifi: cafe.workation.wifi.availability,
        outlets: cafe.workation.outlets,
        workSeating: cafe.workation.workSeating,
        videoCalls: cafe.workation.videoCalls,
        policyText: cafe.workation.policy.th,
        ...(latestSpeed
          ? {
              downloadMbps: latestSpeed.downloadMbps,
              uploadMbps: latestSpeed.uploadMbps,
              pingMs: latestSpeed.pingMs,
            }
          : {}),
      }
    : undefined;

  return {
    cafe: {
      id: cafe.id,
      slug: cafe.slug,
      nameTh: cafe.name.th,
      ...(nonEmptyText(cafe.story.th) ? { storyTh: cafe.story.th.trim() } : {}),
      ...(nonEmptyText(cafe.address.th) ? { addressTh: cafe.address.th.trim() } : {}),
    },
    ...(featuredOffering ? { featuredOffering } : {}),
    offerings: offerings.map(cloneOffering),
    menuItems: cafe.menu.filter((item) => item.approvedForPublic).map((item) => ({
      id: item.id,
      nameTh: item.name.th,
      ...(nonEmptyText(item.name.en) ? { nameEn: item.name.en.trim() } : {}),
      ...(nonEmptyText(item.description.th) ? { descriptionTh: item.description.th.trim() } : {}),
      ...(nonEmptyText(item.description.en) ? { descriptionEn: item.description.en.trim() } : {}),
      priceThb: item.price.amount,
      isAvailable: item.availability.status === "available" || item.availability.status === "limited",
      isCafePick: item.isCafePick,
    })),
    ...(workation ? { workation } : {}),
    ...(nonEmptyText(cafe.opening.note.th) ? { openingNote: cafe.opening.note.th.trim() } : {}),
    updatedAt: cafe.updatedAt,
  };
}

/** Applies only fields represented in the proposed update and leaves the input snapshot immutable. */
export function applyMerchantUpdateToProfile(
  current: MerchantProfileSnapshot,
  update: StructuredMerchantUpdate,
): MerchantProfileSnapshot {
  const openingNote = update.openingNote === undefined ? current.openingNote : nonEmptyText(update.openingNote);
  const workation = update.workation
    ? {
        ...current.workation,
        ...Object.fromEntries(Object.entries(update.workation).filter(([, value]) => value !== undefined)),
      } as MerchantWorkationPatch
    : current.workation ? { ...current.workation } : undefined;

  const offerings = (current.offerings?.length
    ? current.offerings
    : current.featuredOffering ? [current.featuredOffering] : [])
    .map(cloneOffering);
  let featuredOffering = current.featuredOffering
    ? cloneOffering(current.featuredOffering)
    : offerings[0] ? cloneOffering(offerings[0]) : undefined;
  let menuItems = update.menuItems?.length
    ? mergeMenuItems(current.menuItems, update.menuItems)
    : current.menuItems.map((item) => ({ ...item }));

  if (update.offering && update.offeringRemovals?.length) {
    throw new Error("A Single Origin bean cannot be updated and removed in the same draft.");
  }

  if (update.offering) {
    const requestedName = update.offering.beanName
      ?.trim()
      .normalize("NFC")
      .toLocaleLowerCase("th-TH");
    const featuredId = current.featuredOffering?.id;
    if (!requestedName && !featuredId && offerings.length > 1) {
      throw new Error("Choose a Single Origin bean before applying an update without a bean name.");
    }
    const matchingIndex = requestedName
      ? offerings.findIndex((item) =>
          item.beanName?.trim().normalize("NFC").toLocaleLowerCase("th-TH") === requestedName,
        )
      : featuredId
        ? offerings.findIndex((item) => item.id === featuredId)
        : offerings.length === 1 ? 0 : -1;
    const mergedOffering = mergeOffering(
      matchingIndex >= 0 ? offerings[matchingIndex] : undefined,
      update.offering,
    );
    if (matchingIndex >= 0) offerings[matchingIndex] = mergedOffering;
    else offerings.push(mergedOffering);
    featuredOffering = cloneOffering(mergedOffering);
  }

  if (update.offeringRemovals?.length) {
    const removedOfferingIds = new Set<string>();
    let removedFeatured = false;

    for (const removal of update.offeringRemovals) {
      const matchingIndex = offerings.findIndex((item) => matchesOfferingRemoval(item, removal));
      if (matchingIndex < 0) {
        throw new Error(`Single Origin bean ${removal.beanName} does not belong to this storefront.`);
      }

      const [removed] = offerings.splice(matchingIndex, 1);
      if (removed.id) removedOfferingIds.add(removed.id);
      if (featuredOffering && matchesOfferingRemoval(featuredOffering, removal)) removedFeatured = true;
    }

    if (removedFeatured) {
      featuredOffering = offerings[0] ? cloneOffering(offerings[0]) : undefined;
    } else if (featuredOffering) {
      const retainedFeatured = offerings.find((item) =>
        featuredOffering?.id
          ? item.id === featuredOffering.id
          : normalizedOfferingName(item.beanName) === normalizedOfferingName(featuredOffering?.beanName),
      );
      featuredOffering = retainedFeatured
        ? cloneOffering(retainedFeatured)
        : offerings[0] ? cloneOffering(offerings[0]) : undefined;
    }

    menuItems = menuItems.map((item) => {
      if (!item.featuredOfferingId || !removedOfferingIds.has(item.featuredOfferingId)) {
        return { ...item };
      }
      const unlinkedItem = { ...item };
      delete unlinkedItem.featuredOfferingId;
      return { ...unlinkedItem, usesFeaturedSingleOrigin: false };
    });
  }

  return {
    cafe: { ...current.cafe },
    ...(featuredOffering ? { featuredOffering } : {}),
    offerings,
    menuItems,
    ...(workation ? { workation } : {}),
    ...(openingNote ? { openingNote } : {}),
    updatedAt: current.updatedAt,
  };
}

/** Loads the currently public profile even when called with an authenticated owner client. */
export async function loadSupabaseMerchantProfile(
  supabase: SupabaseClient,
  cafeId: string,
): Promise<MerchantProfileSnapshot | null> {
  const cafeResult = await supabase
    .from("cafes")
    .select("id, slug, name_th, description_th, address_th, opening_note_th, updated_at")
    .eq("id", cafeId)
    .in("status", ["published", "temporarily_closed"])
    .not("published_at", "is", null)
    .maybeSingle();

  if (cafeResult.error) throw new Error(`Unable to load published cafe: ${cafeResult.error.message}`);
  if (!cafeResult.data) return null;
  const cafe = cafeResult.data as CafeRow;

  const [offeringResult, menuResult, workationResult, speedResult] = await Promise.all([
    supabase
      .from("coffee_offerings")
      .select("id, bean_name, origin_province, origin_name, producer, altitude_min_m, altitude_max_m, varietal, process, process_detail, processing_province, processing_locality, roast_level, roaster_province, roaster_locality, tasting_notes_th, tasting_notes_en, brew_methods, price_thb, availability, updated_at")
      .eq("cafe_id", cafeId)
      .eq("approval_status", "approved")
      .not("published_at", "is", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("menu_items")
      .select("id, name_th, name_en, description_th, description_en, price_thb, is_available, is_cafe_pick, featured_offering_id, updated_at")
      .eq("cafe_id", cafeId)
      .eq("approval_status", "approved")
      .not("published_at", "is", null)
      .order("is_cafe_pick", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("workation_details")
      .select("free_wifi, outlets, work_suitability, video_call_suitability, hours_policy_th, updated_at")
      .eq("cafe_id", cafeId)
      .eq("approval_status", "approved")
      .not("published_at", "is", null)
      .maybeSingle(),
    supabase
      .from("speed_reports")
      .select("download_mbps, upload_mbps, ping_ms, updated_at")
      .eq("cafe_id", cafeId)
      .eq("moderation_status", "published")
      .not("published_at", "is", null)
      .order("tested_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const queryError = offeringResult.error ?? menuResult.error ?? workationResult.error ?? speedResult.error;
  if (queryError) throw new Error(`Unable to load published cafe profile: ${queryError.message}`);

  const offeringRows = (offeringResult.data ?? []) as OfferingRow[];
  const offerings = offeringRows.map(mapOfferingRow);
  const menus = (menuResult.data ?? []) as MenuRow[];
  const workationRow = workationResult.data as WorkationRow | null;
  const speed = speedResult.data as SpeedRow | null;

  const featuredOffering: MerchantProfileSnapshot["featuredOffering"] = offerings[0]
    ? cloneOffering(offerings[0])
    : undefined;

  const workation: MerchantWorkationPatch | undefined = workationRow || speed
    ? {
        ...(workationRow
          ? {
              wifi: workationRow.free_wifi ? "available" as const : "unavailable" as const,
              outlets: mapOutlets(workationRow.outlets),
              workSeating: mapWorkSuitability(workationRow.work_suitability),
              videoCalls: mapVideoCallSuitability(workationRow.video_call_suitability),
              ...(nonEmptyText(workationRow.hours_policy_th) ? { policyText: workationRow.hours_policy_th!.trim() } : {}),
            }
          : {}),
        ...(speed && finiteNumber(speed.download_mbps) !== undefined ? { downloadMbps: finiteNumber(speed.download_mbps) } : {}),
        ...(speed && finiteNumber(speed.upload_mbps) !== undefined ? { uploadMbps: finiteNumber(speed.upload_mbps) } : {}),
        ...(speed && finiteNumber(speed.ping_ms) !== undefined ? { pingMs: finiteNumber(speed.ping_ms) } : {}),
      }
    : undefined;

  return {
    cafe: {
      id: cafe.id,
      slug: cafe.slug,
      nameTh: cafe.name_th,
      ...(nonEmptyText(cafe.description_th) ? { storyTh: cafe.description_th!.trim() } : {}),
      ...(nonEmptyText(cafe.address_th) ? { addressTh: cafe.address_th!.trim() } : {}),
    },
    ...(featuredOffering ? { featuredOffering } : {}),
    offerings: offerings.map(cloneOffering),
    menuItems: menus.map((menu) => ({
      id: menu.id,
      nameTh: menu.name_th,
      ...(nonEmptyText(menu.name_en) ? { nameEn: menu.name_en!.trim() } : {}),
      ...(nonEmptyText(menu.description_th) ? { descriptionTh: menu.description_th!.trim() } : {}),
      ...(nonEmptyText(menu.description_en) ? { descriptionEn: menu.description_en!.trim() } : {}),
      ...(finiteNumber(menu.price_thb) !== undefined ? { priceThb: finiteNumber(menu.price_thb) } : {}),
      isAvailable: menu.is_available,
      isCafePick: menu.is_cafe_pick,
      ...(menu.featured_offering_id ? { featuredOfferingId: menu.featured_offering_id } : {}),
      usesFeaturedSingleOrigin: Boolean(menu.featured_offering_id),
    })),
    ...(workation ? { workation } : {}),
    ...(nonEmptyText(cafe.opening_note_th) ? { openingNote: cafe.opening_note_th!.trim() } : {}),
    updatedAt: latestTimestamp(cafe.updated_at, [
      ...offeringRows.map((item) => item.updated_at),
      ...menus.map((menu) => menu.updated_at),
      workationRow?.updated_at,
      speed?.updated_at,
    ]),
  };
}

/** Resolves a public cafe slug first, then loads the same approved snapshot used by merchant preview. */
export async function loadSupabaseMerchantProfileBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<MerchantProfileSnapshot | null> {
  const { data, error } = await supabase
    .from("cafes")
    .select("id")
    .eq("slug", slug)
    .in("status", ["published", "temporarily_closed"])
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) throw new Error(`Unable to resolve published cafe slug: ${error.message}`);
  return data?.id ? loadSupabaseMerchantProfile(supabase, data.id as string) : null;
}
