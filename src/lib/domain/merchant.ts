import { normalizeTravelerText } from "./traveler-parser";
import type {
  AppLocale,
  CoffeeProcess,
  DetectedLanguage,
  ExtractedFieldEvidence,
  ISODateTime,
  LocalizedText,
  MerchantDraft,
  MerchantDraftGeneration,
  MerchantInputMethod,
  MerchantMenuItemPatch,
  MerchantOfferingPatch,
  MerchantSourceImage,
  MerchantUpdateKind,
  MerchantWorkationPatch,
  OfferingAvailabilityStatus,
  ParseConfidence,
  RoastLevel,
  StructuredMerchantUpdate,
  SuitabilityLevel,
  TasteProfile,
} from "./types";

export const MERCHANT_EXTRACTOR_VERSION = "merchant-rules-v1.0.0";

export interface MerchantDraftContext {
  cafeId: string;
  ownerProfileId: string;
  createdAt: ISODateTime;
  draftId?: string;
  inputMethod?: MerchantInputMethod;
  sourceImages?: readonly MerchantSourceImage[];
  generation?: MerchantDraftGeneration;
}

export interface MerchantDraftReview {
  profileId: string;
  reviewedAt: ISODateTime;
  note?: string;
}

interface Extracted<T> {
  value: T;
  sourceText: string;
  confidence: ParseConfidence;
}

const NAME_TRANSLATIONS: Record<string, string> = {
  "บ้านห้วยโทน": "Ban Huai Ton",
  "ห้วยโทน จาวา เนเชอรัล 01": "Huai Ton Java Natural 01",
};

const NOTE_DICTIONARY: Array<{ terms: string[]; value: LocalizedText; profile: TasteProfile }> = [
  { terms: ["สตรอว์เบอร์รี", "สตรอว์เบอร์รี่", "สตรอเบอร์รี", "strawberry"], value: { th: "สตรอว์เบอร์รี", en: "strawberry" }, profile: "fruity" },
  { terms: ["ช็อกโกแลต", "ช็อคโกแลต", "chocolate", "cocoa", "โกโก้"], value: { th: "ช็อกโกแลต", en: "chocolate" }, profile: "chocolatey" },
  { terms: ["ส้ม", "orange"], value: { th: "ส้ม", en: "orange" }, profile: "fruity" },
  { terms: ["มะลิ", "jasmine"], value: { th: "มะลิ", en: "jasmine" }, profile: "floral" },
  { terms: ["คาราเมล", "caramel"], value: { th: "คาราเมล", en: "caramel" }, profile: "caramel" },
  { terms: ["อัลมอนด์", "almond"], value: { th: "อัลมอนด์", en: "almond" }, profile: "nutty" },
];

function detectLanguage(text: string): DetectedLanguage {
  const thai = /[ก-๙]/.test(text);
  const english = /[a-z]/i.test(text);
  if (thai && english) return "mixed";
  if (thai) return "th";
  if (english) return "en";
  return "unknown";
}

function cleanCapture(value: string): string {
  return value.trim().replace(/^[\s:=-]+|[\s,.;:=-]+$/g, "");
}

function matchExtracted(text: string, patterns: RegExp[], confidence: ParseConfidence = "high"): Extracted<string> | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return { value: cleanCapture(match[1]), sourceText: match[0].trim(), confidence };
  }
  return undefined;
}

function addEvidence(evidence: ExtractedFieldEvidence[], field: string, extracted: Extracted<unknown> | undefined): void {
  if (!extracted) return;
  evidence.push({ field, sourceText: extracted.sourceText, confidence: extracted.confidence });
}

function extractBeanName(text: string): Extracted<string> | undefined {
  return matchExtracted(text, [
    /(?:เมล็ดกาแฟ|เมล็ด)\s*([ก-๙a-z0-9_-]+(?:\s+[ก-๙a-z0-9_-]+){0,4}?)(?=\s+(?:natural|washed|honey|anaerobic|คั่ว|โทน|รส|สำหรับ|ใช้|ราคา|แก้วละ|พร้อม|หมด|จาก|โปรเซส)|[,.;]|$)/i,
    /(?:coffee\s+beans?|beans?)\s+(?:from\s+)?([a-z0-9_-]+(?:\s+[a-z0-9_-]+){0,4}?)(?=\s+(?:natural|washed|honey|anaerobic|light|medium|dark|notes?|for|price|available|sold)|[,.;]|$)/i,
  ]);
}

