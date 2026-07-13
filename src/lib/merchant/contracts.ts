import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string().trim().min(1).max(160),
  en: z.string().trim().min(1).max(160),
}).strict();

const locationSchema = z.object({
  province: z.string().trim().min(1).max(120).optional(),
  locality: z.string().trim().min(1).max(160).optional(),
}).strict();

export const merchantOfferingPatchSchema = z.object({
  beanName: z.string().trim().min(1).max(160).optional(),
  originProvince: z.string().trim().min(1).max(120).optional(),
  originName: z.string().trim().min(1).max(160).optional(),
  producer: z.string().trim().min(1).max(160).optional(),
  altitudeMeters: z.object({
    min: z.number().int().min(0).max(5000),
    max: z.number().int().min(0).max(5000),
  }).strict().refine((value) => value.max >= value.min, "Altitude max must be at least min").optional(),
  varietal: z.string().trim().min(1).max(120).optional(),
  process: z.enum(["natural", "washed", "honey", "anaerobic", "carbonic-maceration", "other", "unknown"]).optional(),
  processingLocation: locationSchema.optional(),
  roastLevel: z.enum(["light", "medium-light", "medium", "medium-dark", "dark", "unknown"]).optional(),
  roasterLocation: locationSchema.optional(),
  tastingNotes: z.array(localizedTextSchema).max(12),
  tasteProfiles: z.array(z.enum(["fruity", "chocolatey", "floral", "nutty", "caramel", "tea-like", "bright"])).max(7),
  brewMethods: z.array(z.enum(["filter", "espresso", "aeropress", "cold-brew", "mokapot", "other"])).max(6),
  price: z.object({
    amount: z.number().min(0).max(100000),
    currency: z.literal("THB"),
  }).strict().optional(),
  availability: z.enum(["available", "limited", "unavailable", "unknown"]).optional(),
}).strict();

export const merchantOfferingRemovalSchema = z.object({
  offeringId: z.string().trim().min(1).max(160).optional(),
  beanName: z.string().trim().min(1).max(160),
  reason: z.literal("sold-out"),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
}).strict();

export const merchantMenuItemPatchSchema = z.object({
  id: z.string().uuid().optional(),
  nameTh: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160).optional(),
  descriptionTh: z.string().trim().max(1000).optional(),
  descriptionEn: z.string().trim().max(1000).optional(),
  priceThb: z.number().min(0).max(100000).optional(),
  isAvailable: z.boolean().optional(),
  isCafePick: z.boolean().optional(),
  usesFeaturedSingleOrigin: z.boolean().optional(),
}).strict();

export const merchantWorkationPatchSchema = z.object({
  wifi: z.enum(["available", "unavailable", "unknown"]).optional(),
  downloadMbps: z.number().min(0).max(100000).optional(),
  uploadMbps: z.number().min(0).max(100000).optional(),
  pingMs: z.number().min(0).max(60000).optional(),
  outlets: z.enum(["at-most-seats", "some", "none", "unknown"]).optional(),
  workSeating: z.enum(["good", "possible", "not-suitable", "unknown"]).optional(),
  videoCalls: z.enum(["good", "possible", "not-suitable", "unknown"]).optional(),
  policyText: z.string().trim().max(1000).optional(),
}).strict();

const fieldEvidenceSchema = z.object({
  field: z.string().trim().min(1).max(160),
  sourceText: z.string().trim().min(1).max(1000),
  confidence: z.enum(["high", "medium", "low"]),
}).strict();

export const merchantAIUpdateSchema = z.object({
  kinds: z.array(z.enum(["offering", "menu", "opening-note", "workation"])).max(4),
  offering: merchantOfferingPatchSchema.optional(),
  menuItems: z.array(merchantMenuItemPatchSchema).max(8).optional(),
  menuNote: z.string().trim().max(2000).optional(),
  openingNote: z.string().trim().max(2000).optional(),
  workation: merchantWorkationPatchSchema.optional(),
  fieldEvidence: z.array(fieldEvidenceSchema).max(40),
  unresolvedFields: z.array(z.string().trim().min(1).max(160)).max(40),
}).strict();

const merchantAILocalizedTextSchema = z.object({
  th: z.string(),
  en: z.string(),
}).strict();

