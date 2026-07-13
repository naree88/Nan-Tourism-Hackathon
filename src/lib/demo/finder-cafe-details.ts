import type {
  BrewMethod,
  CoffeeProcess,
  LocalizedText,
  Money,
  RoastLevel,
  TasteProfile,
} from "../domain/types";
import { demoFinderCafeRecords, finderCafeSpecs } from "./finder-cafes";

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
        name: text("ห้วยโทนฟิลเตอร์ไฟลต์", "Huai Ton Filter Flight"),
        description: text("ฟิลเตอร์สองแก้วเล็กเพื่อเทียบอุณหภูมิและความหวานของผลไม้", "Two small filter pours to compare fruit sweetness as they cool."),
        price: 145,
        sensoryTags: tags(["เบอร์รี", "berry"], ["หวานฉ่ำ", "juicy"]),
      },
    ],
    reviewTwo: text("นั่งทำงานช่วงเช้ากับห้วยโทนฟิลเตอร์ไฟลต์ โต๊ะวางโน้ตบุ๊กได้สบายและกาแฟยังหอมเมื่อเย็นลง", "I worked here in the morning with the Huai Ton Filter Flight; the table fit my laptop and the coffee stayed aromatic as it cooled."),
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
    reviewTwo: text("ไนต์วอล์กฟิลเตอร์กลิ่นมะลิชัด พอเย็นลงเจอองุ่นขาว ส่วนแจสมินยูซุคอฟฟี่ดื่มสนุกกว่า", "The Night Walk Filter was distinctly jasmine-like and revealed white grape as it cooled; the Jasmine Yuzu Coffee was the more playful drink."),
  },
  {
    menus: [
      {
        name: text("เรดเกรปโคลด์บรูว์", "Red Grape Cold Brew"),
        description: text("โคลด์บรูว์กับองุ่นแดงและส้มแมนดาริน ให้ความหวานฉ่ำและปลายสะอาด", "Cold brew with red grape and mandarin for juicy sweetness and a clean finish."),
        price: 115,
        sensoryTags: tags(["องุ่นแดง", "red grape"], ["ฉ่ำ", "juicy"]),
      },
      {
        name: text("แมนดารินเอสเปรสโซโทนิก", "Mandarin Espresso Tonic"),
        description: text("เอสเปรสโซโทนิกกับส้มแมนดาริน สดชื่นและหวานซ่า", "Espresso tonic with mandarin for a bright, sparkling sweetness."),
        price: 120,
        sensoryTags: tags(["แมนดาริน", "mandarin"], ["ผลไม้", "fruity"]),
      },
      {
        name: text("ริเวอร์ไซด์ฟิลเตอร์", "Riverside Filter"),
        description: text("ฟิลเตอร์บอดี้นุ่ม กลิ่นองุ่นแดง เชอร์รี และโกโก้บาง ๆ", "Soft-bodied filter with red grape, cherry, and a touch of cacao."),
        price: 130,
        sensoryTags: tags(["เชอร์รี", "cherry"], ["องุ่นแดง", "red grape"]),
      },
    ],
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
    reviewTwo: text("ไวต์ทีฟิลเตอร์กลิ่นบางและสะอาด ส้มโอเอสเปรสโซโซดาขมปลายนิดเดียวแต่สดชื่นดี", "The White Tea Filter was delicate and clean; the Pomelo Espresso Soda had just a little pithy bitterness and was refreshing."),
  },
  {
    menus: [
      {
        name: text("เรดฟรุตฮันนีคอฟฟี่", "Red Fruit Honey Coffee"),
        description: text("กาแฟน้ำผึ้งกับผลไม้แดง เปรี้ยวหวานและบอดี้นุ่ม", "Honey coffee with red fruit, balanced sweetness, and a soft body."),
        price: 120,
        sensoryTags: tags(["ผลไม้แดง", "red fruit"], ["น้ำผึ้ง", "honey"]),
      },
      {
        name: text("ฟอเรสต์ฟรุตโทนิก", "Forest Fruit Tonic"),
        description: text("กาแฟโทนิกกับผลไม้แดงและเลมอน", "Coffee tonic with red fruit and lemon."),
        price: 115,
        sensoryTags: tags(["ผลไม้แดง", "red fruit"], ["เลมอน", "lemon"]),
      },
      {
        name: text("ฮันนีฟอเรสต์ฟิลเตอร์", "Honey Forest Filter"),
        description: text("ฟิลเตอร์หวานนุ่ม กลิ่นผลไม้แดงและคาราเมล", "Sweet, soft filter with red-fruit and caramel notes."),
        price: 130,
        sensoryTags: tags(["ผลไม้แดง", "red fruit"], ["คาราเมล", "caramel"]),
      },
    ],
    reviewTwo: text("ใช้เวลาทำงานกับฮันนีฟอเรสต์ฟิลเตอร์หนึ่งชั่วโมง มุมด้านในสงบและกาแฟหวานนุ่มแม้ปล่อยให้เย็น", "I worked for an hour with a Honey Forest Filter; the inside corner was calm and the coffee stayed softly sweet as it cooled."),
  },
] as const;

function buildDetail(seed: DetailSeed, index: number): FinderCafeDetail {
  const finderRecord = demoFinderCafeRecords[index];
  const coffee = finderCafeSpecs[index];
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
      name: coffee.beanName,
      origin: {
        country: "Thailand",
        province: coffee.originProvince,
        locality: coffee.originLocality,
      },
      producerOrCommunity: coffee.producerOrCommunity,
      altitudeMeters: {
        min: coffee.altitudeMeters[0],
        max: coffee.altitudeMeters[1],
      },
      varietal: coffee.varietal,
      process: offering.process,
      processingLocation: {
        province: coffee.processingProvince,
        locality: coffee.processingLocality,
      },
      roastLevel: offering.roastLevel,
      tasteNotes: coffee.tastingNotes,
      tasteProfiles: offering.tasteProfiles,
      brewMethods: coffee.brewMethods,
      roasterLocation: {
        province: coffee.roasterProvince,
        locality: coffee.roasterLocality,
      },
    },
    customerReviews: [
      {
        id: `finder-review-${sequence}-1`,
        reviewerName: `ผู้เดินทาง ${sequence}A`,
        rating: 5,
        body: text(
          `แวะหลังเดินชม${unseenNearby}แล้วสั่ง${firstMenu.name.th} กลิ่น${firstMenu.sensoryTags[0].th}ชัดและเข้ากับเมนู`,
          `I stopped after visiting ${unseenNearby} and ordered the ${firstMenu.name.en}; its ${firstMenu.sensoryTags[0].en} note was clear and suited the drink.`,
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
