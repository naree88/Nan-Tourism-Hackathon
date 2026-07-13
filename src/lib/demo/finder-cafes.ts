import type {
  BrewMethod,
  Cafe,
  CafeBadge,
  CoffeeProcess,
  LocalizedText,
  RoastLevel,
  TasteProfile,
} from "../domain/types";
import { demoCafes } from "./data";

export type FinderCafeRecord = {
  cafe: Cafe;
  unseenNearby: string;
};

type FinderProcess = Extract<
  CoffeeProcess,
  "natural" | "washed" | "honey" | "anaerobic" | "carbonic-maceration"
>;
type FinderTaste = Extract<TasteProfile, "nutty" | "floral" | "fruity">;
type FinderRoast = Extract<RoastLevel, "light" | "medium" | "dark">;

export type FinderCafeSpec = {
  name: string;
  latitude: number;
  longitude: number;
  unseenNearby: string;
  beanName: LocalizedText;
  originProvince: string;
  originLocality: string;
  producerOrCommunity: LocalizedText;
  altitudeMeters: readonly [number, number];
  varietal: string;
  process: FinderProcess;
  processingProvince: string;
  processingLocality: string;
  taste: FinderTaste;
  tastingNotes: readonly LocalizedText[];
  roast: FinderRoast;
  roasterProvince: string;
  roasterLocality: string;
  brewMethods: readonly BrewMethod[];
  nanGrown: boolean;
  nanRoasted: boolean;
  workation: boolean;
  internet?: {
    downloadMbps: number;
    uploadMbps: number;
    pingMs: number;
  };
};

const text = (th: string, en: string): LocalizedText => ({ th, en });
const notes = (...values: readonly [string, string][]): LocalizedText[] =>
  values.map(([th, en]) => text(th, en));

/**
 * Cafe names and pins are fictional. Coffee geography uses real Nan growing,
 * processing, and roasting areas from the project reference; specific cafe-to-
 * producer trading relationships remain demo scenarios.
 */
