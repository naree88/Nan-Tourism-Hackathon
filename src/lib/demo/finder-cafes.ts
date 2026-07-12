import type {
  Cafe,
  CafeBadge,
  CoffeeProcess,
  RoastLevel,
  TasteProfile,
} from "../domain/types";
import { demoCafes } from "./data";

export type FinderCafeRecord = {
  cafe: Cafe;
  unseenNearby: string;
};

type FinderCafeSpec = {
  name: string;
  latitude: number;
  longitude: number;
  unseenNearby: string;
  process: Extract<CoffeeProcess, "natural" | "washed" | "honey" | "anaerobic" | "carbonic-maceration">;
  taste: Extract<TasteProfile, "nutty" | "floral" | "fruity">;
  roast: Extract<RoastLevel, "light" | "medium" | "dark">;
  workation: boolean;
  internet?: {
    downloadMbps: number;
    uploadMbps: number;
    pingMs: number;
  };
};

const finderCafeSpecs: readonly FinderCafeSpec[] = [
  { name: "ฟองคำ คอฟฟี่พอยต์", latitude: 18.790155412923813, longitude: 100.78530678254457, unseenNearby: "โฮงเจ้าฟองคำ", process: "natural", taste: "fruity", roast: "light", workation: true, internet: { downloadMbps: 86, uploadMbps: 42, pingMs: 18 } },
  { name: "ช้างเผือก บรูว์สต็อป", latitude: 18.79321656620621, longitude: 100.78141541790892, unseenNearby: "วัดช้างเผือก", process: "washed", taste: "nutty", roast: "medium", workation: false },
  { name: "เหนือเสน่ห์ คอฟฟี่", latitude: 18.796312428611024, longitude: 100.7842287692962, unseenNearby: "ร้านเสน่ห์เหนือ", process: "honey", taste: "floral", roast: "light", workation: true, internet: { downloadMbps: 54, uploadMbps: 25, pingMs: 24 } },
  { name: "ร่มไม้ คอฟฟี่สเตชัน", latitude: 18.794263958483132, longitude: 100.77499309995126, unseenNearby: "สุสานคริสตจักร", process: "anaerobic", taste: "fruity", roast: "medium", workation: false },
  { name: "โต้รุ่ง คอฟฟี่บาร์", latitude: 18.782096957270138, longitude: 100.77279582589249, unseenNearby: "ตลาดโต้รุ่ง", process: "carbonic-maceration", taste: "nutty", roast: "dark", workation: false },
  { name: "กำแพงเก่า บรูว์", latitude: 18.780267101327578, longitude: 100.76861588910326, unseenNearby: "กำแพงเมืองเก่าน่าน", process: "natural", taste: "floral", roast: "light", workation: true, internet: { downloadMbps: 112, uploadMbps: 58, pingMs: 14 } },
  { name: "บ้านหนังสือ คอฟฟี่", latitude: 18.778629620565898, longitude: 100.7688185691823, unseenNearby: "ห้องสมุดบ้านๆน่านๆ", process: "washed", taste: "fruity", roast: "medium", workation: false },
  { name: "ข่วงเมือง ดริปบาร์", latitude: 18.775344051942913, longitude: 100.77087197906204, unseenNearby: "กาดข่วงเมืองน่าน", process: "honey", taste: "nutty", roast: "dark", workation: true, internet: { downloadMbps: 68, uploadMbps: 31, pingMs: 21 } },
  { name: "ไนต์วอล์ก คอฟฟี่", latitude: 18.77488333660043, longitude: 100.77185348360817, unseenNearby: "ถนนคนเดินกลางคืนน่าน", process: "anaerobic", taste: "floral", roast: "light", workation: false },
  { name: "ริมน่าน คอฟฟี่", latitude: 18.773562466688162, longitude: 100.77837147495387, unseenNearby: "แม่น้ำน่าน", process: "carbonic-maceration", taste: "fruity", roast: "medium", workation: true, internet: { downloadMbps: 95, uploadMbps: 47, pingMs: 17 } },
  { name: "หนองน้ำครก คอฟฟี่สต็อป", latitude: 18.767297776622552, longitude: 100.78147590831547, unseenNearby: "หนองน้ำครก", process: "natural", taste: "nutty", roast: "dark", workation: false },
  { name: "รุกขชาติ บรูว์พอยต์", latitude: 18.76011879701974, longitude: 100.78899266651072, unseenNearby: "สวนรุกขชาติแช่แห้ง", process: "washed", taste: "floral", roast: "light", workation: false },
  { name: "ภูเพียง ฟอเรสต์คัพ", latitude: 18.760058066423383, longitude: 100.79222139882796, unseenNearby: "ภูเพียงโมเดล-รักษ์ป่าน่าน", process: "honey", taste: "fruity", roast: "medium", workation: true, internet: { downloadMbps: 72, uploadMbps: 36, pingMs: 20 } },
] as const;

const tastingNoteCopy: Record<FinderCafeSpec["taste"], { th: string; en: string }> = {
  nutty: { th: "ถั่ว", en: "nutty" },
  floral: { th: "ดอกไม้", en: "floral" },
  fruity: { th: "ผลไม้", en: "fruity" },
};

const nanBeanBadgeMix: readonly (readonly CafeBadge[])[] = [
  ["nan-grown-beans"],
  ["nan-roasted"],
  ["nan-grown-beans", "nan-roasted"],
  [],
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
  const nanBeanBadges = nanBeanBadgeMix[index % nanBeanBadgeMix.length];

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
      name: { th: `House lot ${sequence}`, en: `House lot ${sequence}` },
      origin: {
        ...offering.origin,
        province: nanBeanBadges.includes("nan-grown-beans") ? "Nan" : "Chiang Rai",
      },
      process: spec.process,
      roastLevel: spec.roast,
      tastingNotes: [tastingNoteCopy[spec.taste]],
      tasteProfiles: [spec.taste],
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
