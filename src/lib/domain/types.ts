/**
 * Framework-agnostic domain contracts for Nan Coffee, Please.
 *
 * A note about trust: `fictional-demo` is deliberately a first-class provenance
 * value. Consumers must show its label and must never render those records as
 * verified facts about a real business or place.
 */

export type ISODateTime = string;
export type CurrencyCode = "THB";
export type AppLocale = "th" | "en";
export type DetectedLanguage = AppLocale | "mixed" | "unknown";

export interface LocalizedText {
  th: string;
  en: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type ProvenanceKind =
  | "fictional-demo"
  | "merchant-declared"
  | "community-report"
  | "official-source"
  | "partner-source";

export interface SourceReference {
  label: string;
  url: string;
  role: "primary-context" | "coordinate-corroboration" | "merchant-input" | "other";
}

export interface DataProvenance {
  kind: ProvenanceKind;
  /** Always render this near user-facing facts derived from this record. */
  displayLabel: LocalizedText;
  sourceName: string;
  sourceUrl?: string;
  additionalSources?: SourceReference[];
  capturedAt: ISODateTime;
  verifiedAt?: ISODateTime;
  isFictional: boolean;
  disclaimer?: LocalizedText;
}

export type VerificationStatus =
  | "demo-only"
  | "unverified"
  | "merchant-declared"
  | "community-verified"
  | "partner-verified"
  | "official-verified";

export type CafeBadge =
  | "nan-grown-beans"
  | "nan-roasted"
  | "workation-friendly"
  | "new-discovery";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface OpeningInterval {
  opensAt: string;
  closesAt: string;
}

export interface DailyOpeningHours {
  day: DayOfWeek;
  intervals: OpeningInterval[];
  note?: LocalizedText;
}

/** A stored schedule or snapshot, never an assertion of live opening status. */
export interface OpeningContext {
  timezone: "Asia/Bangkok";
  weeklyHours: DailyOpeningHours[];
  snapshotStatus: "scheduled-open" | "scheduled-closed" | "unknown";
  statusAsOf: ISODateTime;
  statusBasis: "demo-snapshot" | "merchant-declared" | "verified-source";
  note: LocalizedText;
}

export type TransportMode =
  | "walk"
  | "bicycle"
  | "motorcycle"
  | "car"
  | "public-transport"
  | "unknown";

export interface RouteEstimate {
  anchorId: string;
  anchorName: LocalizedText;
  transport: Exclude<TransportMode, "unknown">;
  estimatedMinutes: number;
  estimatedDistanceKm?: number;
  provenance: DataProvenance;
}

export type CoffeeProcess =
  | "natural"
  | "washed"
  | "honey"
  | "anaerobic"
  | "carbonic-maceration"
  | "other"
  | "unknown";

export type RoastLevel = "light" | "medium-light" | "medium" | "medium-dark" | "dark" | "unknown";

export type BrewMethod =
  | "filter"
  | "espresso"
  | "aeropress"
  | "cold-brew"
  | "mokapot"
  | "other";

export type TasteProfile =
  | "fruity"
  | "chocolatey"
  | "floral"
  | "nutty"
  | "caramel"
  | "tea-like"
  | "bright";

export type OfferingAvailabilityStatus = "available" | "limited" | "unavailable" | "unknown";

export interface OfferingAvailability {
  status: OfferingAvailabilityStatus;
  asOf: ISODateTime;
  note: LocalizedText;
  provenance: DataProvenance;
}

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface CoffeeOrigin {
  country: string;
  province?: string;
  locality?: string;
  farmOrCommunity?: string;
  producer?: string;
}

export interface CoffeeOffering {
  id: string;
  cafeId: string;
  name: LocalizedText;
  origin: CoffeeOrigin;
  process: CoffeeProcess;
  roastLevel: RoastLevel;
  tastingNotes: LocalizedText[];
  tasteProfiles: TasteProfile[];
  brewMethods: BrewMethod[];
  priceFrom: Money;
  availability: OfferingAvailability;
  approvedForPublic: boolean;
  updatedAt: ISODateTime;
  provenance: DataProvenance;
}

export interface MenuItem {
  id: string;
  cafeId: string;
  name: LocalizedText;
  description: LocalizedText;
  price: Money;
  availability: OfferingAvailability;
  isCafePick: boolean;
  approvedForPublic: boolean;
  provenance: DataProvenance;
}

export type WifiAvailability = "available" | "unavailable" | "unknown";
export type OutletAvailability = "at-most-seats" | "some" | "none" | "unknown";
export type SuitabilityLevel = "good" | "possible" | "not-suitable" | "unknown";
export type QuietnessLevel = "quiet" | "mixed" | "lively" | "unknown";
export type SpeedReportTrust = "merchant-reported" | "community-verified";

export interface InternetSpeedReport {
  id: string;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  testedAt: ISODateTime;
  trust: SpeedReportTrust;
  verificationStatus: VerificationStatus;
  /** Required wording prevents a merchant report being presented as a guarantee. */
  nonGuaranteeNotice: LocalizedText;
  provenance: DataProvenance;
}

export interface WorkationDetails {
  cafeId: string;
  wifi: {
    availability: WifiAvailability;
    declaredAt: ISODateTime;
    trustLabel: "wifi-available" | "wifi-unavailable" | "wifi-unknown";
    provenance: DataProvenance;
  };
  speedReports: InternetSpeedReport[];
  outlets: OutletAvailability;
  workSeating: SuitabilityLevel;
  videoCalls: SuitabilityLevel;
  quietness: QuietnessLevel;
  policy: LocalizedText;
  minimumSpend?: Money;
  communityWorkVerifiedAt?: ISODateTime;
  updatedAt: ISODateTime;
  provenance: DataProvenance;
}

export type CafeHighlightKind = "cafe-pick" | "traveler-favorite";

export interface CafeHighlight {
  kind: CafeHighlightKind;
  offeringOrMenuItemId: string;
  explanation: LocalizedText;
  /** Demo records use `fictional-demo-scenario`, never a real popularity claim. */
  source: "merchant" | "verified-review-aggregate" | "fictional-demo-scenario";
  provenance: DataProvenance;
}

export interface Cafe {
  id: string;
  slug: string;
  name: LocalizedText;
  story: LocalizedText;
  address: LocalizedText;
  areaId: string;
  coordinates: GeoPoint;
  opening: OpeningContext;
  badges: CafeBadge[];
  recommendedVisitMinutes: number;
  routeEstimates: RouteEstimate[];
  offerings: CoffeeOffering[];
  menu: MenuItem[];
  workation?: WorkationDetails;
  highlights: CafeHighlight[];
  directionsUrl?: string;
  published: boolean;
  updatedAt: ISODateTime;
  provenance: DataProvenance;
}

export type UnseenCategory =
  | "local-food"
  | "culture"
  | "craft"
  | "scenic-point"
  | "gentle-nature"
  | "community-experience";

export interface UnseenPlace {
  id: string;
  name: LocalizedText;
  category: UnseenCategory;
  description: LocalizedText;
  coordinates: GeoPoint;
  openingOrAccessContext: LocalizedText;
  weatherOrAccessNotes: LocalizedText;
  verificationStatus: VerificationStatus;
  provenance: DataProvenance;
}

export interface CafeUnseenLink {
  cafeId: string;
  unseenPlaceId: string;
  travelMinutes: number;
  transport: Exclude<TransportMode, "unknown">;
  distanceKm?: number;
  approvedForPublic: boolean;
  provenance: DataProvenance;
}

export type TravelerEntryMode = "ai-plan" | "existing-plan" | "near-me";
export type TravelerUseCase = "work" | "photos" | "quick-takeaway" | "relax";

export interface PlaceReference {
  id?: string;
  name: LocalizedText;
  rawText: string;
  coordinates?: GeoPoint;
}

export interface ConsentedLocation {
  consent: "granted" | "denied" | "not-requested";
  coordinates?: GeoPoint;
  accuracyMeters?: number;
}

export type ParsedTravelerField =
  | "entryMode"
  | "startPoint"
  | "destinations"
  | "availableTimeMinutes"
  | "transport"
  | "tasteProfiles"
  | "roastLevels"
  | "brewMethods"
  | "useCases"
  | "wantsUnseen"
  | "location";

export type ParseConfidence = "high" | "medium" | "low" | "missing";

export interface TravelerParseNotice {
  code:
    | "missing-start-point"
    | "missing-time"
    | "missing-transport"
    | "location-consent-required"
    | "location-unavailable"
    | "ambiguous-place"
    | "confirmation-required";
  severity: "info" | "warning";
  message: LocalizedText;
}

export interface ParsedTravelerRequest {
  originalText: string;
  normalizedText: string;
  detectedLanguage: DetectedLanguage;
  entryMode: TravelerEntryMode;
  startPoint?: PlaceReference;
  destinations: PlaceReference[];
  availableTimeMinutes?: number;
  transport: TransportMode;
  tasteProfiles: TasteProfile[];
  roastLevels: RoastLevel[];
  brewMethods: BrewMethod[];
  useCases: TravelerUseCase[];
  workDurationMinutes?: number;
  wantsUnseen: boolean;
  location: ConsentedLocation;
  confidence: Record<ParsedTravelerField, ParseConfidence>;
  notices: TravelerParseNotice[];
  /** Parsing never skips the product's confirmation/edit step. */
  confirmationRequired: true;
  parserVersion: string;
}

export type ScoreComponentKey =
  | "route-area-fit"
  | "time-fit"
  | "taste-fit"
  | "detour-fit"
  | "availability"
  | "badges"
  | "workation-fit";

export interface ScoreComponent {
  key: ScoreComponentKey;
  score: number;
  maxScore: number;
  reason: LocalizedText;
  evidenceIds: string[];
}

export interface ScoreBreakdown {
  total: number;
  maxTotal: 100;
  components: ScoreComponent[];
  algorithmVersion: string;
}

export interface RankedCafe {
  rank: number;
  cafe: Cafe;
  score: ScoreBreakdown;
  summary: LocalizedText;
  whyThisFits: LocalizedText[];
  cautions: LocalizedText[];
  matchedOfferingIds: string[];
  detourEstimate?: RouteEstimate;
  unseenNearbyIds: string[];
}

export type MerchantUpdateKind = "offering" | "menu" | "opening-note" | "workation";
export type MerchantInputMethod = "text" | "voice_transcript" | "photo" | "multimodal" | "demo";
/**
 * Persisted generation provenance. `ai-gateway` remains readable for drafts
 * created before the production runtime switched to direct OpenAI access.
 */
export type MerchantDraftProvider = "rules" | "ai-gateway" | "openai-direct";
export type MerchantDraftProviderMode = "rules" | "openai-direct";

export interface ExtractedFieldEvidence {
  field: string;
  sourceText: string;
  confidence: ParseConfidence;
}

export interface MerchantOfferingPatch {
  beanName?: string;
  originProvince?: string;
  originName?: string;
  producer?: string;
  altitudeMeters?: {
    min: number;
    max: number;
  };
  varietal?: string;
  process?: CoffeeProcess;
  processingLocation?: {
    province?: string;
    locality?: string;
  };
  roastLevel?: RoastLevel;
  roasterLocation?: {
    province?: string;
    locality?: string;
  };
  tastingNotes: LocalizedText[];
  tasteProfiles: TasteProfile[];
  brewMethods: BrewMethod[];
  price?: Money;
  availability?: OfferingAvailabilityStatus;
}

export interface MerchantOfferingRemoval {
  /** Required for persisted rows; demo-only browser drafts may fall back to beanName. */
  offeringId?: string;
  beanName: string;
  reason: "sold-out";
  expectedUpdatedAt?: ISODateTime;
}

export interface MerchantMenuItemPatch {
  id?: string;
  nameTh: string;
  nameEn?: string;
  descriptionTh?: string;
  descriptionEn?: string;
  priceThb?: number;
  isAvailable?: boolean;
  isCafePick?: boolean;
  usesFeaturedSingleOrigin?: boolean;
}

export interface MerchantWorkationPatch {
  wifi?: WifiAvailability;
  downloadMbps?: number;
  uploadMbps?: number;
  pingMs?: number;
  outlets?: OutletAvailability;
  workSeating?: SuitabilityLevel;
  videoCalls?: SuitabilityLevel;
  policyText?: string;
}

export interface StructuredMerchantUpdate {
  kinds: MerchantUpdateKind[];
  offering?: MerchantOfferingPatch;
  offeringRemovals?: MerchantOfferingRemoval[];
  menuItems?: MerchantMenuItemPatch[];
  menuNote?: string;
  openingNote?: string;
  workation?: MerchantWorkationPatch;
  fieldEvidence: ExtractedFieldEvidence[];
  unresolvedFields: string[];
  extractorVersion: string;
}

export interface MerchantSourceImage {
  name: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
}

export interface MerchantDraftGeneration {
  provider: MerchantDraftProvider;
  promptVersion: string;
  model?: string;
  imageAnalysis: "not-provided" | "processed" | "not-supported";
}

export type MerchantDraftStatus = "draft" | "approved" | "rejected";

export interface MerchantDraft {
  id: string;
  cafeId: string;
  ownerProfileId: string;
  rawInput: string;
  inputMethod: MerchantInputMethod;
  sourceImages: MerchantSourceImage[];
  inputLanguage: DetectedLanguage;
  structuredUpdate: StructuredMerchantUpdate;
  copy: LocalizedText;
  status: MerchantDraftStatus;
  requiresExplicitApproval: true;
  createdAt: ISODateTime;
  generation: MerchantDraftGeneration;
  reviewedAt?: ISODateTime;
  reviewedByProfileId?: string;
  reviewNote?: string;
  safetyNotices: LocalizedText[];
}

export type CafeOwnershipStatus = "pending" | "active" | "suspended";
export type CafeOwnerPermission = "edit-profile" | "submit-drafts" | "approve-own-drafts";

export interface CafeOwnership {
  cafeId: string;
  merchantProfileId: string;
  status: CafeOwnershipStatus;
  permissions: CafeOwnerPermission[];
  claimedAt: ISODateTime;
  approvedAt?: ISODateTime;
}

export type CheckInVerificationMethod = "qr" | "location" | "demo";
export type CheckInVerificationState = "pending" | "verified" | "rejected";

export interface CheckIn {
  id: string;
  travelerProfileId: string;
  cafeId: string;
  verificationMethod: CheckInVerificationMethod;
  verificationState: CheckInVerificationState;
  checkedInAt: ISODateTime;
  verifiedAt?: ISODateTime;
  /** Coordinates should be discarded after verification; do not store them here. */
  privacyNote: LocalizedText;
  provenance: DataProvenance;
}

export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewModerationStatus = "pending" | "published" | "flagged" | "removed";

export interface ReviewRatings {
  coffeeQuality: Rating;
  beanStory: Rating;
  service: Rating;
  value: Rating;
  atmosphere: Rating;
  workSuitability?: Rating;
}

export interface Review {
  id: string;
  travelerProfileId: string;
  cafeId: string;
  checkInId: string;
  verifiedVisit: boolean;
  ratings: ReviewRatings;
  originalBody?: string;
  originalLanguage?: AppLocale;
  translatedBody?: string;
  translationLanguage?: AppLocale;
  moderationStatus: ReviewModerationStatus;
  createdAt: ISODateTime;
  merchantResponse?: string;
  reportedAt?: ISODateTime;
  provenance: DataProvenance;
}