export const finderCafeSpecs: readonly FinderCafeSpec[] = [
  {
    name: "ฟองคำ คอฟฟี่พอยต์",
    latitude: 18.790155412923813,
    longitude: 100.78530678254457,
    unseenNearby: "โฮงเจ้าฟองคำ",
    beanName: text("ห้วยโทน จาวา เนเชอรัล 01", "Huai Ton Java Natural 01"),
    originProvince: "น่าน",
    originLocality: "บ้านห้วยโทน อำเภอบ่อเกลือ",
    producerOrCommunity: text("กลุ่มผู้ปลูกกาแฟบ้านห้วยโทน", "Ban Huai Ton coffee growers"),
    altitudeMeters: [1_200, 1_400],
    varietal: "Java",
    process: "natural",
    processingProvince: "น่าน",
    processingLocality: "บ้านห้วยโทน อำเภอบ่อเกลือ",
    taste: "fruity",
    tastingNotes: notes(["ส้มแมนดาริน", "mandarin orange"], ["สตรอว์เบอร์รี", "strawberry"], ["น้ำผึ้ง", "honey"]),
    roast: "light",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "cold-brew"],
    nanGrown: true,
    nanRoasted: false,
    workation: true,
    internet: { downloadMbps: 86, uploadMbps: 42, pingMs: 18 },
  },
  {
    name: "ช้างเผือก บรูว์สต็อป",
    latitude: 18.79321656620621,
    longitude: 100.78141541790892,
    unseenNearby: "วัดช้างเผือก",
    beanName: text("แม่สรวย คาติมอร์ วอชด์ 02", "Mae Suai Catimor Washed 02"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอแม่สรวย",
    producerOrCommunity: text("เครือข่ายผู้ปลูกกาแฟแม่สรวย", "Mae Suai coffee growers"),
    altitudeMeters: [1_180, 1_360],
    varietal: "Catimor",
    process: "washed",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอแม่สรวย",
    taste: "nutty",
    tastingNotes: notes(["อัลมอนด์", "almond"], ["โกโก้", "cacao"], ["น้ำตาลทรายแดง", "brown sugar"]),
    roast: "medium",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอเมืองน่าน",
    brewMethods: ["filter", "espresso"],
    nanGrown: false,
    nanRoasted: true,
    workation: false,
  },
  {
    name: "เหนือเสน่ห์ คอฟฟี่",
    latitude: 18.796312428611024,
    longitude: 100.7842287692962,
    unseenNearby: "ร้านเสน่ห์เหนือ",
    beanName: text("สวนยาหลวง ฮันนี 03", "Suan Ya Luang Honey 03"),
    originProvince: "น่าน",
    originLocality: "บ้านสันเจริญ อำเภอท่าวังผา",
    producerOrCommunity: text("กลุ่มกาแฟสวนยาหลวง บ้านสันเจริญ", "Suan Ya Luang coffee group, Ban San Charoen"),
    altitudeMeters: [1_000, 1_500],
    varietal: "Catimor",
    process: "honey",
    processingProvince: "น่าน",
    processingLocality: "บ้านสันเจริญ อำเภอท่าวังผา",
    taste: "floral",
    tastingNotes: notes(["ส้มโอ", "pomelo"], ["ชาขาว", "white tea"], ["ดอกส้ม", "orange blossom"]),
    roast: "light",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอท่าวังผา",
    brewMethods: ["filter", "aeropress"],
    nanGrown: true,
    nanRoasted: true,
    workation: true,
    internet: { downloadMbps: 54, uploadMbps: 25, pingMs: 24 },
  },
  {
    name: "ร่มไม้ คอฟฟี่สเตชัน",
    latitude: 18.794263958483132,
    longitude: 100.77499309995126,
    unseenNearby: "สุสานคริสตจักร",
    beanName: text("แม่ลาว คาทูรา แอนแอโรบิก 04", "Mae Lao Caturra Anaerobic 04"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอแม่ลาว",
    producerOrCommunity: text("กลุ่มผู้ปลูกกาแฟแม่ลาว", "Mae Lao coffee growers"),
    altitudeMeters: [1_150, 1_380],
    varietal: "Caturra",
    process: "anaerobic",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอแม่ลาว",
    taste: "fruity",
    tastingNotes: notes(["พีช", "peach"], ["องุ่นแดง", "red grape"], ["โกโก้", "cacao"]),
    roast: "medium",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "espresso", "cold-brew"],
    nanGrown: false,
    nanRoasted: false,
    workation: false,
  },
  {
    name: "โต้รุ่ง คอฟฟี่บาร์",
    latitude: 18.782096957270138,
    longitude: 100.77279582589249,
    unseenNearby: "ตลาดโต้รุ่ง",
    beanName: text("แม่จริม โรบัสตา เนเชอรัล 05", "Mae Charim Robusta Natural 05"),
    originProvince: "น่าน",
    originLocality: "อำเภอแม่จริม",
    producerOrCommunity: text("กลุ่มผู้ปลูกโรบัสตาแม่จริม", "Mae Charim Robusta growers"),
    altitudeMeters: [300, 650],
    varietal: "Robusta",
    process: "natural",
    processingProvince: "น่าน",
    processingLocality: "อำเภอแม่จริม",
    taste: "nutty",
    tastingNotes: notes(["โกโก้", "cacao"], ["ถั่วอบ", "roasted nuts"], ["คาราเมล", "caramel"]),
    roast: "dark",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["espresso", "mokapot", "filter"],
    nanGrown: true,
    nanRoasted: false,
    workation: false,
  },
  {
    name: "กำแพงเก่า บรูว์",
    latitude: 18.780267101327578,
    longitude: 100.76861588910326,
    unseenNearby: "กำแพงเมืองเก่าน่าน",
    beanName: text("แม่จัน เบอร์บอน เนเชอรัล 06", "Mae Chan Bourbon Natural 06"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอแม่จัน",
    producerOrCommunity: text("กลุ่มสวนกาแฟวนเกษตรแม่จัน", "Mae Chan agroforestry coffee growers"),
    altitudeMeters: [1_220, 1_450],
    varietal: "Bourbon",
    process: "natural",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอแม่จัน",
    taste: "floral",
    tastingNotes: notes(["มะลิ", "jasmine"], ["น้ำผึ้ง", "honey"], ["ผลไม้เมล็ดแข็ง", "stone fruit"]),
    roast: "light",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอเวียงสา",
    brewMethods: ["filter", "espresso"],
    nanGrown: false,
    nanRoasted: true,
    workation: true,
    internet: { downloadMbps: 112, uploadMbps: 58, pingMs: 14 },
  },
  {
    name: "บ้านหนังสือ คอฟฟี่",
    latitude: 18.778629620565898,
    longitude: 100.7688185691823,
    unseenNearby: "ห้องสมุดบ้านๆน่านๆ",
    beanName: text("ขุนน่าน วอชด์ 07", "Khun Nan Washed 07"),
    originProvince: "น่าน",
    originLocality: "บ้านสะจุก–สะเกี้ยง ตำบลขุนน่าน อำเภอเฉลิมพระเกียรติ",
    producerOrCommunity: text("เครือข่ายผู้ปลูกกาแฟบ้านสะจุก–สะเกี้ยง", "Sako–Sakia coffee growers"),
    altitudeMeters: [1_200, 1_500],
    varietal: "Catimor",
    process: "washed",
    processingProvince: "น่าน",
    processingLocality: "อำเภอเมืองน่าน",
    taste: "fruity",
    tastingNotes: notes(["พีช", "peach"], ["ชาดำ", "black tea"], ["ส้มโอ", "pomelo"]),
    roast: "medium",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอทุ่งช้าง",
    brewMethods: ["filter", "aeropress", "espresso"],
    nanGrown: true,
    nanRoasted: true,
    workation: false,
  },
  {
    name: "ข่วงเมือง ดริปบาร์",
    latitude: 18.775344051942913,
    longitude: 100.77087197906204,
    unseenNearby: "กาดข่วงเมืองน่าน",
    beanName: text("เวียงป่าเป้า คาติมอร์ ฮันนี 08", "Wiang Pa Pao Catimor Honey 08"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอเวียงป่าเป้า",
    producerOrCommunity: text("เครือข่ายสวนกาแฟเวียงป่าเป้า", "Wiang Pa Pao coffee gardens"),
    altitudeMeters: [1_100, 1_300],
    varietal: "Catimor",
    process: "honey",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอเวียงป่าเป้า",
    taste: "nutty",
    tastingNotes: notes(["น้ำผึ้ง", "honey"], ["อัลมอนด์", "almond"], ["โกโก้", "cacao"]),
    roast: "dark",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "espresso", "mokapot"],
    nanGrown: false,
    nanRoasted: false,
    workation: true,
    internet: { downloadMbps: 68, uploadMbps: 31, pingMs: 21 },
  },
  {
    name: "ไนต์วอล์ก คอฟฟี่",
    latitude: 18.77488333660043,
    longitude: 100.77185348360817,
    unseenNearby: "ถนนคนเดินกลางคืนน่าน",
    beanName: text("มณีพฤกษ์ เกอิชา เนเชอรัล 09", "Manee Pruek Geisha Natural 09"),
    originProvince: "น่าน",
    originLocality: "บ้านมณีพฤกษ์ อำเภอทุ่งช้าง",
    producerOrCommunity: text("แปลงใหญ่กาแฟบ้านมณีพฤกษ์", "Ban Manee Pruek coffee collaborative farm"),
    altitudeMeters: [1_400, 1_600],
    varietal: "Geisha",
    process: "natural",
    processingProvince: "น่าน",
    processingLocality: "บ้านมณีพฤกษ์ อำเภอทุ่งช้าง",
    taste: "floral",
    tastingNotes: notes(["มะลิ", "jasmine"], ["องุ่นขาว", "white grape"], ["เบอร์รี", "berry"]),
    roast: "light",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "aeropress"],
    nanGrown: true,
    nanRoasted: false,
    workation: false,
  },
  {
    name: "ริมน่าน คอฟฟี่",
    latitude: 18.773562466688162,
    longitude: 100.77837147495387,
    unseenNearby: "แม่น้ำน่าน",
    beanName: text("พาน คาทูรา คาร์บอนิก 10", "Phan Caturra Carbonic 10"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอพาน",
    producerOrCommunity: text("กลุ่มผู้ปลูกกาแฟอำเภอพาน", "Phan coffee growers"),
    altitudeMeters: [1_180, 1_420],
    varietal: "Caturra",
    process: "carbonic-maceration",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอพาน",
    taste: "fruity",
    tastingNotes: notes(["องุ่นแดง", "red grape"], ["ส้มแมนดาริน", "mandarin"], ["เชอร์รี", "cherry"]),
    roast: "medium",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอเมืองน่าน",
    brewMethods: ["filter", "cold-brew", "espresso"],
    nanGrown: false,
    nanRoasted: true,
    workation: true,
    internet: { downloadMbps: 95, uploadMbps: 47, pingMs: 17 },
  },
  {
    name: "หนองน้ำครก คอฟฟี่สต็อป",
    latitude: 18.767297776622552,
    longitude: 100.78147590831547,
    unseenNearby: "หนองน้ำครก",
    beanName: text("นาน้อย โรบัสตา เนเชอรัล 11", "Na Noi Robusta Natural 11"),
    originProvince: "น่าน",
    originLocality: "อำเภอนาน้อย",
    producerOrCommunity: text("กลุ่มผู้ปลูกโรบัสตานาน้อย", "Na Noi Robusta growers"),
    altitudeMeters: [300, 700],
    varietal: "Robusta",
    process: "natural",
    processingProvince: "น่าน",
    processingLocality: "อำเภอเวียงสา",
    taste: "nutty",
    tastingNotes: notes(["โกโก้", "cacao"], ["ถั่วลิสง", "peanut"], ["คาราเมล", "caramel"]),
    roast: "dark",
    roasterProvince: "น่าน",
    roasterLocality: "อำเภอเวียงสา",
    brewMethods: ["espresso", "mokapot", "filter"],
    nanGrown: true,
    nanRoasted: true,
    workation: false,
  },
  {
    name: "รุกขชาติ บรูว์พอยต์",
    latitude: 18.76011879701974,
    longitude: 100.78899266651072,
    unseenNearby: "สวนรุกขชาติแช่แห้ง",
    beanName: text("เทิง ทิปิกา วอชด์ 12", "Thoeng Typica Washed 12"),
    originProvince: "เชียงราย",
    originLocality: "อำเภอเทิง",
    producerOrCommunity: text("กลุ่มวนเกษตรกาแฟอำเภอเทิง", "Thoeng agroforestry coffee growers"),
    altitudeMeters: [1_300, 1_550],
    varietal: "Typica",
    process: "washed",
    processingProvince: "เชียงราย",
    processingLocality: "อำเภอเทิง",
    taste: "floral",
    tastingNotes: notes(["ชาขาว", "white tea"], ["ส้มโอ", "pomelo"], ["ดอกส้ม", "orange blossom"]),
    roast: "light",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "cold-brew"],
    nanGrown: false,
    nanRoasted: false,
    workation: false,
  },
  {
    name: "ภูเพียง ฟอเรสต์คัพ",
    latitude: 18.760058066423383,
    longitude: 100.79222139882796,
    unseenNearby: "ภูเพียงโมเดล-รักษ์ป่าน่าน",
    beanName: text("ห้วยเลา โรบัสตา ฮันนี 13", "Huai Lao Robusta Honey 13"),
    originProvince: "น่าน",
    originLocality: "บ้านห้วยเลา อำเภอสองแคว",
    producerOrCommunity: text("กลุ่มผู้ปลูกโรบัสตาบ้านห้วยเลา", "Ban Huai Lao Robusta growers"),
    altitudeMeters: [500, 900],
    varietal: "Robusta",
    process: "honey",
    processingProvince: "น่าน",
    processingLocality: "อำเภอเวียงสา",
    taste: "fruity",
    tastingNotes: notes(["ผลไม้แดง", "red fruit"], ["น้ำผึ้ง", "honey"], ["คาราเมล", "caramel"]),
    roast: "medium",
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    brewMethods: ["filter", "aeropress", "espresso"],
    nanGrown: true,
    nanRoasted: false,
    workation: true,
    internet: { downloadMbps: 72, uploadMbps: 36, pingMs: 20 },
  },
] as const;

