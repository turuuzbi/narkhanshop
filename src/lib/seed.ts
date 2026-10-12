/**
 * Demo data. Used by `npm run seed` and by the admin "Reset demo data" button.
 * Prices are realistic placeholders and can be edited in /admin.
 */
import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { SIZES } from "./constants";
import { placeholderSvg } from "./placeholder";
import { parsePromotion } from "./promotion-schema";
import { priceCart, type PromotionDTO } from "./promotions";

const C = {
  black: { name: "Хар", hex: "#1E1A1C" },
  white: { name: "Цагаан", hex: "#FAF7F2" },
  cream: { name: "Цөцгий", hex: "#EFE2CC" },
  pink: { name: "Ягаан", hex: "#F2B8C6" },
  lightpink: { name: "Цайвар ягаан", hex: "#F6D5DE" },
  hotpink: { name: "Тод ягаан", hex: "#E0559A" },
  blue: { name: "Цэнхэр", hex: "#5B9BD5" },
  lightblue: { name: "Цайвар цэнхэр", hex: "#BCD3EE" },
  navy: { name: "Хар хөх", hex: "#1F2A44" },
  burgundy: { name: "Бордо", hex: "#6E1A35" },
  purple: { name: "Нил ягаан", hex: "#5B2A5E" },
  sage: { name: "Ногоон", hex: "#A9BFA8" },
  red: { name: "Улаан", hex: "#C8102E" },
  grey: { name: "Саарал", hex: "#9AA3B0" },
  leopard: { name: "Ирвэс хээ", hex: "#A47C5B" },
  brown: { name: "Бор", hex: "#5A3A3A" },
  taupe: { name: "Бор саарал", hex: "#8B7A74" },
} as const;
type ColorKey = keyof typeof C;

const CATEGORIES = [
  { slug: "bras", name: "Хөхний даруулга", styles: ["Non-padded", "Soft-cup", "Padded", "Push-up", "Super push-up"] },
  { slug: "panties", name: "Дотуур өмд", styles: ["Thong", "Brazilian", "Brief", "Ruffle"] },
  { slug: "pajamas", name: "Унтлагын хувцас", styles: ["Сатин", "Хөвөн", "Муслин", "Жерси"] },
  { slug: "tops", name: "Цамц", styles: ["Урт ханцуйтай", "Богино ханцуйтай"] },
];