function extractOrigin(text: string, beanName?: Extracted<string>): Extracted<string> | undefined {
  const explicit = matchExtracted(text, [
    /(?:แหล่งปลูก|มาจาก|ปลูกที่|origin)\s*[:=-]?\s*([ก-๙a-z0-9_-]+(?:\s+[ก-๙a-z0-9_-]+){0,4}?)(?=\s+(?:ผู้ผลิต|producer|natural|washed|honey|คั่ว|โทน|ราคา)|[,.;]|$)/i,
  ]);
  if (explicit) return explicit;
  if (beanName && /^(?:บ้าน|ดอย|ห้วย|ปาง|แม่)/.test(beanName.value)) {
    return { ...beanName, confidence: "medium" };
  }
  return undefined;
}

function extractProvince(text: string): Extracted<string> | undefined {
  const match = /(?:จังหวัด|province\s*[:=-]?)?\s*(น่าน|nan)(?=\s|[,.;]|$)/i.exec(text);
  if (!match) return undefined;
  return { value: match[1].toLowerCase() === "nan" ? "Nan" : "น่าน", sourceText: match[0].trim(), confidence: "high" };
}

function extractProducer(text: string): Extracted<string> | undefined {
  return matchExtracted(text, [
    /(?:ผู้ผลิต|เกษตรกร|producer|farmer)\s*[:=-]?\s*([ก-๙a-z0-9_-]+(?:\s+[ก-๙a-z0-9_-]+){0,5}?)(?=\s+(?:natural|washed|honey|คั่ว|โทน|ราคา)|[,.;]|$)/i,
  ]);
}

function extractProcess(text: string): Extracted<CoffeeProcess> | undefined {
  const rules: Array<{ value: CoffeeProcess; pattern: RegExp }> = [
    { value: "carbonic-maceration", pattern: /carbonic[-\s]?maceration|คาร์บอนิก(?:\s+มาเซอเรชัน)?/i },
    { value: "anaerobic", pattern: /\banaerobic\b|แอนแอโรบิก/i },
    { value: "natural", pattern: /\bnatural\b|เนเชอรัล/i },
    { value: "washed", pattern: /\bwashed\b|วอช(?:ด์)?|โพรเซสล้าง/i },
    { value: "honey", pattern: /\bhoney\b|ฮันนี/i },
  ];
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (match) return { value: rule.value, sourceText: match[0], confidence: "high" };
  }
  return undefined;
}

function extractRoast(text: string): Extracted<RoastLevel> | undefined {
  const rules: Array<{ value: RoastLevel; pattern: RegExp }> = [
    { value: "medium-light", pattern: /คั่วกลางอ่อน|medium[-\s]?light(?:\s+roast)?/i },
    { value: "medium-dark", pattern: /คั่วกลางเข้ม|medium[-\s]?dark(?:\s+roast)?/i },
    { value: "light", pattern: /คั่วอ่อน|light(?:\s+roast)/i },
    { value: "dark", pattern: /คั่วเข้ม|dark(?:\s+roast)/i },
    { value: "medium", pattern: /คั่วกลาง|medium(?:\s+roast)/i },
  ];
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (match) return { value: rule.value, sourceText: match[0], confidence: "high" };
  }
  return undefined;
}

function extractTastingNotes(
  text: string,
  allowUnlabeledNotes = true,
): { notes: LocalizedText[]; profiles: TasteProfile[]; evidence?: Extracted<string> } {
  const section = matchExtracted(
    text,
    [/(?:โทน|โน้ต|รสชาติ|tasting\s+notes?|notes?)\s*[:=-]?\s*(.+?)(?=\s+(?:ใช้ทำ|สำหรับ|ชง|ราคา|แก้วละ|available|พร้อม|หมด)|[.;]|$)/i],
    "high",
  );
  const searchable = section?.value ?? (allowUnlabeledNotes ? text : "");
  const matches = NOTE_DICTIONARY.filter((entry) => entry.terms.some((term) => searchable.includes(term)));
  return {
    notes: matches.map((entry) => entry.value),
    profiles: [...new Set(matches.map((entry) => entry.profile))],
    evidence: section,
  };
}