const merchantAILocationSchema = z.object({
  province: z.string().nullable(),
  locality: z.string().nullable(),
}).strict();

const merchantAIPriceSchema = z.object({
  amount: merchantOfferingPatchSchema.shape.price.unwrap().shape.amount,
  currency: z.enum(["THB"]),
}).strict();

const merchantAIOfferingPatchSchema = z.object({
  beanName: z.string().nullable(),
  originProvince: z.string().nullable(),
  originName: z.string().nullable(),
  producer: z.string().nullable(),
  altitudeMeters: merchantOfferingPatchSchema.shape.altitudeMeters.unwrap().nullable(),
  varietal: z.string().nullable(),
  process: merchantOfferingPatchSchema.shape.process.unwrap().nullable(),
  processingLocation: merchantAILocationSchema.nullable(),
  roastLevel: merchantOfferingPatchSchema.shape.roastLevel.unwrap().nullable(),
  roasterLocation: merchantAILocationSchema.nullable(),
  tastingNotes: z.array(merchantAILocalizedTextSchema).max(12),
  tasteProfiles: merchantOfferingPatchSchema.shape.tasteProfiles,
  brewMethods: merchantOfferingPatchSchema.shape.brewMethods,
  price: merchantAIPriceSchema.nullable(),
  availability: merchantOfferingPatchSchema.shape.availability.unwrap().nullable(),
}).strict();

const merchantAIMenuItemPatchSchema = z.object({
  id: z.string().nullable(),
  nameTh: z.string(),
  nameEn: z.string().nullable(),
  descriptionTh: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  priceThb: merchantMenuItemPatchSchema.shape.priceThb.unwrap().nullable(),
  isAvailable: z.boolean().nullable(),
  isCafePick: z.boolean().nullable(),
  usesFeaturedSingleOrigin: z.boolean().nullable(),
}).strict();

const merchantAIWorkationPatchSchema = z.object({
  wifi: merchantWorkationPatchSchema.shape.wifi.unwrap().nullable(),
  downloadMbps: merchantWorkationPatchSchema.shape.downloadMbps.unwrap().nullable(),
  uploadMbps: merchantWorkationPatchSchema.shape.uploadMbps.unwrap().nullable(),
  pingMs: merchantWorkationPatchSchema.shape.pingMs.unwrap().nullable(),
  outlets: merchantWorkationPatchSchema.shape.outlets.unwrap().nullable(),
  workSeating: merchantWorkationPatchSchema.shape.workSeating.unwrap().nullable(),
  videoCalls: merchantWorkationPatchSchema.shape.videoCalls.unwrap().nullable(),
  policyText: z.string().nullable(),
}).strict();

const merchantAIFieldEvidenceSchema = z.object({
  field: z.string(),
  sourceText: z.string(),
  confidence: fieldEvidenceSchema.shape.confidence,
}).strict();

/**
 * Wire contract for OpenAI strict Structured Outputs. Every object property is
 * required; fields that are optional in the domain contract use null instead.
 * Domain-only string constraints are intentionally enforced after normalization.
 */
export const merchantAIResponseSchema = z.object({
  kinds: merchantAIUpdateSchema.shape.kinds,
  offering: merchantAIOfferingPatchSchema.nullable(),
  menuItems: z.array(merchantAIMenuItemPatchSchema).max(8).nullable(),
  menuNote: z.string().nullable(),
  openingNote: z.string().nullable(),
  workation: merchantAIWorkationPatchSchema.nullable(),
  fieldEvidence: z.array(merchantAIFieldEvidenceSchema).max(40),
  unresolvedFields: z.array(z.string()).max(40),
}).strict();

function cleanAIString(value: string | null) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function cleanAILocation(
  value: z.infer<typeof merchantAILocationSchema> | null,
) {
  if (!value) return null;
  const province = cleanAIString(value.province);
  const locality = cleanAIString(value.locality);
  return province || locality ? { province, locality } : null;
}