// [slug, name, category, style, price, salePrice, colors, flags (n=new f=featured), packSize, stock XS,S,M,L,XL, description]
type Row = [string, string, string, string, number, number | null, ColorKey[], string, number, string, string];
const PRODUCTS: Row[] = [
  ["bra-blue-lace-nonpadded", "Цэнхэр нэхсэн торон даруулга", "bras", "Non-padded", 55000, null, ["blue"], "n", 1, "2,4,3,0,1",
    "Жийргэвчгүй, зөөлөн нэхсэн тортой хөнгөн загвар. Өдөр тутам өмсөхөд эвтэйхэн, байгалийн хэлбэр өгнө."],
  ["bra-cream-softcup", "Цөцгийн өнгөтэй зөөлөн аягатай даруулга", "bras", "Soft-cup", 49000, null, ["cream"], "", 1, "3,5,4,2,0",
    "Утасгүй зөөлөн аяга, гөлгөр даавуу. Цамцан дотуур мэдэгдэхгүй, өдөржин тухтай."],
  ["bra-black-lace-padded", "Хар нэхсэн торон жийргэвчтэй даруулга", "bras", "Padded", 59000, 52000, ["black"], "f", 1, "1,3,5,2,1",
    "Нимгэн жийргэвчтэй, гоёмсог нэхсэн тортой. Хэлбэрээ сайн барина, оройн хувцастай ч зохино."],
  ["bra-sage-pushup", "Ногоон push-up даруулга", "bras", "Push-up", 65000, null, ["sage"], "n", 1, "0,2,3,1,0",
    "Зөөлөн өргөлттэй push-up аяга, торгомсог даавуу. Сааралдуу ногоон өнгө нь энэ улирлын шинэ хандлага."],
  ["bra-red-super-pushup", "Улаан super push-up даруулга", "bras", "Super push-up", 75000, null, ["red"], "", 1, "1,2,2,0,0",
    "Хамгийн их өргөлттэй super push-up. Тод улаан нэхсэн тор — онцгой үдэшт зориулсан."],
  ["bra-white-lace-balconette", "Цагаан нэхсэн торон балконет", "bras", "Soft-cup", 69000, null, ["white", "cream"], "nf", 1, "2,3,1,2,1",
    "Балконет зүсэлттэй, цэцгэн нэхсэн тортой зөөлөн аяга. Нэхсэн торон дотуур өмдтэй хослуулахад төгс."],

  ["panty-plum-heart-ruffle", "Зүрхэн хээтэй хуниастай thong", "panties", "Ruffle", 19000, null, ["burgundy"], "", 1, "3,6,4,2,1",
    "Зөөлөн торгомсог даавуу, ирмэгээрээ хуниастай. Жижиг зүрхэн хээ нь эмэгтэйлэг өнгө аяс нэмнэ."],
  ["panty-burgundy-lace-brazilian", "Бордо & ягаан нэхсэн торон бразил", "panties", "Brazilian", 22000, null, ["burgundy", "pink"], "f", 1, "2,5,3,2,0",
    "Хоёр өнгийн нэхсэн тортой бразил зүсэлт. Гоёмсог боловч өдөр тутамд эвтэйхэн."],
  ["panty-white-polka-bow-thong", "Цэгэн хээтэй, туузан зангиатай thong", "panties", "Thong", 18000, null, ["white"], "n", 1, "4,5,3,0,2",
    "Хар цэгэн хээтэй цагаан thong, урд талдаа жижиг туузан зангиатай. Амьсгалдаг хөвөн даавуу."],
  ["panty-pink-rib-lace-pack", "Ягаан & хар нэхсэн тортой — 3 ширхэг", "panties", "Thong", 45000, null, ["pink", "black", "white"], "", 3, "2,4,4,3,1",
    "Хэмнэлттэй 3 ширхэгийн багц: судалтай ягаан, хар нэхсэн тор, цэгэн хээ. Өдөр бүр өөр өнгө."],
  ["panty-navy-polka-rosette-pack", "Хар хөх цэгэн хээтэй — 3 ширхэг", "panties", "Thong", 42000, null, ["navy", "white"], "", 3, "1,3,2,2,0",
    "Сарнай чимэглэлтэй хар хөх, цагаан өнгийн 3 ширхэгийн багц. Нэхсэн торон ирмэгтэй, зөөлөн хөвөн."],
  ["panty-blue-lace-brief", "Цэнхэр нэхсэн торон дотуур өмд", "panties", "Brief", 22000, null, ["blue"], "", 1, "2,3,3,1,2",
    "Бүтэн бүрхэлттэй, бүхэлдээ нэхсэн тортой загвар. Цэнхэр даруулгатай хослуулж болно."],
  ["panty-pink-floral-rosette-thong", "Цэцгэн хээтэй, сарнайтай thong", "panties", "Thong", 19000, null, ["lightpink"], "", 1, "3,4,2,2,1",
    "Цайвар ягаан цэцгэн хээ, урд талдаа жижиг сарнай чимэглэлтэй нэхсэн торон thong."],
  ["panty-cotton-thong-3pack", "Хөвөн thong — 3 ширхэг", "panties", "Thong", 39000, 33000, ["navy", "grey", "white"], "f", 3, "5,8,6,4,3",
    "Хамгийн их борлуулалттай хөвөн thong: хар хөх, саарал, цагаан. Ул мөр үлдээхгүй, өдөр тутмын үндсэн сонголт."],
  ["panty-hotpink-lace-brazilian", "Тод ягаан нэхсэн торон бразил", "panties", "Brazilian", 21000, null, ["hotpink"], "", 1, "2,2,3,0,1",
    "Бүхэлдээ нэхсэн тортой тод ягаан бразил. Цагаан ирмэг нь өнгийг улам тодруулна."],
  ["panty-purple-lace-brazilian", "Нил ягаан нэхсэн торон бразил", "panties", "Brazilian", 22000, null, ["purple"], "", 1, "1,3,2,2,0",
    "Гүн нил ягаан өнгө, цагаан нэхсэн торон бүстэй. Гоёмсог бөгөөд эвтэйхэн."],
  ["panty-leopard-thong-pack", "Ирвэс хээтэй thong — 3 ширхэг", "panties", "Thong", 45000, null, ["leopard", "black", "white"], "n", 3, "2,4,3,3,2",
    "Ирвэс хээ, хар, цагаан — улирлын хамгийн их эрэлттэй багц. Уян хатан, гөлгөр даавуу."],
  ["panty-cream-floral-ruffle-pack", "Цэцгэн хээтэй хуниастай — 3 ширхэг", "panties", "Ruffle", 42000, null, ["cream", "pink", "white"], "", 3, "3,3,4,1,2",
    "Зөөлөн цэцгэн хээтэй, хуниастай ирмэгтэй 3 ширхэгийн багц. Хөвөн даавуу, өдөржин тухтай."],

  ["pj-black-satin-piping", "Хар сатин унтлагын хослол", "pajamas", "Сатин", 119000, null, ["black"], "f", 1, "1,3,4,2,1",
    "Цагаан хоолойвчтой хар сатин хослол. Гөлгөр, хөнгөн даавуу — өөртөө ч, бэлэг болгоход ч тансаг."],
  ["pj-pink-satin", "Ягаан сатин унтлагын хослол", "pajamas", "Сатин", 119000, 99000, ["lightpink"], "f", 1, "2,2,3,1,0",
    "Зөөлөн ягаан сатин, ягаан хоолойвчтой. Урт ханцуй, сул өмдтэй сонгодог загвар."],
  ["pj-black-polka-satin", "Цэгэн хээтэй хар сатин хослол", "pajamas", "Сатин", 125000, null, ["black"], "n", 1, "1,2,2,1,1",
    "Цагаан цэгэн хээтэй хар сатин хослол. Сонгодог загвар, тансаг мэдрэмж."],
  ["pj-cream-floral-cotton", "Цөцгийн цэцгэн хээтэй хөвөн хослол", "pajamas", "Хөвөн", 99000, null, ["cream"], "", 1, "2,3,3,2,1",
    "Нарийн цэцгэн хээтэй, 100% хөвөн даавуу. Амьсгалдаг, угаахад хялбар."],
  ["pj-blue-floral", "Цайвар цэнхэр цэцгэн хээтэй хослол", "pajamas", "Хөвөн", 99000, null, ["lightblue"], "", 1, "1,4,2,2,0",
    "Цайвар цэнхэр өнгөтэй, жижиг цэцгэн хээтэй хөвөн хослол. Хавар, зунд тохиромжтой."],
  ["pj-pink-striped", "Ягаан судалтай хөвөн хослол", "pajamas", "Хөвөн", 95000, null, ["pink"], "", 1, "2,2,3,3,1",
    "Нарийн судалтай ягаан хослол, сул загвар. Хөнгөн хөвөн даавуу."],
  ["pj-pink-muslin", "Ягаан муслин унтлагын хослол", "pajamas", "Муслин", 89000, null, ["lightpink"], "", 1, "1,3,2,1,2",
    "Давхар муслин даавуу — зөөлөн, агаар сайн нэвтрүүлнэ. Цээжиндээ халаастай."],
  ["pj-navy-floral", "Хар хөх цэцгэн хээтэй хослол", "pajamas", "Муслин", 99000, null, ["navy"], "", 1, "0,2,3,2,1",
    "Хар хөх дэвсгэр дээр цэцгэн хээтэй муслин хослол. Сонгодог бөгөөд гоёмсог."],
  ["pj-navy-jersey", "Хар хөх жерси хослол", "pajamas", "Жерси", 89000, null, ["navy"], "", 1, "2,3,2,2,2",
    "Уян зөөлөн жерси даавуу, тайван загвар. Амралтын өдөр гэртээ өмсөхөд төгс."],
  ["pj-cream-jersey", "Цөцгийн өнгөтэй жерси хослол", "pajamas", "Жерси", 89000, null, ["cream"], "", 1, "1,2,2,0,1",
    "Цөцгийн өнгөтэй уян жерси, зөөлөн хүрэлттэй. Өдөр бүр өмсөх дуртай хослол тань болно."],
  ["pj-leopard-set", "Ирвэс хээтэй урт ханцуйтай хослол", "pajamas", "Жерси", 129000, null, ["leopard"], "nf", 1, "1,2,2,1,1",
    "Шинэ ирэлт! Ирвэс хээтэй, богино цамцтай уян жерси хослол. Гэрээс гадна ч өмсөж болно."],

  ["top-burgundy-stripe", "Бордо судалтай урт ханцуйтай цамц", "tops", "Урт ханцуйтай", 39000, null, ["burgundy", "white"], "", 1, "2,3,3,2,1",
    "Завь хүзүүвчтэй, бордо судалтай уян цамц. Жинсэн өмд, юбкатай аль алинтай нь зохино."],
  ["top-brown-longsleeve", "Бор урт ханцуйтай цамц", "tops", "Урт ханцуйтай", 35000, null, ["brown"], "", 1, "2,4,3,2,0",
    "Нягт уян даавуутай суурь цамц. Дангаар нь ч, давхарлаж ч өмсөхөд тохиромжтой."],
  ["top-black-longsleeve", "Хар урт ханцуйтай цамц", "tops", "Урт ханцуйтай", 35000, null, ["black"], "", 1, "3,5,4,3,2",
    "Хамгийн хэрэгтэй суурь хувцас — хар урт ханцуйтай цамц. Угаасан ч хэлбэрээ алдахгүй."],
  ["top-taupe-tee", "Бор саарал биед таарсан футболк", "tops", "Богино ханцуйтай", 35000, 29000, ["taupe"], "n", 1, "1,3,2,2,1",
    "Биед таарсан, зөөлөн уян даавуутай футболк. Тайван бор саарал өнгө."],
];