function extractBrewMethods(text: string): Array<Extracted<MerchantOfferingPatch["brewMethods"][number]>> {
  const rules: Array<{ value: MerchantOfferingPatch["brewMethods"][number]; pattern: RegExp }> = [
    { value: "filter", pattern: /\bfilter\b|ฟิลเตอร์|ดริป/i },
    { value: "espresso", pattern: /\bespresso\b|เอสเปรสโซ/i },
    { value: "aeropress", pattern: /\baeropress\b|แอโรเพรส/i },
    { value: "cold-brew", pattern: /cold[-\s]?brew|โคลด์บริว/i },
    { value: "mokapot", pattern: /moka\s?pot|โมก้าพอต/i },
  ];
  return rules.flatMap((rule) => {
    const match = rule.pattern.exec(text);
    return match ? [{ value: rule.value, sourceText: match[0], confidence: "high" as const }] : [];
  });
}

function extractPrice(text: string): Extracted<number> | undefined {
  const match = /(?:ราคา\s*|แก้วละ\s*|price\s*[:=-]?\s*)?(\d+(?:\.\d+)?)\s*(?:บาท|baht|thb)/i.exec(text);
  if (!match) return undefined;
  return { value: Number(match[1]), sourceText: match[0].trim(), confidence: "high" };
}

function extractAvailability(text: string): Extracted<OfferingAvailabilityStatus> | undefined {
  const rules: Array<{ value: OfferingAvailabilityStatus; pattern: RegExp }> = [
    { value: "unavailable", pattern: /หมด(?:แล้ว)?|ไม่มีแล้ว|sold\s*out|unavailable/i },
    { value: "limited", pattern: /เหลือน้อย|จำนวนจำกัด|limited/i },
    { value: "available", pattern: /วันนี้มี|พร้อมเสิร์ฟ|มีเมล็ด|available\s+today|now\s+available|in\s+stock/i },
  ];
  for (const rule of rules) {
    const match = rule.pattern.exec(text);
    if (match) return { value: rule.value, sourceText: match[0], confidence: "high" };
  }
  return undefined;
}

function extractNumber(text: string, pattern: RegExp): Extracted<number> | undefined {
  const match = pattern.exec(text);
  if (!match?.[1]) return undefined;
  return { value: Number(match[1]), sourceText: match[0], confidence: "high" };
}

