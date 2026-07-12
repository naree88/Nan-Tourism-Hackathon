import { getFinderCafeDetail } from "./finder-cafe-details";
import { demoFinderCafes } from "./finder-cafes";
import { cleanDemoCopy } from "./presentation";
import {
  mapCafeToMerchantProfile,
  type MerchantProfileSnapshot,
} from "@/lib/merchant/profile";

export const DEMO_MERCHANT_CAFE_ID = "cafe-finder-demo-01";

export function getDemoMerchantProfile(
  cafeId = DEMO_MERCHANT_CAFE_ID,
): MerchantProfileSnapshot | null {
  if (cafeId !== DEMO_MERCHANT_CAFE_ID) return null;

  const cafe = demoFinderCafes.find((item) => item.id === cafeId);
  const detail = cafe ? getFinderCafeDetail(cafe.id) : undefined;
  if (!cafe || !detail) return null;

  const base = mapCafeToMerchantProfile(cafe);
  const origin = detail.singleOrigin;
  const featuredOffering: NonNullable<MerchantProfileSnapshot["featuredOffering"]> = {
    ...(base.featuredOffering?.id ? { id: base.featuredOffering.id } : {}),
    beanName: cleanDemoCopy(origin.name.th),
    originProvince: cleanDemoCopy(origin.origin.province),
    originName: cleanDemoCopy(origin.origin.locality),
    producer: cleanDemoCopy(origin.producerOrCommunity.th),
    altitudeMeters: { ...origin.altitudeMeters },
    varietal: cleanDemoCopy(origin.varietal),
    process: origin.process,
    processingLocation: {
      province: cleanDemoCopy(origin.processingLocation.province),
      locality: cleanDemoCopy(origin.processingLocation.locality),
    },
    roastLevel: origin.roastLevel,
    roasterLocation: {
      province: cleanDemoCopy(origin.roasterLocation.province),
      locality: cleanDemoCopy(origin.roasterLocation.locality),
    },
    tastingNotes: origin.tasteNotes.map((note) => ({
      th: cleanDemoCopy(note.th),
      en: cleanDemoCopy(note.en),
    })),
    tasteProfiles: [...origin.tasteProfiles],
    brewMethods: [...origin.brewMethods],
    ...(base.featuredOffering?.price ? { price: { ...base.featuredOffering.price } } : {}),
    ...(base.featuredOffering?.availability
      ? { availability: base.featuredOffering.availability }
      : {}),
  };

  return {
    ...base,
    cafe: {
      id: cafe.id,
      slug: cafe.slug,
      nameTh: cleanDemoCopy(cafe.name.th),
      storyTh: cleanDemoCopy(cafe.story.th),
      addressTh: cleanDemoCopy(cafe.address.th),
    },
    featuredOffering,
    offerings: [{ ...featuredOffering }],
    menuItems: detail.recommendedMenus.map((menu, index) => ({
      id: menu.id,
      nameTh: cleanDemoCopy(menu.name.th),
      nameEn: cleanDemoCopy(menu.name.en),
      descriptionTh: cleanDemoCopy(menu.description.th),
      descriptionEn: cleanDemoCopy(menu.description.en),
      priceThb: menu.price.amount,
      isAvailable: true,
      isCafePick: index === 0,
      usesFeaturedSingleOrigin: menu.usesFeaturedSingleOrigin,
      ...(menu.usesFeaturedSingleOrigin && featuredOffering.id
        ? { featuredOfferingId: featuredOffering.id }
        : {}),
    })),
  };
}