const SALE_L_SLUGS = ["pj-pink-striped", "pj-navy-jersey", "pj-blue-floral", "top-black-longsleeve", "top-burgundy-stripe", "panty-leopard-thong-pack"];

// [name, phone, district, khoroo, address, status, hoursAgo, delivery, payment, source, items "slug:size:qty", note]
type OrderRow = [string, string, string, string, string, string, number, string, string, string, string[], string?];
const ORDERS: OrderRow[] = [
  ["Б. Сарангэрэл", "99001101", "Баянзүрх", "4", "13-р хороолол, 45-р байр, 2-р орц, 34 тоот", "new", 0.6, "express", "storepay", "web", ["pj-black-satin-piping:M:1", "panty-cotton-thong-3pack:M:1"], "Оройн 6 цагаас хойш хүргэнэ үү"],
  ["Т. Номин", "88002202", "Хан-Уул", "11", "Нисэх, Шинэ Яармаг хотхон, 112-р байр, 56 тоот", "new", 2.5, "standard", "pocketzero", "instagram", ["panty-leopard-thong-pack:S:1", "panty-white-polka-bow-thong:S:2"]],
  ["Э. Анужин", "95003303", "Сүхбаатар", "1", "Seoul street, 23-р байр, 8 тоот", "new", 20, "standard", "bank", "web", ["bra-white-lace-balconette:S:1", "panty-pink-floral-rosette-thong:S:1"]],
  ["Г. Мөнхзул", "99004404", "Чингэлтэй", "3", "Их тойруу, 15-р байр, 41 тоот", "confirmed", 27, "express", "storepay", "facebook", ["pj-leopard-set:L:1"]],
  ["Д. Хулан", "88005505", "Баянгол", "16", "10-р хороолол, 7-р байр, 3-р орц, 72 тоот", "confirmed", 33, "standard", "storepay", "web", ["pj-pink-striped:L:1", "top-black-longsleeve:L:1"], "Sale L"],
  ["О. Солонго", "99006606", "Сонгинохайрхан", "20", "Толгойт, 3-р гудамж, 18 тоот", "confirmed", 44, "standard", "bank", "instagram", ["panty-cream-floral-ruffle-pack:XL:1", "pj-navy-jersey:XL:1"], "XL бэлэг"],
  ["Н. Энхжин", "95007707", "Хан-Уул", "15", "Ривер гарден, 302-р байр, 1204 тоот", "shipping", 52, "express", "pocketzero", "web", ["bra-black-lace-padded:M:1", "panty-burgundy-lace-brazilian:M:2"]],
  ["С. Цэлмэг", "88008808", "Баянзүрх", "26", "Зайсан, Хилл хотхон, 5-р байр, 22 тоот", "shipping", 70, "standard", "storepay", "web", ["pj-cream-floral-cotton:S:1", "top-taupe-tee:S:1"]],
  ["А. Уянга", "99009909", "Сүхбаатар", "8", "Хүнсний 4-р дэлгүүрийн хойно, 3-р байр, 15 тоот", "delivered", 96, "standard", "storepay", "web", ["pj-pink-satin:M:1"]],
  ["Ц. Оюунаа", "88001010", "Баянгол", "5", "3, 4-р хороолол, 22-р байр, 9 тоот", "delivered", 120, "express", "bank", "instagram", ["panty-pink-rib-lace-pack:M:1", "bra-cream-softcup:M:1"]],
  ["Ж. Марал", "95001212", "Чингэлтэй", "19", "Хайлааст, 61-р байр, 33 тоот", "delivered", 140, "standard", "pocketzero", "web", ["top-burgundy-stripe:M:1", "top-brown-longsleeve:M:1", "panty-cotton-thong-3pack:S:1"]],
  ["П. Гэрэлмаа", "99001313", "Налайх", "2", "2-р хороо, 14-р байр, 6 тоот", "cancelled", 150, "standard", "storepay", "facebook", ["pj-black-polka-satin:L:1"], "Хэмжээ солих хүсэлтээр цуцлав"],
];