function extractWorkation(text: string, evidence: ExtractedFieldEvidence[]): MerchantWorkationPatch | undefined {
  const patch: MerchantWorkationPatch = {};
  const wifiUnavailable = /ไม่มี\s*(?:free\s*)?wi-?fi|ไม่มีไว-?ไฟ|no\s+(?:free\s+)?wi-?fi/i.exec(text);
  const wifiAvailable = /(?:มี|ฟรี)\s*(?:free\s*)?wi-?fi|(?:มี|ฟรี)\s*ไว-?ไฟ|free\s+wi-?fi|wi-?fi\s+available/i.exec(text);
  if (wifiUnavailable) {
    patch.wifi = "unavailable";
    evidence.push({ field: "workation.wifi", sourceText: wifiUnavailable[0], confidence: "high" });
  } else if (wifiAvailable) {
    patch.wifi = "available";
    evidence.push({ field: "workation.wifi", sourceText: wifiAvailable[0], confidence: "high" });
  }

  const download = extractNumber(text, /(?:download|ดาวน์โหลด)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:mbps|เมก)/i);
  const upload = extractNumber(text, /(?:upload|อัปโหลด)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:mbps|เมก)/i);
  const ping = extractNumber(text, /(?:ping|ปิง)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*(?:ms|มิลลิวินาที)?/i);
  if (download) patch.downloadMbps = download.value;
  if (upload) patch.uploadMbps = upload.value;
  if (ping) patch.pingMs = ping.value;
  addEvidence(evidence, "workation.downloadMbps", download);
  addEvidence(evidence, "workation.uploadMbps", upload);
  addEvidence(evidence, "workation.pingMs", ping);

  const noOutlet = /ไม่มีปลั๊ก|no\s+outlets?/i.exec(text);
  const someOutlet = /มีปลั๊ก(?:บาง|หลาย)?|some\s+outlets?|power\s+outlets?/i.exec(text);
  if (noOutlet) {
    patch.outlets = "none";
    evidence.push({ field: "workation.outlets", sourceText: noOutlet[0], confidence: "high" });
  } else if (someOutlet) {
    patch.outlets = "some";
    evidence.push({ field: "workation.outlets", sourceText: someOutlet[0], confidence: "medium" });
  }

  const workSeating: Array<{ value: SuitabilityLevel; pattern: RegExp }> = [
    { value: "good", pattern: /โต๊ะทำงาน|นั่งทำงานได้ดี|work[-\s]?friendly\s+seating/i },
    { value: "possible", pattern: /นั่งทำงานได้|laptop[-\s]?friendly/i },
    { value: "not-suitable", pattern: /ไม่เหมาะ.*ทำงาน|not\s+suitable.*work/i },
  ];
  for (const rule of workSeating) {
    const match = rule.pattern.exec(text);
    if (match) {
      patch.workSeating = rule.value;
      evidence.push({ field: "workation.workSeating", sourceText: match[0], confidence: "high" });
      break;
    }
  }
  const callMatch = /(วิดีโอคอลได้|เหมาะ.*(?:คอล|ประชุม)|video\s*calls?\s+(?:ok|suitable)|not\s+suitable.*video)/i.exec(text);
  if (callMatch) {
    patch.videoCalls = /not|ไม่เหมาะ/i.test(callMatch[0]) ? "not-suitable" : "possible";
    evidence.push({ field: "workation.videoCalls", sourceText: callMatch[0], confidence: "medium" });
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}

function findOpeningNote(rawInput: string): string | undefined {
  return /(?:วันนี้|พรุ่งนี้|วัน\S+).*(?:เปิด|ปิด)|(?:open|closed?|hours?)\b/i.test(rawInput) ? rawInput.trim() : undefined;
}

function findMenuNote(rawInput: string): string | undefined {
  return /เมนู|menu|ขนม|dessert|อาหาร|food/i.test(rawInput) ? rawInput.trim() : undefined;
}

