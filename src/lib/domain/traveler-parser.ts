import type {
  BrewMethod,
  ConsentedLocation,
  GeoPoint,
  LocalizedText,
  ParseConfidence,
  ParsedTravelerField,
  ParsedTravelerRequest,
  PlaceReference,
  RoastLevel,
  TasteProfile,
  TransportMode,
  TravelerEntryMode,
  TravelerParseNotice,
  TravelerUseCase,
} from "./types";

export const TRAVELER_PARSER_VERSION = "traveler-rules-v1.0.0";

export interface TravelerParserOptions {
  entryMode?: TravelerEntryMode;
  startPoint?: PlaceReference | string;
  locationConsent?: ConsentedLocation["consent"];
  coordinates?: GeoPoint;
  locationAccuracyMeters?: number;
}

interface KnownPlace {
  id: string;
  name: LocalizedText;
  aliases: string[];
}

const KNOWN_PLACES: KnownPlace[] = [
  {
    id: "wat-phumin",
    name: { th: "วัดภูมินทร์", en: "Wat Phumin" },
    aliases: ["วัดภูมินทร์", "wat phumin", "phumin temple"],
  },
  {
    id: "nan-old-town",
    name: { th: "ย่านเมืองเก่าน่าน", en: "Nan Old Town" },
    aliases: ["ย่านเมืองเก่าน่าน", "เมืองเก่าน่าน", "nan old town", "old town nan"],
  },
  {
    id: "nan-airport",
    name: { th: "สนามบินน่าน", en: "Nan Airport" },
    aliases: ["สนามบินน่าน", "ท่าอากาศยานน่าน", "nan airport"],
  },
  {
    id: "wat-phra-that-chae-haeng",
    name: { th: "วัดพระธาตุแช่แห้ง", en: "Wat Phra That Chae Haeng" },
    aliases: ["วัดพระธาตุแช่แห้ง", "พระธาตุแช่แห้ง", "wat phra that chae haeng", "chae haeng"],
  },
];

const THAI_DIGITS: Record<string, string> = {
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "๘": "8",
  "๙": "9",
};

const START_CONTEXT = ["อยู่แถว", "อยู่ที่", "เริ่มจาก", "จาก", "แถว", "near", "around", "starting at", "start at", "from"];
const DESTINATION_CONTEXT = ["จะไป", "อยากไป", "แวะ", "ไป", "visit", "going to", "head to", "stop at"];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function confidenceForArray(values: unknown[]): ParseConfidence {
  return values.length > 0 ? "high" : "missing";
}