/** Photos shipped in public/products (cropped from the shop's Instagram). */
const BUNDLED_PHOTOS = new Set(
  PRODUCTS.map(([slug]) => slug).filter((slug) => !slug.startsWith("bra-")),
);

function productImages(slug: string, category: string, hex: string): string[] {
  const productsDir = path.join(process.cwd(), "public", "products");
  if (fs.existsSync(productsDir)) {
    // Local: any <slug>.jpg|png|webp dropped into public/products is picked up.
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      if (fs.existsSync(path.join(productsDir, `${slug}.${ext}`))) return [`/products/${slug}.${ext}`];
    }
  } else if (BUNDLED_PHOTOS.has(slug)) {
    // Serverless (Vercel): public/ is served from the CDN and isn't on the function's disk.
    return [`/products/${slug}.jpg`];
  }
  const files = [`${slug}.svg`, `${slug}-2.svg`];
  try {
    const dir = path.join(process.cwd(), "public", "placeholders");
    fs.mkdirSync(dir, { recursive: true });
    files.forEach((f, i) => {
      const fp = path.join(dir, f);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, placeholderSvg(category, hex, (i + 1) as 1 | 2));
    });
  } catch {
    // Read-only filesystem (e.g. Vercel): placeholders are committed to the repo.
  }
  return files.map((f) => `/placeholders/${f}`);
}