function extractMenuItems(
  text: string,
  evidence: ExtractedFieldEvidence[],
): MerchantMenuItemPatch[] | undefined {
  const name = matchExtracted(text, [
    /(?:เพิ่มเมนู|เมนูใหม่|เมนู)\s*[:=-]?\s*([ก-๙a-z0-9][ก-๙a-z0-9\s'&+-]{1,80}?)(?=\s+(?:ราคา|แก้วละ|price)|[,.;]|$)/i,
    /เพิ่ม\s+(?!เมล็ด)([ก-๙a-z0-9][ก-๙a-z0-9\s'&+-]{1,80}?)(?=\s+(?:ราคา|แก้วละ)|[,.;]|$)/i,
    /(?:add|new)\s+(?:menu|drink)\s*[:=-]?\s*([a-z0-9][a-z0-9\s'&+-]{1,80}?)(?=\s+(?:price|thb|baht)|[,.;]|$)/i,
  ]);
  if (!name) return undefined;

  const price = extractPrice(text);
  const availability = extractAvailability(text);
  addEvidence(evidence, "menuItems[0].nameTh", name);
  addEvidence(evidence, "menuItems[0].priceThb", price);
  addEvidence(evidence, "menuItems[0].isAvailable", availability);

  return [{
    nameTh: name.value,
    ...(/^[a-z0-9\s'&+-]+$/i.test(name.value) ? { nameEn: name.value } : {}),
    ...(price ? { priceThb: price.value } : {}),
    ...(availability ? { isAvailable: availability.value !== "unavailable" } : {}),
    isCafePick: false,
  }];
}

/** Extracts only explicit or clearly labeled fields; it does not infer Nan origin. */
export function extractMerchantUpdate(rawInput: string): StructuredMerchantUpdate {
  const text = normalizeTravelerText(rawInput);
  const fieldEvidence: ExtractedFieldEvidence[] = [];
  const beanName = extractBeanName(text);
  const originName = extractOrigin(text, beanName);
  const originProvince = extractProvince(text);
  const producer = extractProducer(text);
  const process = extractProcess(text);
  const roastLevel = extractRoast(text);
  const price = extractPrice(text);
  const availability = extractAvailability(text);
  const menuItems = extractMenuItems(text, fieldEvidence);
  const hasExplicitOfferingSignal = Boolean(
    beanName || originName || originProvince || producer || process || roastLevel,
  );
  const tasting = extractTastingNotes(text, !menuItems || hasExplicitOfferingSignal);
  const brewMethods = menuItems && !hasExplicitOfferingSignal ? [] : extractBrewMethods(text);

  addEvidence(fieldEvidence, "offering.beanName", beanName);
  addEvidence(fieldEvidence, "offering.originName", originName);
  addEvidence(fieldEvidence, "offering.originProvince", originProvince);
  addEvidence(fieldEvidence, "offering.producer", producer);
  addEvidence(fieldEvidence, "offering.process", process);
  addEvidence(fieldEvidence, "offering.roastLevel", roastLevel);
  addEvidence(fieldEvidence, "offering.tastingNotes", tasting.evidence);
  for (const method of brewMethods) addEvidence(fieldEvidence, "offering.brewMethods", method);
  addEvidence(fieldEvidence, "offering.price", price);
  addEvidence(fieldEvidence, "offering.availability", availability);

  const hasOfferingData = Boolean(
    beanName || originName || originProvince || producer || process || roastLevel || tasting.notes.length || brewMethods.length || (!menuItems && (price || availability)),
  );
  const offering: MerchantOfferingPatch | undefined = hasOfferingData
    ? {
        ...(beanName ? { beanName: beanName.value } : {}),
        ...(originName ? { originName: originName.value } : {}),
        ...(originProvince ? { originProvince: originProvince.value } : {}),
        ...(producer ? { producer: producer.value } : {}),
        ...(process ? { process: process.value } : {}),
        ...(roastLevel ? { roastLevel: roastLevel.value } : {}),
        tastingNotes: tasting.notes,
        tasteProfiles: tasting.profiles,
        brewMethods: brewMethods.map((method) => method.value),
        ...(!menuItems && price ? { price: { amount: price.value, currency: "THB" } } : {}),
        ...(availability ? { availability: availability.value } : {}),
      }
    : undefined;

  const workation = extractWorkation(text, fieldEvidence);
  const menuNote = findMenuNote(rawInput);
  const openingNote = findOpeningNote(rawInput);
  const kinds: MerchantUpdateKind[] = [];
  if (offering) kinds.push("offering");
  if (menuItems || menuNote) kinds.push("menu");
  if (openingNote) kinds.push("opening-note");
  if (workation) kinds.push("workation");

  const unresolvedFields: string[] = [];
  if (offering) {
    const required: Array<[keyof MerchantOfferingPatch, string]> = [
      ["beanName", "offering.beanName"],
      ["originName", "offering.originName"],
      ["process", "offering.process"],
      ["roastLevel", "offering.roastLevel"],
      ["price", "offering.price"],
      ["availability", "offering.availability"],
    ];
    for (const [key, label] of required) if (offering[key] === undefined) unresolvedFields.push(label);
    if (offering.tastingNotes.length === 0) unresolvedFields.push("offering.tastingNotes");
    if (offering.brewMethods.length === 0) unresolvedFields.push("offering.brewMethods");
  }
  if (menuItems) {
    for (const [index, menuItem] of menuItems.entries()) {
      if (menuItem.priceThb === undefined) unresolvedFields.push(`menuItems[${index}].priceThb`);
    }
  }

  return {
    kinds,
    ...(offering ? { offering } : {}),
    ...(menuItems ? { menuItems } : {}),
    ...(menuNote ? { menuNote } : {}),
    ...(openingNote ? { openingNote } : {}),
    ...(workation ? { workation } : {}),
    fieldEvidence,
    unresolvedFields,
    extractorVersion: MERCHANT_EXTRACTOR_VERSION,
  };
}

function processLabel(process: CoffeeProcess, locale: AppLocale): string {
  const labels: Record<CoffeeProcess, LocalizedText> = {
    natural: { th: "เนเชอรัล", en: "Natural" },
    washed: { th: "วอชด์", en: "Washed" },
    honey: { th: "ฮันนี", en: "Honey" },
    anaerobic: { th: "แอนแอโรบิก", en: "Anaerobic" },
    "carbonic-maceration": { th: "คาร์บอนิก มาเซอเรชัน", en: "Carbonic maceration" },
    other: { th: "โปรเซสอื่น", en: "other process" },
    unknown: { th: "ไม่ระบุโปรเซส", en: "process not specified" },
  };
  return labels[process][locale];
}

function roastLabel(roast: RoastLevel, locale: AppLocale): string {
  const labels: Record<RoastLevel, LocalizedText> = {
    light: { th: "คั่วอ่อน", en: "light roast" },
    "medium-light": { th: "คั่วกลางอ่อน", en: "medium-light roast" },
    medium: { th: "คั่วกลาง", en: "medium roast" },
    "medium-dark": { th: "คั่วกลางเข้ม", en: "medium-dark roast" },
    dark: { th: "คั่วเข้ม", en: "dark roast" },
    unknown: { th: "ไม่ระบุระดับคั่ว", en: "roast not specified" },
  };
  return labels[roast][locale];
}

function englishName(value: string): string {
  return NAME_TRANSLATIONS[value] ?? value;
}

export function createBilingualMerchantCopy(update: StructuredMerchantUpdate, rawInput = ""): LocalizedText {
  if (update.offeringRemovals?.length) {
    const beanNames = update.offeringRemovals.map((item) => item.beanName).join(", ");
    return {
      th: `นำเมล็ด ${beanNames} ออกจากหน้าร้านหลังเจ้าของร้านอนุมัติ`,
      en: `Remove ${beanNames} from the storefront after merchant approval.`,
    };
  }

  const offering = update.offering;
  if (offering) {
    const th: string[] = [];
    const en: string[] = [];
    if (offering.availability === "available") {
      th.push("วันนี้พร้อมเสิร์ฟ");
      en.push("Available today:");
    } else if (offering.availability === "limited") {
      th.push("วันนี้มีจำนวนจำกัด");
      en.push("Limited availability today:");
    } else if (offering.availability === "unavailable") {
      th.push("ขณะนี้หมด");
      en.push("Currently unavailable:");
    }
    if (offering.beanName) {
      th.push(`เมล็ด${offering.beanName}`);
      en.push(`${englishName(offering.beanName)} coffee`);
    }
    if (offering.process) {
      th.push(`โปรเซส ${processLabel(offering.process, "th")}`);
      en.push(`${processLabel(offering.process, "en")} process`);
    }
    if (offering.roastLevel) {
      th.push(roastLabel(offering.roastLevel, "th"));
      en.push(roastLabel(offering.roastLevel, "en"));
    }
    if (offering.tastingNotes.length > 0) {
      th.push(`โทน ${offering.tastingNotes.map((note) => note.th).join(" และ ")}`);
      en.push(`notes of ${offering.tastingNotes.map((note) => note.en).join(" and ")}`);
    }
    if (offering.brewMethods.length > 0) {
      th.push(`สำหรับ ${offering.brewMethods.join(", ")}`);
      en.push(`available as ${offering.brewMethods.join(", ")}`);
    }
    if (offering.price) {
      th.push(`ราคาเริ่มต้น ${offering.price.amount} บาท`);
      en.push(`from THB ${offering.price.amount}`);
    }
    return { th: `${th.join(" · ")} — โปรดตรวจสอบก่อนอนุมัติ`, en: `${en.join(" · ")} — review before approval.` };
  }

  if (update.menuItems?.length) {
    const th = update.menuItems.map((item) =>
      `${item.nameTh}${item.priceThb !== undefined ? ` ${item.priceThb} บาท` : ""}`,
    );
    const en = update.menuItems.map((item) =>
      `${item.nameEn || item.nameTh}${item.priceThb !== undefined ? ` THB ${item.priceThb}` : ""}`,
    );
    return {
      th: `อัปเดตเมนู: ${th.join(", ")} — โปรดตรวจสอบก่อนอนุมัติ`,
      en: `Menu update: ${en.join(", ")} — review before approval.`,
    };
  }

  if (update.openingNote || update.menuNote || update.workation) {
    return {
      th: `${update.openingNote ?? update.menuNote ?? rawInput.trim()} — โปรดตรวจสอบรายละเอียดก่อนอนุมัติ`,
      en: "A merchant update was extracted, but free-form translation requires review before approval.",
    };
  }
  return {
    th: "ยังไม่พบข้อมูลที่มีโครงสร้าง โปรดแก้ไขข้อความก่อนอนุมัติ",
    en: "No structured fields were found. Edit the input before approval.",
  };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildMerchantDraftFromStructuredUpdate(
  rawInput: string,
  structuredUpdate: StructuredMerchantUpdate,
  context: MerchantDraftContext,
): MerchantDraft {
  const missingNotice: LocalizedText | undefined = structuredUpdate.unresolvedFields.length
    ? {
        th: `ข้อมูลที่ยังต้องยืนยัน: ${structuredUpdate.unresolvedFields.join(", ")}`,
        en: `Fields still requiring confirmation: ${structuredUpdate.unresolvedFields.join(", ")}.`,
      }
    : undefined;
  const sourceImages = [...(context.sourceImages ?? [])];
  const generation = context.generation ?? {
    provider: "rules",
    promptVersion: MERCHANT_EXTRACTOR_VERSION,
    imageAnalysis: sourceImages.length > 0 ? "not-supported" : "not-provided",
  } satisfies MerchantDraftGeneration;
  const imageNotice: LocalizedText | undefined = generation.imageAnalysis === "not-supported"
    ? {
        th: "โหมดกฎบนเครื่องแนบรูปไว้เป็นหลักฐาน แต่ยังไม่ได้อ่านข้อความภายในรูป โปรดใส่คำอธิบายประกอบ",
        en: "Local rules keep the image as evidence but do not read its contents; add a text description.",
      }
    : undefined;

  return {
    id: context.draftId ?? `draft-${stableHash(`${context.cafeId}\u0000${rawInput}`)}`,
    cafeId: context.cafeId,
    ownerProfileId: context.ownerProfileId,
    rawInput,
    inputMethod: context.inputMethod ?? "text",
    sourceImages,
    inputLanguage: detectLanguage(rawInput),
    structuredUpdate,
    copy: createBilingualMerchantCopy(structuredUpdate, rawInput),
    status: "draft",
    requiresExplicitApproval: true,
    createdAt: context.createdAt,
    generation,
    safetyNotices: [
      {
        th: "เนื้อหานี้ยังไม่เผยแพร่ การเปลี่ยนแปลงสาธารณะต้องได้รับอนุมัติจากเจ้าของร้านอย่างชัดเจน",
        en: "This content is not public. Public changes require explicit merchant approval.",
      },
      ...(missingNotice ? [missingNotice] : []),
      ...(imageNotice ? [imageNotice] : []),
    ],
  };
}

export function buildMerchantDraft(rawInput: string, context: MerchantDraftContext): MerchantDraft {
  return buildMerchantDraftFromStructuredUpdate(rawInput, extractMerchantUpdate(rawInput), context);
}

export function approveMerchantDraft(draft: MerchantDraft, review: MerchantDraftReview): MerchantDraft {
  if (draft.status !== "draft") throw new Error(`Only a draft can be approved; received ${draft.status}.`);
  if (review.profileId !== draft.ownerProfileId) throw new Error("Only the owning merchant can approve this draft.");
  return {
    ...draft,
    status: "approved",
    reviewedAt: review.reviewedAt,
    reviewedByProfileId: review.profileId,
    ...(review.note ? { reviewNote: review.note } : {}),
  };
}

export function rejectMerchantDraft(draft: MerchantDraft, review: MerchantDraftReview): MerchantDraft {
  if (draft.status !== "draft") throw new Error(`Only a draft can be rejected; received ${draft.status}.`);
  if (review.profileId !== draft.ownerProfileId) throw new Error("Only the owning merchant can reject this draft.");
  return {
    ...draft,
    status: "rejected",
    reviewedAt: review.reviewedAt,
    reviewedByProfileId: review.profileId,
    ...(review.note ? { reviewNote: review.note } : {}),
  };
}