export function normalizeTravelerText(input: string): string {
  return input
    .trim()
    .replace(/[๐-๙]/g, (digit) => THAI_DIGITS[digit] ?? digit)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function detectLanguage(text: string): ParsedTravelerRequest["detectedLanguage"] {
  const hasThai = /[ก-๙]/.test(text);
  const hasEnglish = /[a-z]/i.test(text);
  if (hasThai && hasEnglish) return "mixed";
  if (hasThai) return "th";
  if (hasEnglish) return "en";
  return "unknown";
}

function toPlaceReference(place: KnownPlace, rawText: string): PlaceReference {
  return { id: place.id, name: place.name, rawText };
}

function coerceStartPoint(startPoint: PlaceReference | string): PlaceReference {
  if (typeof startPoint !== "string") return startPoint;
  const normalized = normalizeTravelerText(startPoint);
  const known = KNOWN_PLACES.find((place) => place.aliases.some((alias) => normalized.includes(alias)));
  if (known) return toPlaceReference(known, startPoint);
  return { name: { th: startPoint.trim(), en: startPoint.trim() }, rawText: startPoint.trim() };
}

function contextBefore(text: string, index: number, length = 32): string {
  return text.slice(Math.max(0, index - length), index);
}

function parsePlaces(text: string): { startPoint?: PlaceReference; destinations: PlaceReference[] } {
  let startPoint: PlaceReference | undefined;
  const destinations: PlaceReference[] = [];

  for (const place of KNOWN_PLACES) {
    const matchedAlias = place.aliases.find((alias) => text.includes(alias));
    if (!matchedAlias) continue;

    const index = text.indexOf(matchedAlias);
    const before = contextBefore(text, index);
    const hasStartContext = hasAny(before, START_CONTEXT);
    const hasDestinationContext = hasAny(before, DESTINATION_CONTEXT);
    const reference = toPlaceReference(place, matchedAlias);

    if (hasStartContext && !hasDestinationContext && !startPoint) {
      startPoint = reference;
    } else {
      destinations.push(reference);
    }
  }

  return { startPoint, destinations };
}

function parseAvailableMinutes(text: string): number | undefined {
  let minutes = 0;
  let matched = false;
  const hourPattern = /(\d+(?:\.\d+)?)\s*(?:ชั่วโมง|ชม\.?|hours?|hrs?|hr)/gi;
  const minutePattern = /(\d+(?:\.\d+)?)\s*(?:นาที|minutes?|mins?|min)/gi;

  for (const match of text.matchAll(hourPattern)) {
    minutes += Number(match[1]) * 60;
    matched = true;
  }
  for (const match of text.matchAll(minutePattern)) {
    minutes += Number(match[1]);
    matched = true;
  }

  if (hasAny(text, ["ครึ่งชั่วโมง", "half an hour", "half hour"])) {
    minutes += 30;
    matched = true;
  }

  return matched ? Math.round(minutes) : undefined;
}

function parseTransport(text: string): TransportMode {
  if (hasAny(text, ["มอเตอร์ไซค์", "มอเตอร์ไซ", "มอไซค์", "motorcycle", "motorbike", "scooter"])) return "motorcycle";
  if (hasAny(text, ["จักรยาน", "bike", "bicycle", "cycling", "cycle"])) return "bicycle";
  if (hasAny(text, ["เดินเท้า", "เดินไป", "walking", "on foot", "walk"])) return "walk";
  if (hasAny(text, ["สองแถว", "รถโดยสาร", "รถสาธารณะ", "public transport", "bus", "songthaew"])) return "public-transport";
  if (hasAny(text, ["ขับรถ", "รถยนต์", "รถมา", "driving", "drive", "by car", "car"])) return "car";
  return "unknown";
}

function parseTasteProfiles(text: string): TasteProfile[] {
  const profiles: TasteProfile[] = [];
  if (hasAny(text, ["โทนผลไม้", "ผลไม้", "ฟรุตตี้", "fruity", "fruit", "berry", "เบอร์รี", "เบอร์รี่", "citrus"])) profiles.push("fruity");
  if (hasAny(text, ["ช็อกโกแลต", "ช็อคโกแลต", "โกโก้", "chocolate", "cocoa", "chocolatey"])) profiles.push("chocolatey");
  if (hasAny(text, ["ดอกไม้", "หอมดอก", "floral", "jasmine"])) profiles.push("floral");
  if (hasAny(text, ["ถั่ว", "nutty", "almond", "hazelnut"])) profiles.push("nutty");
  if (hasAny(text, ["คาราเมล", "caramel", "น้ำตาลไหม้"])) profiles.push("caramel");
  if (hasAny(text, ["คล้ายชา", "tea-like", "tea like"])) profiles.push("tea-like");
  if (hasAny(text, ["เปรี้ยวสดใส", "bright acidity", "bright coffee"])) profiles.push("bright");
  return unique(profiles);
}

function parseRoastLevels(text: string): RoastLevel[] {
  if (hasAny(text, ["คั่วกลางอ่อน", "medium light", "medium-light"])) return ["medium-light"];
  if (hasAny(text, ["คั่วกลางเข้ม", "medium dark", "medium-dark"])) return ["medium-dark"];
  if (hasAny(text, ["คั่วอ่อน", "light roast", "light-roast"])) return ["light"];
  if (hasAny(text, ["คั่วเข้ม", "dark roast", "dark-roast"])) return ["dark"];
  if (hasAny(text, ["คั่วกลาง", "medium roast", "medium-roast"])) return ["medium"];
  return [];
}

function parseBrewMethods(text: string): BrewMethod[] {
  const methods: BrewMethod[] = [];
  if (hasAny(text, ["ฟิลเตอร์", "ดริป", "filter", "pour over", "pour-over", "drip"])) methods.push("filter");
  if (hasAny(text, ["เอสเปรสโซ", "espresso"])) methods.push("espresso");
  if (hasAny(text, ["แอโรเพรส", "aeropress"])) methods.push("aeropress");
  if (hasAny(text, ["โคลด์บริว", "cold brew", "cold-brew"])) methods.push("cold-brew");
  if (hasAny(text, ["โมก้าพอต", "mokapot", "moka pot"])) methods.push("mokapot");
  return unique(methods);
}

function parseUseCases(text: string): TravelerUseCase[] {
  const useCases: TravelerUseCase[] = [];
  if (hasAny(text, ["นั่งทำงาน", "ทำงาน", "เวิร์กเคชัน", "workation", "laptop", "work for", "work"])) useCases.push("work");
  if (hasAny(text, ["ถ่ายรูป", "ถ่ายภาพ", "photo", "photos", "instagram"])) useCases.push("photos");
  if (hasAny(text, ["ซื้อกลับ", "รีบ", "takeaway", "take away", "to go", "quick stop"])) useCases.push("quick-takeaway");
  if (hasAny(text, ["นั่งชิล", "พักผ่อน", "relax", "chill", "sit down"])) useCases.push("relax");
  return unique(useCases);
}

function inferEntryMode(text: string): TravelerEntryMode {
  if (hasAny(text, ["ใกล้ฉัน", "ใกล้ ๆ ฉัน", "ใกล้ๆ ฉัน", "แถวนี้", "near me", "nearby coffee"])) return "near-me";
  if (hasAny(text, ["มีแพลน", "มีแผน", "จะไป", "already have a plan", "going to", "plan to visit"])) return "existing-plan";
  return "ai-plan";
}

function makeNotice(code: TravelerParseNotice["code"], severity: TravelerParseNotice["severity"], th: string, en: string): TravelerParseNotice {
  return { code, severity, message: { th, en } };
}

export function parseTravelerRequest(input: string, options: TravelerParserOptions = {}): ParsedTravelerRequest {
  const normalizedText = normalizeTravelerText(input);
  const places = parsePlaces(normalizedText);
  const entryMode = options.entryMode ?? inferEntryMode(normalizedText);
  const availableTimeMinutes = parseAvailableMinutes(normalizedText);
  const transport = parseTransport(normalizedText);
  const tasteProfiles = parseTasteProfiles(normalizedText);
  const roastLevels = parseRoastLevels(normalizedText);
  const brewMethods = parseBrewMethods(normalizedText);
  const useCases = parseUseCases(normalizedText);
  const startPoint = options.startPoint ? coerceStartPoint(options.startPoint) : places.startPoint;
  const wantsUnseen = hasAny(normalizedText, ["unseen", "hidden gem", "hidden place", "ที่ลับ", "จุดลับ", "อันซีน"]);
  const consent = options.locationConsent ?? "not-requested";
  const location: ConsentedLocation = {
    consent,
    ...(consent === "granted" && options.coordinates ? { coordinates: options.coordinates } : {}),
    ...(consent === "granted" && options.locationAccuracyMeters !== undefined
      ? { accuracyMeters: options.locationAccuracyMeters }
      : {}),
  };

  const notices: TravelerParseNotice[] = [];
  if (!startPoint && entryMode === "ai-plan") {
    notices.push(makeNotice("missing-start-point", "warning", "โปรดระบุจุดเริ่มต้นหรือย่าน", "Please add a starting point or area."));
  }
  if (availableTimeMinutes === undefined && entryMode !== "near-me") {
    notices.push(makeNotice("missing-time", "warning", "โปรดระบุเวลาที่มี", "Please add the time you have available."));
  }
  if (transport === "unknown" && entryMode === "ai-plan") {
    notices.push(makeNotice("missing-transport", "warning", "โปรดเลือกวิธีเดินทาง", "Please choose a transport mode."));
  }
  if (entryMode === "near-me" && consent === "not-requested") {
    notices.push(makeNotice("location-consent-required", "warning", "ต้องขออนุญาตตำแหน่งก่อนค้นหาใกล้ฉัน", "Location permission is required before searching near you."));
  }
  if (entryMode === "near-me" && consent === "granted" && !location.coordinates) {
    notices.push(makeNotice("location-unavailable", "warning", "ยังไม่ได้รับพิกัด โปรดกรอกย่านแทน", "No coordinates were received; please enter an area instead."));
  }
  notices.push(makeNotice("confirmation-required", "info", "โปรดตรวจสอบและแก้ไขข้อมูลก่อนสร้างเส้นทาง", "Please confirm or edit these details before recommendations are generated."));

  const confidence: Record<ParsedTravelerField, ParseConfidence> = {
    entryMode: options.entryMode ? "high" : entryMode === "ai-plan" ? "medium" : "high",
    startPoint: startPoint ? "high" : "missing",
    destinations: confidenceForArray(places.destinations),
    availableTimeMinutes: availableTimeMinutes === undefined ? "missing" : "high",
    transport: transport === "unknown" ? "missing" : "high",
    tasteProfiles: confidenceForArray(tasteProfiles),
    roastLevels: confidenceForArray(roastLevels),
    brewMethods: confidenceForArray(brewMethods),
    useCases: confidenceForArray(useCases),
    wantsUnseen: wantsUnseen ? "high" : "low",
    location: location.coordinates ? "high" : consent === "denied" ? "high" : "missing",
  };

  return {
    originalText: input,
    normalizedText,
    detectedLanguage: detectLanguage(input),
    entryMode,
    startPoint,
    destinations: places.destinations.slice(0, 3),
    availableTimeMinutes,
    transport,
    tasteProfiles,
    roastLevels,
    brewMethods,
    useCases,
    ...(useCases.includes("work") && availableTimeMinutes !== undefined
      ? { workDurationMinutes: availableTimeMinutes }
      : {}),
    wantsUnseen,
    location,
    confidence,
    notices,
    confirmationRequired: true,
    parserVersion: TRAVELER_PARSER_VERSION,
  };
}