function prepareMerchantAIResponseForDomain(
  response: z.infer<typeof merchantAIResponseSchema>,
) {
  const offeringCandidate = response.offering
    ? {
        ...response.offering,
        beanName: cleanAIString(response.offering.beanName),
        originProvince: cleanAIString(response.offering.originProvince),
        originName: cleanAIString(response.offering.originName),
        producer: cleanAIString(response.offering.producer),
        varietal: cleanAIString(response.offering.varietal),
        processingLocation: cleanAILocation(response.offering.processingLocation),
        roasterLocation: cleanAILocation(response.offering.roasterLocation),
        tastingNotes: response.offering.tastingNotes.flatMap((note) => {
          const th = note.th.trim();
          const en = note.en.trim();
          const availableText = th || en;
          return availableText
            ? [{ th: th || availableText, en: en || availableText }]
            : [];
        }),
      }
    : null;
  const offering = offeringCandidate && (
    offeringCandidate.beanName
    || offeringCandidate.originProvince
    || offeringCandidate.originName
    || offeringCandidate.producer
    || offeringCandidate.altitudeMeters
    || offeringCandidate.varietal
    || offeringCandidate.process
    || offeringCandidate.processingLocation
    || offeringCandidate.roastLevel
    || offeringCandidate.roasterLocation
    || offeringCandidate.tastingNotes.length
    || offeringCandidate.tasteProfiles.length
    || offeringCandidate.brewMethods.length
    || offeringCandidate.price
    || offeringCandidate.availability
  ) ? offeringCandidate : null;

  const menuItems = response.menuItems?.flatMap((item) => {
    const nameTh = item.nameTh.trim();
    const nameEn = cleanAIString(item.nameEn);
    const availableName = nameTh || nameEn;
    if (!availableName) return [];

    const candidateId = cleanAIString(item.id);
    const id = candidateId && z.string().uuid().safeParse(candidateId).success
      ? candidateId
      : null;

    return [{
      ...item,
      id,
      nameTh: nameTh || availableName,
      nameEn,
      descriptionTh: cleanAIString(item.descriptionTh),
      descriptionEn: cleanAIString(item.descriptionEn),
    }];
  }) ?? null;

  const workationCandidate = response.workation
    ? { ...response.workation, policyText: cleanAIString(response.workation.policyText) }
    : null;
  const workation = workationCandidate
    && Object.values(workationCandidate).some((item) => item !== null)
    ? workationCandidate
    : null;

  return {
    ...response,
    offering,
    menuItems,
    menuNote: cleanAIString(response.menuNote),
    openingNote: cleanAIString(response.openingNote),
    workation,
    fieldEvidence: response.fieldEvidence
      .map((evidence) => ({
        ...evidence,
        field: evidence.field.trim(),
        sourceText: evidence.sourceText.trim(),
      }))
      .filter((evidence) => evidence.field && evidence.sourceText),
    unresolvedFields: response.unresolvedFields
      .map((field) => field.trim())
      .filter(Boolean),
  };
}

function omitNullProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNullProperties);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null)
      .map(([key, item]) => [key, omitNullProperties(item)]),
  );
}

export function normalizeMerchantAIResponse(value: unknown) {
  const response = merchantAIResponseSchema.parse(value);
  const prepared = prepareMerchantAIResponseForDomain(response);
  return merchantAIUpdateSchema.parse(omitNullProperties(prepared));
}

export const structuredMerchantUpdateSchema = merchantAIUpdateSchema.extend({
  offeringRemovals: z.array(merchantOfferingRemovalSchema).max(4).optional(),
  extractorVersion: z.string().trim().min(1).max(120),
}).strict().superRefine((value, context) => {
  if (value.offering && value.offeringRemovals?.length) {
    context.addIssue({
      code: "custom",
      path: ["offeringRemovals"],
      message: "A draft cannot update and remove a Single Origin bean at the same time",
    });
  }
  if (value.menuItems?.length && value.offeringRemovals?.length) {
    context.addIssue({
      code: "custom",
      path: ["offeringRemovals"],
      message: "A removal draft cannot also edit menu items",
    });
  }
  if (value.offeringRemovals?.length && (value.openingNote !== undefined || value.workation)) {
    context.addIssue({
      code: "custom",
      path: ["offeringRemovals"],
      message: "A removal draft cannot also edit opening or Workation information",
    });
  }
  if (
    value.offeringRemovals?.length
    && (value.kinds.length !== 1 || value.kinds[0] !== "offering")
  ) {
    context.addIssue({
      code: "custom",
      path: ["kinds"],
      message: "A removal-only draft must use the offering update kind",
    });
  }

  const seen = new Set<string>();
  value.offeringRemovals?.forEach((removal, index) => {
    const key = removal.offeringId
      ? `id:${removal.offeringId}`
      : `name:${removal.beanName.normalize("NFC").toLocaleLowerCase("th-TH")}`;
    if (seen.has(key)) {
      context.addIssue({
        code: "custom",
        path: ["offeringRemovals", index],
        message: "The same Single Origin bean cannot be removed twice",
      });
    }
    seen.add(key);
  });
});

