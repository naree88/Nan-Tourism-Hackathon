import type {
  BrewMethod,
  CoffeeProcess,
  LocalizedText,
  Money,
  RoastLevel,
  TasteProfile,
} from "../domain/types";
import { demoFinderCafeRecords } from "./finder-cafes";

export type FinderRecommendedMenu = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: Money;
  sensoryTags: readonly LocalizedText[];
  usesFeaturedSingleOrigin: boolean;
};

export type FinderSingleOriginCoffee = {
  name: LocalizedText;
  origin: {
    country: "Thailand";
    province: string;
    locality: string;
  };
  producerOrCommunity: LocalizedText;
  altitudeMeters: {
    min: number;
    max: number;
  };
  varietal: string;
  process: CoffeeProcess;
  processingLocation: {
    province: string;
    locality: string;
  };
  roastLevel: RoastLevel;
  tasteNotes: readonly LocalizedText[];
  tasteProfiles: readonly TasteProfile[];
  brewMethods: readonly BrewMethod[];
  roasterLocation: {
    province: string;
    locality: string;
  };
};

export type FinderCustomerReview = {
  id: string;
  reviewerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: LocalizedText;
  referencedMenuIds: readonly string[];
  mentionsUnseenNearby: boolean;
  workContext: boolean;
};

export type FinderCafeDetail = {
  cafeId: string;
  recommendedMenus: readonly FinderRecommendedMenu[];
  singleOrigin: FinderSingleOriginCoffee;
  customerReviews: readonly FinderCustomerReview[];
};

type MenuSeed = {
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  sensoryTags: readonly LocalizedText[];
};

type DetailSeed = {
  menus: readonly [MenuSeed, MenuSeed, MenuSeed];
  originName: LocalizedText;
  originProvince: string;
  locality: string;
  producerOrCommunity: LocalizedText;
  altitudeMeters: readonly [number, number];
  varietal: string;
  tasteNotes: readonly LocalizedText[];
  brewMethods: readonly BrewMethod[];
  roasterProvince: string;
  roasterLocality: string;
  reviewTwo: LocalizedText;
};

const text = (th: string, en: string): LocalizedText => ({ th, en });
const tags = (...values: readonly [string, string][]): LocalizedText[] =>
  values.map(([th, en]) => text(th, en));