function buildFinderCafe(spec: FinderCafeSpec, index: number): Cafe {
  const template = demoCafes[index % demoCafes.length];
  const workationTemplate = demoCafes.find((cafe) => cafe.workation)?.workation;
  const sequence = String(index + 1).padStart(2, "0");
  const cafeId = `cafe-finder-demo-${sequence}`;
  const offering = template.offerings[0];
  const menuItem = template.menu[0];
  const workation = spec.workation && workationTemplate
    ? {
        ...workationTemplate,
        cafeId,
        speedReports: workationTemplate.speedReports.map((report, reportIndex) => ({
          ...report,
          id: `speed-finder-demo-${sequence}-${reportIndex + 1}`,
          ...(spec.internet ?? {}),
        })),
      }
    : undefined;
  const nanBeanBadges: CafeBadge[] = [
    ...(spec.nanGrown ? (["nan-grown-beans"] satisfies CafeBadge[]) : []),
    ...(spec.nanRoasted ? (["nan-roasted"] satisfies CafeBadge[]) : []),
  ];

  return {
    ...template,
    id: cafeId,
    slug: `finder-demo-${sequence}`,
    name: {
      th: `${spec.name} (ร้านสมมติ)`,
      en: `${spec.name} (Fictional demo)`,
    },
    story: {
      th: `จุดแวะกาแฟสำหรับทดสอบตัวกรองใกล้ ${spec.unseenNearby}`,
      en: `A fictional coffee stop used to test filtering near ${spec.unseenNearby}.`,
    },
    address: {
      th: `จุดทดสอบใกล้ ${spec.unseenNearby} จังหวัดน่าน`,
      en: `Demo point near ${spec.unseenNearby}, Nan`,
    },
    areaId: "nan-finder-demo",
    coordinates: { latitude: spec.latitude, longitude: spec.longitude },
    badges: [
      ...nanBeanBadges,
      ...(workation ? (["workation-friendly"] satisfies CafeBadge[]) : []),
      "new-discovery",
    ],
    routeEstimates: [],
    offerings: [{
      ...offering,
      id: `offering-finder-demo-${sequence}`,
      cafeId,
      name: spec.beanName,
      origin: {
        country: "Thailand",
        province: spec.originProvince,
        locality: spec.originLocality,
        farmOrCommunity: spec.originLocality,
        producer: spec.producerOrCommunity.th,
      },
      process: spec.process,
      roastLevel: spec.roast,
      tastingNotes: [...spec.tastingNotes],
      tasteProfiles: [spec.taste],
      brewMethods: [...spec.brewMethods],
    }],
    menu: [{
      ...menuItem,
      id: `menu-finder-demo-${sequence}`,
      cafeId,
      name: { th: `เมนูประจำร้าน ${sequence}`, en: `House drink ${sequence}` },
    }],
    workation,
    highlights: [],
  };
}

export const demoFinderCafeRecords: readonly FinderCafeRecord[] = finderCafeSpecs.map((spec, index) => ({
  cafe: buildFinderCafe(spec, index),
  unseenNearby: spec.unseenNearby,
}));

export const demoFinderCafes: readonly Cafe[] = demoFinderCafeRecords.map((record) => record.cafe);

export function unseenNearbyForFinderCafe(cafeId: string): string | undefined {
  return demoFinderCafeRecords.find((record) => record.cafe.id === cafeId)?.unseenNearby;
}