export const merchantSourceImageSchema = z.object({
  name: z.string().trim().min(1).max(180),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().min(1).max(2 * 1024 * 1024),
}).strict();

export const merchantImageInputSchema = merchantSourceImageSchema.extend({
  dataUrl: z.string().max(3 * 1024 * 1024).refine(
    (value) => /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value),
    "Invalid image data URL",
  ),
}).strict().superRefine((value, context) => {
  const encodedMediaType = /^data:(image\/(?:jpeg|png|webp));base64,/i.exec(value.dataUrl)?.[1]?.toLowerCase();
  if (encodedMediaType !== value.mediaType) {
    context.addIssue({
      code: "custom",
      path: ["dataUrl"],
      message: "Image data URL type must match mediaType",
    });
  }
});

export const merchantDraftGenerationSchema = z.object({
  // Keep accepting legacy Gateway provenance when an older canonical draft is
  // reviewed after the runtime has moved to direct OpenAI access.
  provider: z.enum(["rules", "ai-gateway", "openai-direct"]),
  promptVersion: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160).optional(),
  imageAnalysis: z.enum(["not-provided", "processed", "not-supported"]),
}).strict();

export const merchantDraftSchema = z.object({
  id: z.string().min(1).max(160),
  cafeId: z.string().min(1).max(160),
  ownerProfileId: z.string().min(1).max(160),
  rawInput: z.string().max(5000),
  inputMethod: z.enum(["text", "voice_transcript", "photo", "multimodal", "demo"]),
  sourceImages: z.array(merchantSourceImageSchema).max(1),
  inputLanguage: z.enum(["th", "en", "mixed", "unknown"]),
  structuredUpdate: structuredMerchantUpdateSchema,
  copy: z.object({ th: z.string().max(5000), en: z.string().max(5000) }).strict(),
  status: z.enum(["draft", "approved", "rejected"]),
  requiresExplicitApproval: z.literal(true),
  createdAt: z.string(),
  generation: merchantDraftGenerationSchema,
  reviewedAt: z.string().optional(),
  reviewedByProfileId: z.string().optional(),
  reviewNote: z.string().optional(),
  safetyNotices: z.array(z.object({ th: z.string(), en: z.string() }).strict()).max(20),
}).strict();

export const merchantDraftRequestSchema = z.object({
  cafeId: z.string().min(1).max(120),
  rawInput: z.string().trim().max(5000).default(""),
  inputMethod: z.enum(["text", "voice_transcript", "photo", "multimodal", "demo"]).default("text"),
  image: merchantImageInputSchema.optional(),
}).strict().superRefine((value, context) => {
  const hasText = value.rawInput.length >= 5;
  const hasAnyText = value.rawInput.length > 0;
  const hasImage = Boolean(value.image);
  if (!hasText && !hasImage) {
    context.addIssue({
      code: "custom",
      path: ["rawInput"],
      message: "Add at least five characters or one supported image",
    });
  }

  const expectedMethod = hasImage ? (hasAnyText ? "multimodal" : "photo") : value.inputMethod;
  if (hasImage && value.inputMethod !== expectedMethod) {
    context.addIssue({
      code: "custom",
      path: ["inputMethod"],
      message: `Input method must be ${expectedMethod} for the submitted media`,
    });
  }
  if (!hasImage && (value.inputMethod === "photo" || value.inputMethod === "multimodal")) {
    context.addIssue({
      code: "custom",
      path: ["image"],
      message: "Photo and multimodal input methods require an image",
    });
  }
});

export const merchantOfferingRemovalDraftRequestSchema = z.object({
  cafeId: z.string().trim().min(1).max(120),
  offeringId: z.string().trim().min(1).max(160).optional(),
  beanName: z.string().trim().min(1).max(160),
}).strict();