const detailSeeds: readonly DetailSeed[] = [
  {
    menus: [
      {
        name: text("ออเรนจ์บลอสซัมโคลด์บรูว์", "Orange Blossom Cold Brew"),
        description: text("โคลด์บรูว์ใสกับส้มสดและกลิ่นดอกส้ม", "Clear cold brew with fresh orange and orange-blossom aroma."),
        price: 115,
        sensoryTags: tags(["ส้ม", "orange"], ["ผลไม้", "fruity"]),
      },
      {
        name: text("ฮันนีเลมอนเอสเปรสโซโทนิก", "Honey Lemon Espresso Tonic"),
        description: text("เอสเปรสโซ โทนิก น้ำผึ้ง และเลมอนสดชื่น", "Espresso, tonic, honey, and lemon with a crisp finish."),
        price: 120,
        sensoryTags: tags(["เลมอน", "lemon"], ["สดชื่น", "refreshing"]),
      },
      {
        name: text("ฟองคำฟิลเตอร์ไฟลต์", "Fong Kham Filter Flight"),
        description: text("ฟิลเตอร์สองแก้วเล็กเพื่อเทียบอุณหภูมิและความหวานของผลไม้", "Two small filter pours to compare fruit sweetness as they cool."),
        price: 145,
        sensoryTags: tags(["เบอร์รี", "berry"], ["หวานฉ่ำ", "juicy"]),
      },
    ],
    originName: text("ดอยหมอกล็อต 01", "Misty Highland Lot 01"),
    originProvince: "น่าน",
    locality: "บ่อเกลือ",
    producerOrCommunity: text("กลุ่มผู้ปลูกต้นน้ำเหนือ", "Northern Headwater Growers"),
    altitudeMeters: [1_300, 1_520],
    varietal: "Java",
    tasteNotes: tags(["ส้มแมนดาริน", "mandarin orange"], ["สตรอว์เบอร์รี", "strawberry"], ["น้ำผึ้ง", "honey"]),
    brewMethods: ["filter", "cold-brew"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("นั่งทำงานช่วงเช้ากับฟองคำฟิลเตอร์ไฟลต์ โต๊ะวางโน้ตบุ๊กได้สบายและกาแฟยังหอมเมื่อเย็นลง", "I worked here in the morning with the Fong Kham Filter Flight; the table fit my laptop and the coffee stayed aromatic as it cooled."),
  },
  {
    menus: [
      {
        name: text("งาดำแฟลตไวต์", "Black Sesame Flat White"),
        description: text("แฟลตไวต์เนื้อนุ่มกับงาดำคั่วหอม", "A silky flat white with aromatic roasted black sesame."),
        price: 100,
        sensoryTags: tags(["งาดำ", "black sesame"], ["ถั่ว", "nutty"]),
      },
      {
        name: text("นัตตี้คาราเมลอเมริกาโน", "Nutty Caramel Americano"),
        description: text("อเมริกาโนเย็นเติมคาราเมลบาง ๆ ให้ความหวานกลมกล่อม", "Iced Americano with a light caramel sweetness."),
        price: 95,
        sensoryTags: tags(["คาราเมล", "caramel"], ["อัลมอนด์", "almond"]),
      },
      {
        name: text("โกโก้นิบโคลด์บรูว์", "Cacao Nib Cold Brew"),
        description: text("โคลด์บรูว์บอดี้นุ่ม เสิร์ฟพร้อมกลิ่นโกโก้นิบ", "Smooth-bodied cold brew lifted by cacao-nib aroma."),
        price: 110,
        sensoryTags: tags(["โกโก้", "cacao"], ["ถั่วอบ", "roasted nuts"]),
      },
    ],
    originName: text("เนินร่มเงาล็อต 02", "Shaded Hillside Lot 02"),
    originProvince: "เชียงราย",
    locality: "แม่สรวย",
    producerOrCommunity: text("เครือข่ายผู้ปลูกร่มเงาต้นน้ำ", "Headwater Shade-Grown Network"),
    altitudeMeters: [1_180, 1_360],
    varietal: "Catimor",
    tasteNotes: tags(["อัลมอนด์", "almond"], ["โกโก้", "cacao"], ["น้ำตาลทรายแดง", "brown sugar"]),
    brewMethods: ["filter", "espresso"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("งาดำแฟลตไวต์เนียนและไม่หวานเกินไป ส่วนนัตตี้คาราเมลอเมริกาโนยังคงรสกาแฟชัด", "The Black Sesame Flat White was smooth and not overly sweet, while the Nutty Caramel Americano still tasted distinctly of coffee."),
  },
  {
    menus: [
      {
        name: text("ยูซุฮันนีคอฟฟี่", "Yuzu Honey Coffee"),
        description: text("กาแฟน้ำผึ้งโซดากับยูซุ ให้กลิ่นดอกไม้และซิตรัส", "Honey coffee soda with yuzu, floral aroma, and citrus lift."),
        price: 125,
        sensoryTags: tags(["ยูซุ", "yuzu"], ["ดอกไม้", "floral"]),
      },
      {
        name: text("ลิ้นจี่ฟลอรัลโซดา", "Lychee Floral Soda"),
        description: text("ช็อตกาแฟกับลิ้นจี่และโซดา กลิ่นหอมเบา ๆ", "A coffee shot with lychee and soda for a light aromatic cup."),
        price: 120,
        sensoryTags: tags(["ลิ้นจี่", "lychee"], ["ดอกขาว", "white blossom"]),
      },
      {
        name: text("ฮันนีโพรเซสฟิลเตอร์", "Honey Process Filter"),
        description: text("ดริปเมล็ดคั่วอ่อน เน้นความหวานและกลิ่นดอกไม้", "Light-roast filter coffee highlighting sweetness and floral notes."),
        price: 135,
        sensoryTags: tags(["น้ำผึ้ง", "honey"], ["ชาดอกไม้", "floral tea"]),
      },
    ],
    originName: text("หุบเขาดอกขาวล็อต 03", "White Blossom Valley Lot 03"),
    originProvince: "น่าน",
    locality: "ปัว",
    producerOrCommunity: text("กลุ่มกาแฟสวนผสมบนดอย", "Highland Mixed-Garden Coffee Group"),
    altitudeMeters: [1_250, 1_470],
    varietal: "Typica",
    tasteNotes: tags(["ดอกส้ม", "orange blossom"], ["ลิ้นจี่", "lychee"], ["น้ำผึ้ง", "honey"]),
    brewMethods: ["filter", "aeropress"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("มานั่งทำงานพร้อมยูซุฮันนีคอฟฟี่ Wi‑Fi ใช้ประชุมสั้น ๆ ได้และเครื่องดื่มสดชื่นดี", "I worked here with a Yuzu Honey Coffee; the Wi-Fi handled a short call and the drink was refreshing."),
  },
  {
    menus: [
      {
        name: text("พลัมเอสเปรสโซโทนิก", "Plum Espresso Tonic"),
        description: text("เอสเปรสโซโทนิกกับพลัม ให้รสผลไม้สุกและปลายซ่า", "Espresso tonic with plum, ripe-fruit character, and a sparkling finish."),
        price: 115,
        sensoryTags: tags(["พลัม", "plum"], ["ผลไม้สุก", "ripe fruit"]),
      },
      {
        name: text("เบอร์รีสปาร์กลิงคอฟฟี่", "Berry Sparkling Coffee"),
        description: text("กาแฟเย็นกับเบอร์รีและโซดา เปรี้ยวหวานพอดี", "Chilled coffee with berry and soda in a balanced sweet-tart style."),
        price: 120,
        sensoryTags: tags(["เบอร์รี", "berry"], ["ไวน์นี", "winey"]),
      },
      {
        name: text("แอนแอโรบิกฟิลเตอร์", "Anaerobic Filter"),
        description: text("ฟิลเตอร์กลิ่นผลไม้เข้ม บอดี้กลมและหวานยาว", "A fruit-forward filter with round body and a lingering sweetness."),
        price: 140,
        sensoryTags: tags(["เชอร์รี", "cherry"], ["โกโก้", "cacao"]),
      },
    ],
    originName: text("เชิงเขาผลไม้ล็อต 04", "Fruit Ridge Lot 04"),
    originProvince: "เชียงราย",
    locality: "แม่ลาว",
    producerOrCommunity: text("กลุ่มเกษตรกรเชิงเขาตัวอย่าง", "Ridge Growers Collective"),
    altitudeMeters: [1_150, 1_380],
    varietal: "Caturra",
    tasteNotes: tags(["พลัม", "plum"], ["เชอร์รี", "cherry"], ["ช็อกโกแลต", "chocolate"]),
    brewMethods: ["filter", "espresso"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("แอนแอโรบิกฟิลเตอร์หอมผลไม้ชัดแต่ไม่หมักแรงเกินไป ส่วนพลัมเอสเปรสโซโทนิกดื่มง่ายมาก", "The Anaerobic Filter was clearly fruity without being overly fermented, and the Plum Espresso Tonic was very easy to drink."),
  },
  {
    menus: [
      {
        name: text("ซอลเต็ดโกโก้เอสเปรสโซ", "Salted Cacao Espresso"),
        description: text("เอสเปรสโซเข้มกับโกโก้และเกลือเล็กน้อย", "Bold espresso with cacao and a small pinch of salt."),
        price: 105,
        sensoryTags: tags(["โกโก้", "cacao"], ["เข้ม", "bold"]),
      },
      {
        name: text("โรสเต็ดนัตลาเต้", "Roasted Nut Latte"),
        description: text("ลาเต้คั่วเข้ม กลิ่นถั่วอบและคาราเมล", "Dark-roast latte with roasted-nut and caramel aromas."),
        price: 110,
        sensoryTags: tags(["ถั่วอบ", "roasted nuts"], ["คาราเมล", "caramel"]),
      },
      {
        name: text("ไนต์มาร์เก็ตโคลด์บรูว์", "Night Market Cold Brew"),
        description: text("โคลด์บรูว์บอดี้แน่น หวานคล้ายน้ำตาลทรายแดง", "Full-bodied cold brew with brown-sugar sweetness."),
        price: 100,
        sensoryTags: tags(["น้ำตาลทรายแดง", "brown sugar"], ["ถั่ว", "nutty"]),
      },
    ],
    originName: text("ดอยร่มไม้ล็อต 05", "Forest Shade Lot 05"),
    originProvince: "น่าน",
    locality: "ท่าวังผา",
    producerOrCommunity: text("กลุ่มผู้ปลูกใต้ร่มไม้", "Forest-Canopy Growers"),
    altitudeMeters: [1_100, 1_320],
    varietal: "Catimor",
    tasteNotes: tags(["เฮเซลนัต", "hazelnut"], ["โกโก้", "cacao"], ["คาราเมลเข้ม", "dark caramel"]),
    brewMethods: ["espresso", "filter", "mokapot"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("โรสเต็ดนัตลาเต้หอมถั่วอบและเข้ากับของกินช่วงเย็น ส่วนไนต์มาร์เก็ตโคลด์บรูว์บอดี้แน่นสมชื่อ", "The Roasted Nut Latte smelled of toasted nuts and paired well with an evening snack; the Night Market Cold Brew was satisfyingly full-bodied."),
  },
  {
    menus: [
      {
        name: text("โรสแอปเปิลฟิลเตอร์", "Rose Apple Filter"),
        description: text("ฟิลเตอร์คั่วอ่อน กลิ่นชมพู่และดอกกุหลาบบาง ๆ", "Light-roast filter with rose-apple and delicate rose aromas."),
        price: 130,
        sensoryTags: tags(["ชมพู่", "rose apple"], ["กุหลาบ", "rose"]),
      },
      {
        name: text("ลำไยคอฟฟี่โทนิก", "Longan Coffee Tonic"),
        description: text("กาแฟโทนิกกับลำไย เพิ่มความหวานหอมแบบผลไม้แห้ง", "Coffee tonic with longan for a fragrant dried-fruit sweetness."),
        price: 115,
        sensoryTags: tags(["ลำไย", "longan"], ["ดอกไม้", "floral"]),
      },
      {
        name: text("โอลด์วอลล์โคลด์บรูว์", "Old Wall Cold Brew"),
        description: text("โคลด์บรูว์ใส กลิ่นชาและดอกไม้ ปลายหวาน", "A clean cold brew with tea, florals, and a sweet finish."),
        price: 110,
        sensoryTags: tags(["ชาดำ", "black tea"], ["ดอกขาว", "white blossom"]),
      },
    ],
    originName: text("สวนดอกหอมล็อต 06", "Fragrant Garden Lot 06"),
    originProvince: "เชียงราย",
    locality: "แม่จัน",
    producerOrCommunity: text("กลุ่มสวนกาแฟวนเกษตร", "Agroforestry Coffee Gardens"),
    altitudeMeters: [1_220, 1_450],
    varietal: "Bourbon",
    tasteNotes: tags(["กุหลาบ", "rose"], ["ชมพู่", "rose apple"], ["ชาดำ", "black tea"]),
    brewMethods: ["filter", "cold-brew"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("พกโน้ตบุ๊กมาทำงานครึ่งวันกับโรสแอปเปิลฟิลเตอร์ มุมโต๊ะสงบและกาแฟคั่วอ่อนดื่มได้นาน", "I brought my laptop for half a day with a Rose Apple Filter; the table corner was calm and the light roast was pleasant to sip slowly."),
  },
  {
    menus: [
      {
        name: text("พีชทีคอฟฟี่", "Peach Tea Coffee"),
        description: text("กาแฟกับชาพีช กลิ่นผลไม้และปลายคล้ายชา", "Coffee with peach tea, fruity aromatics, and a tea-like finish."),
        price: 110,
        sensoryTags: tags(["พีช", "peach"], ["ชาผลไม้", "fruit tea"]),
      },
      {
        name: text("ซิตรัสอเมริกาโน", "Citrus Americano"),
        description: text("อเมริกาโนกับส้มสด เปรี้ยวหวานสะอาด", "Americano with fresh orange and a clean sweet-tart balance."),
        price: 100,
        sensoryTags: tags(["ซิตรัส", "citrus"], ["ผลไม้", "fruity"]),
      },
      {
        name: text("รีดดิ้งรูมฟิลเตอร์", "Reading Room Filter"),
        description: text("ฟิลเตอร์นุ่มสะอาด กลิ่นพีชและชาดำ", "A clean, gentle filter with peach and black-tea notes."),
        price: 125,
        sensoryTags: tags(["พีช", "peach"], ["ชาดำ", "black tea"]),
      },
    ],
    originName: text("เนินชาผลไม้ล็อต 07", "Fruit Tea Hill Lot 07"),
    originProvince: "น่าน",
    locality: "สันติสุข",
    producerOrCommunity: text("ชุมชนผู้ปลูกสวนป่าต้นน้ำ", "Headwater Forest-Garden Community"),
    altitudeMeters: [1_280, 1_500],
    varietal: "Typica",
    tasteNotes: tags(["พีช", "peach"], ["ส้มโอ", "pomelo"], ["ชาดำ", "black tea"]),
    brewMethods: ["filter", "aeropress"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("รีดดิ้งรูมฟิลเตอร์สะอาดและมีกลิ่นพีช เหมาะกับจิบช้า ๆ ส่วนซิตรัสอเมริกาโนสดชื่นกว่า", "The Reading Room Filter was clean and peachy for slow sipping, while the Citrus Americano was more refreshing."),
  },
  {
    menus: [
      {
        name: text("แมคคาเดเมียฮันนีลาเต้", "Macadamia Honey Latte"),
        description: text("ลาเต้คั่วเข้มกับน้ำผึ้งและกลิ่นแมคคาเดเมีย", "Dark-roast latte with honey and macadamia aroma."),
        price: 115,
        sensoryTags: tags(["แมคคาเดเมีย", "macadamia"], ["น้ำผึ้ง", "honey"]),
      },
      {
        name: text("ดาร์กฮันนีเอสเปรสโซ", "Dark Honey Espresso"),
        description: text("เอสเปรสโซเข้ม หวานธรรมชาติและบอดี้แน่น", "Intense espresso with natural sweetness and a full body."),
        price: 85,
        sensoryTags: tags(["ถั่ว", "nutty"], ["กากน้ำตาล", "molasses"]),
      },
      {
        name: text("ข่วงเมืองฟิลเตอร์", "Khwang Mueang Filter"),
        description: text("ฟิลเตอร์คั่วเข้ม กลิ่นถั่วอบและโกโก้", "Dark-roast filter with roasted-nut and cacao notes."),
        price: 120,
        sensoryTags: tags(["ถั่วอบ", "roasted nuts"], ["โกโก้", "cacao"]),
      },
    ],
    originName: text("หุบเขาน้ำผึ้งล็อต 08", "Honey Valley Lot 08"),
    originProvince: "เชียงราย",
    locality: "เวียงป่าเป้า",
    producerOrCommunity: text("เครือข่ายสวนกาแฟครอบครัว", "Family Coffee Garden Network"),
    altitudeMeters: [1_100, 1_300],
    varietal: "Catimor",
    tasteNotes: tags(["แมคคาเดเมีย", "macadamia"], ["โกโก้", "cacao"], ["กากน้ำตาล", "molasses"]),
    brewMethods: ["espresso", "filter", "mokapot"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("มานั่งทำงานก่อนเย็น สั่งแมคคาเดเมียฮันนีลาเต้ โต๊ะกว้างพอสำหรับโน้ตบุ๊กและรสไม่หวานจัด", "I worked here before evening with a Macadamia Honey Latte; the table fit my laptop and the drink was not too sweet."),
  },
  {
    menus: [
      {
        name: text("แจสมินยูซุคอฟฟี่", "Jasmine Yuzu Coffee"),
        description: text("กาแฟยูซุกับกลิ่นมะลิ ให้สัมผัสเบาและหอม", "Yuzu coffee with jasmine aroma and a light mouthfeel."),
        price: 120,
        sensoryTags: tags(["มะลิ", "jasmine"], ["ยูซุ", "yuzu"]),
      },
      {
        name: text("ฟลอรัลเอสเปรสโซโซดา", "Floral Espresso Soda"),
        description: text("เอสเปรสโซโซดากลิ่นดอกไม้ ปลายซิตรัส", "Sparkling espresso with floral aroma and a citrus finish."),
        price: 115,
        sensoryTags: tags(["ดอกไม้", "floral"], ["ซิตรัส", "citrus"]),
      },
      {
        name: text("ไนต์วอล์กฟิลเตอร์", "Night Walk Filter"),
        description: text("ดริปคั่วอ่อน กลิ่นมะลิและองุ่นขาว", "Light-roast filter with jasmine and white-grape notes."),
        price: 135,
        sensoryTags: tags(["มะลิ", "jasmine"], ["องุ่นขาว", "white grape"]),
      },
    ],
    originName: text("ดอยชาขาวล็อต 09", "White Tea Highland Lot 09"),
    originProvince: "น่าน",
    locality: "เชียงกลาง",
    producerOrCommunity: text("กลุ่มผู้ปลูกเชิงดอยรุ่นใหม่", "New-Generation Highland Growers"),
    altitudeMeters: [1_350, 1_580],
    varietal: "Java",
    tasteNotes: tags(["มะลิ", "jasmine"], ["องุ่นขาว", "white grape"], ["ยูซุ", "yuzu"]),
    brewMethods: ["filter", "aeropress"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("ไนต์วอล์กฟิลเตอร์กลิ่นมะลิชัด พอเย็นลงเจอองุ่นขาว ส่วนแจสมินยูซุคอฟฟี่ดื่มสนุกกว่า", "The Night Walk Filter was distinctly jasmine-like and revealed white grape as it cooled; the Jasmine Yuzu Coffee was the more playful drink."),
  },
  {
    menus: [
      {
        name: text("วอเตอร์เมลอนโคลด์บรูว์", "Watermelon Cold Brew"),
        description: text("โคลด์บรูว์กับแตงโม ให้ความหวานฉ่ำและปลายสะอาด", "Cold brew with watermelon for juicy sweetness and a clean finish."),
        price: 115,
        sensoryTags: tags(["แตงโม", "watermelon"], ["ฉ่ำ", "juicy"]),
      },
      {
        name: text("แมนดารินเอสเปรสโซโทนิก", "Mandarin Espresso Tonic"),
        description: text("เอสเปรสโซโทนิกกับส้มแมนดาริน สดชื่นและหวานซ่า", "Espresso tonic with mandarin for a bright, sparkling sweetness."),
        price: 120,
        sensoryTags: tags(["แมนดาริน", "mandarin"], ["ผลไม้", "fruity"]),
      },
      {
        name: text("ริเวอร์ไซด์ฟิลเตอร์", "Riverside Filter"),
        description: text("ฟิลเตอร์บอดี้นุ่ม กลิ่นแตงโม เชอร์รี และโกโก้บาง ๆ", "Soft-bodied filter with watermelon, cherry, and a touch of cacao."),
        price: 130,
        sensoryTags: tags(["เชอร์รี", "cherry"], ["แตงโม", "watermelon"]),
      },
    ],
    originName: text("หุบเขาผลไม้ฉ่ำล็อต 10", "Juicy Valley Lot 10"),
    originProvince: "เชียงราย",
    locality: "พาน",
    producerOrCommunity: text("กลุ่มแปรรูปกาแฟผลไม้", "Fruit-Process Coffee Collective"),
    altitudeMeters: [1_180, 1_420],
    varietal: "Caturra",
    tasteNotes: tags(["แตงโม", "watermelon"], ["แมนดาริน", "mandarin"], ["เชอร์รี", "cherry"]),
    brewMethods: ["filter", "cold-brew", "espresso"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("เปิดโน้ตบุ๊กทำงานริมหน้าต่างพร้อมริเวอร์ไซด์ฟิลเตอร์ บรรยากาศช่วงสายเหมาะกับงานที่ต้องใช้สมาธิ", "I worked by the window with a Riverside Filter; the late-morning atmosphere suited focused work."),
  },
  {
    menus: [
      {
        name: text("พีนัตคาราเมลลาเต้", "Peanut Caramel Latte"),
        description: text("ลาเต้คั่วเข้มกับถั่วลิสงและคาราเมล", "Dark-roast latte with peanut and caramel."),
        price: 105,
        sensoryTags: tags(["ถั่วลิสง", "peanut"], ["คาราเมล", "caramel"]),
      },
      {
        name: text("โกโก้นัตเอสเปรสโซ", "Cacao Nut Espresso"),
        description: text("เอสเปรสโซบอดี้แน่น กลิ่นโกโก้และถั่วอบ", "Full-bodied espresso with cacao and roasted-nut aromas."),
        price: 85,
        sensoryTags: tags(["โกโก้", "cacao"], ["ถั่วอบ", "roasted nuts"]),
      },
      {
        name: text("ดาร์กเนเชอรัลฟิลเตอร์", "Dark Natural Filter"),
        description: text("ฟิลเตอร์คั่วเข้ม หวานคล้ายคาราเมลและมีปลายผลไม้แห้ง", "Dark-roast filter with caramel sweetness and a dried-fruit finish."),
        price: 115,
        sensoryTags: tags(["คาราเมล", "caramel"], ["ผลไม้แห้ง", "dried fruit"]),
      },
    ],
    originName: text("สวนถั่วโกโก้ล็อต 11", "Cacao Nut Garden Lot 11"),
    originProvince: "น่าน",
    locality: "ทุ่งช้าง",
    producerOrCommunity: text("กลุ่มสวนกาแฟครอบครัวบนดอย", "Highland Family Coffee Gardens"),
    altitudeMeters: [1_050, 1_280],
    varietal: "Catimor",
    tasteNotes: tags(["ถั่วลิสง", "peanut"], ["โกโก้", "cacao"], ["คาราเมล", "caramel"]),
    brewMethods: ["espresso", "filter", "mokapot"],
    roasterProvince: "น่าน",
    roasterLocality: "เมืองน่าน",
    reviewTwo: text("โกโก้นัตเอสเปรสโซเข้มแต่ไม่ไหม้ ดาร์กเนเชอรัลฟิลเตอร์มีปลายผลไม้แห้งช่วยให้แก้วไม่หนักเกินไป", "The Cacao Nut Espresso was bold without tasting burnt, and the Dark Natural Filter's dried-fruit finish kept it from feeling too heavy."),
  },
  {
    menus: [
      {
        name: text("ไวต์ทีฟิลเตอร์", "White Tea Filter"),
        description: text("ดริปคั่วอ่อน กลิ่นชาขาวและดอกส้ม", "Light-roast filter with white-tea and orange-blossom notes."),
        price: 130,
        sensoryTags: tags(["ชาขาว", "white tea"], ["ดอกส้ม", "orange blossom"]),
      },
      {
        name: text("ส้มโอเอสเปรสโซโซดา", "Pomelo Espresso Soda"),
        description: text("เอสเปรสโซโซดากับส้มโอ หอมและขมปลายเล็กน้อย", "Espresso soda with pomelo, aromatic with a lightly bitter finish."),
        price: 115,
        sensoryTags: tags(["ส้มโอ", "pomelo"], ["ดอกไม้", "floral"]),
      },
      {
        name: text("โบทานิคัลโคลด์บรูว์", "Botanical Cold Brew"),
        description: text("โคลด์บรูว์ใส กลิ่นสมุนไพรอ่อนและดอกไม้", "Clean cold brew with gentle herbal and floral aromatics."),
        price: 110,
        sensoryTags: tags(["สมุนไพร", "herbal"], ["ดอกขาว", "white blossom"]),
      },
    ],
    originName: text("สวนชาขาวล็อต 12", "White Tea Garden Lot 12"),
    originProvince: "เชียงราย",
    locality: "เทิง",
    producerOrCommunity: text("กลุ่มวนเกษตรเชิงเขา", "Foothill Agroforestry Group"),
    altitudeMeters: [1_300, 1_550],
    varietal: "Typica",
    tasteNotes: tags(["ชาขาว", "white tea"], ["ส้มโอ", "pomelo"], ["ดอกส้ม", "orange blossom"]),
    brewMethods: ["filter", "cold-brew"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("ไวต์ทีฟิลเตอร์กลิ่นบางและสะอาด ส้มโอเอสเปรสโซโซดาขมปลายนิดเดียวแต่สดชื่นดี", "The White Tea Filter was delicate and clean; the Pomelo Espresso Soda had just a little pithy bitterness and was refreshing."),
  },
  {
    menus: [
      {
        name: text("สตรอว์เบอร์รีฮันนีคอฟฟี่", "Strawberry Honey Coffee"),
        description: text("กาแฟน้ำผึ้งกับสตรอว์เบอร์รี เปรี้ยวหวานและบอดี้นุ่ม", "Honey coffee with strawberry, balanced sweetness, and a soft body."),
        price: 120,
        sensoryTags: tags(["สตรอว์เบอร์รี", "strawberry"], ["น้ำผึ้ง", "honey"]),
      },
      {
        name: text("ฟอเรสต์ฟรุตโทนิก", "Forest Fruit Tonic"),
        description: text("กาแฟโทนิกกับผลไม้แดงและเลมอน", "Coffee tonic with red fruit and lemon."),
        price: 115,
        sensoryTags: tags(["ผลไม้แดง", "red fruit"], ["เลมอน", "lemon"]),
      },
      {
        name: text("ฮันนีฟอเรสต์ฟิลเตอร์", "Honey Forest Filter"),
        description: text("ฟิลเตอร์หวานนุ่ม กลิ่นสตรอว์เบอร์รีและคาราเมล", "Sweet, soft filter with strawberry and caramel notes."),
        price: 130,
        sensoryTags: tags(["สตรอว์เบอร์รี", "strawberry"], ["คาราเมล", "caramel"]),
      },
    ],
    originName: text("ป่าต้นน้ำล็อต 13", "Headwater Forest Lot 13"),
    originProvince: "น่าน",
    locality: "ภูเพียง",
    producerOrCommunity: text("กลุ่มผู้ปลูกกาแฟรักษ์ป่าต้นแบบ", "Forest-Friendly Growers Collective"),
    altitudeMeters: [1_200, 1_430],
    varietal: "Java",
    tasteNotes: tags(["สตรอว์เบอร์รี", "strawberry"], ["เลมอน", "lemon"], ["คาราเมล", "caramel"]),
    brewMethods: ["filter", "aeropress", "espresso"],
    roasterProvince: "เชียงราย",
    roasterLocality: "โรงคั่วคู่ค้า",
    reviewTwo: text("ใช้เวลาทำงานกับฮันนีฟอเรสต์ฟิลเตอร์หนึ่งชั่วโมง มุมด้านในสงบและกาแฟหวานนุ่มแม้ปล่อยให้เย็น", "I worked for an hour with a Honey Forest Filter; the inside corner was calm and the coffee stayed softly sweet as it cooled."),
  },
] as const;

function buildDetail(seed: DetailSeed, index: number): FinderCafeDetail {
  const finderRecord = demoFinderCafeRecords[index];
  const { cafe, unseenNearby } = finderRecord;
  const offering = cafe.offerings[0];
  const sequence = String(index + 1).padStart(2, "0");
  const recommendedMenus = seed.menus.map((menu, menuIndex): FinderRecommendedMenu => ({
    id: `finder-menu-${sequence}-${menuIndex + 1}`,
    name: menu.name,
    description: menu.description,
    price: { amount: menu.price, currency: "THB" },
    sensoryTags: menu.sensoryTags,
    usesFeaturedSingleOrigin: menuIndex !== 1,
  }));
  const workReview = cafe.badges.includes("workation-friendly");
  const firstMenu = recommendedMenus[0];
  const secondReviewMenuIds = recommendedMenus
    .filter((menu) => seed.reviewTwo.th.includes(menu.name.th))
    .map((menu) => menu.id);

  return {
    cafeId: cafe.id,
    recommendedMenus,
    singleOrigin: {
      name: seed.originName,
      origin: {
        country: "Thailand",
        province: seed.originProvince,
        locality: seed.locality,
      },
      producerOrCommunity: seed.producerOrCommunity,
      altitudeMeters: {
        min: seed.altitudeMeters[0],
        max: seed.altitudeMeters[1],
      },
      varietal: seed.varietal,
      process: offering.process,
      processingLocation: {
        province: seed.originProvince,
        locality: seed.locality,
      },
      roastLevel: offering.roastLevel,
      tasteNotes: seed.tasteNotes,
      tasteProfiles: offering.tasteProfiles,
      brewMethods: seed.brewMethods,
      roasterLocation: {
        province: seed.roasterProvince,
        locality: seed.roasterLocality,
      },
    },
    customerReviews: [
      {
        id: `finder-review-${sequence}-1`,
        reviewerName: `ผู้เดินทาง ${sequence}A`,
        rating: 5,
        body: text(
          `แวะหลังเดินชม${unseenNearby}แล้วสั่ง${firstMenu.name.th} กลิ่น${firstMenu.sensoryTags[0].th}ชัดและดื่มสดชื่น`,
          `I stopped after visiting ${unseenNearby} and ordered the ${firstMenu.name.en}; its ${firstMenu.sensoryTags[0].en} note was clear and refreshing.`,
        ),
        referencedMenuIds: [firstMenu.id],
        mentionsUnseenNearby: true,
        workContext: false,
      },
      {
        id: `finder-review-${sequence}-2`,
        reviewerName: `ผู้เดินทาง ${sequence}B`,
        rating: 4,
        body: seed.reviewTwo,
        referencedMenuIds: secondReviewMenuIds,
        mentionsUnseenNearby: false,
        workContext: workReview,
      },
    ],
  };
}

if (detailSeeds.length !== demoFinderCafeRecords.length) {
  throw new Error("Every finder cafe must have exactly one detail seed.");
}

export const demoFinderCafeDetails: readonly FinderCafeDetail[] = detailSeeds.map(buildDetail);

export const finderCafeDetailById: ReadonlyMap<string, FinderCafeDetail> = new Map(
  demoFinderCafeDetails.map((detail) => [detail.cafeId, detail]),
);

export function getFinderCafeDetail(cafeId: string): FinderCafeDetail | undefined {
  return finderCafeDetailById.get(cafeId);
}