export function writeCategoryPlaceholders() {
  try {
    const dir = path.join(process.cwd(), "public", "placeholders");
    fs.mkdirSync(dir, { recursive: true });
    for (const c of CATEGORIES) {
      const fp = path.join(dir, `${c.slug}.svg`);
      if (!fs.existsSync(fp)) fs.writeFileSync(fp, placeholderSvg(c.slug, "#F4C7CF"));
    }
  } catch {
    /* read-only filesystem */
  }
}

export async function seedDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.promotion.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
  writeCategoryPlaceholders();

  const catIds: Record<string, string> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.create({ data: { name: c.name, slug: c.slug, styles: JSON.stringify(c.styles), sortOrder: i } });
    catIds[c.slug] = row.id;
  }

  const products: Record<string, { id: string; price: number; salePrice: number | null; name: string; image: string; category: string; color: string }> = {};
  const base = Date.now();
  for (const [i, [slug, name, cat, style, price, salePrice, colors, flags, packSize, stock, description]] of PRODUCTS.entries()) {
    const colorList = colors.map((k) => C[k]);
    const images = productImages(slug, cat, colorList[0].hex);
    const stocks = stock.split(",").map(Number);
    const row = await prisma.product.create({
      data: {
        slug, name, description, style, price, salePrice, packSize,
        categoryId: catIds[cat],
        colors: JSON.stringify(colorList),
        images: JSON.stringify(images),
        isNew: flags.includes("n"),
        isFeatured: flags.includes("f"),
        // Stagger createdAt so "newest" sorting is stable and meaningful.
        createdAt: new Date(base - (PRODUCTS.length - i) * 3600_000 - (flags.includes("n") ? -86400_000 : 0)),
        variants: { create: SIZES.map((size, j) => ({ size, stock: stocks[j] ?? 0 })) },
      },
    });
    products[slug] = { id: row.id, price, salePrice, name, image: images[0], category: cat, color: colorList[0].name };
  }

  const promoRows = await prisma.$transaction([
    prisma.promotion.create({
      data: {
        title: "Sale L",
        description: "Сонгосон L хэмжээтэй бараанууд −30% хямдралтай. Хэмжээгээ сонгоход үнэ автоматаар буурна.",
        type: "size_discount",
        rule: JSON.stringify({ size: "L", percent: 30, productIds: SALE_L_SLUGS.map((s) => products[s].id) }),
        bannerColor: "#6B1E3A",
      },
    }),
    prisma.promotion.create({
      data: {
        title: "XL бэлэг",
        description: "XL хэмжээтэй 1 хослол эсвэл 3 дотуур өмд авбал 2 бэлэг бараа үнэгүй дагалдана.",
        type: "size_gift",
        rule: JSON.stringify({ size: "XL", minSets: 1, minPanties: 3, giftCount: 2 }),
        bannerColor: "#F4C7CF",
      },
    }),
  ]);
  const promos = promoRows.map(parsePromotion).filter((p): p is PromotionDTO => p !== null);

  await prisma.setting.createMany({
    data: [
      ["phone", "95601111"],
      ["instagram", "narkhan_shop"],
      ["facebook", "Narkhan shop"],
      ["deliveryStandard", "5000"],
      ["deliveryExpress", "10000"],
      ["deliveryExpressFar", "15000"],
      ["labelStorepay", "Storepay"],
      ["labelPocketzero", "Pocket Zero"],
      ["labelBank", "Дансаар шилжүүлэх"],
      ["labelCash", "Хүргэлтээр төлөх"],
      ["bankAccount", "Хаан банк · 5000 123 456 · Нархан (демо данс)"],
    ].map(([key, value]) => ({ key, value })),
  });

  for (const [i, [customerName, phone, district, khoroo, address, status, hoursAgo, deliveryType, paymentMethod, source, items, note]] of ORDERS.entries()) {
    const lines = items.map((s) => {
      const [slug, size, qty] = s.split(":");
      return { ...products[slug], size, qty: Number(qty), slug };
    });
    const priced = priceCart(lines, promos);
    const fee = deliveryType === "standard" ? 5000 : district === "Налайх" ? 15000 : 10000;
    const seq = 1001 + i;
    await prisma.order.create({
      data: {
        seq,
        number: `NK-${seq}`,
        customerName, phone, district, khoroo, address,
        note: note ?? null,
        deliveryType, paymentMethod, status, source,
        deliveryFee: fee,
        subtotal: priced.subtotal,
        discount: priced.discount,
        total: priced.itemsTotal + fee,
        giftNote: note === "XL бэлэг" ? "XL бэлэг: 2 бэлэг бараа" : null,
        createdAt: new Date(base - hoursAgo * 3600_000),
        items: {
          create: priced.lines.map((l) => ({
            productId: l.id, name: l.name, image: l.image, size: l.size, color: l.color, unitPrice: l.unit, quantity: l.qty,
          })),
        },
      },
    });
  }

  return { products: PRODUCTS.length, orders: ORDERS.length };
}
