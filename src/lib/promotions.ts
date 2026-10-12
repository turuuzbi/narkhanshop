/**
 * Pure pricing + promotion logic, shared by the storefront (client) and the
 * order-creation code (server) so both always agree on the numbers.
 * Kept dependency-free so it stays small in the client bundle (Zod schemas live in promotion-schema.ts).
 */
import { CATEGORY_SLUGS, FAR_DISTRICTS, isSize, type DeliveryType, type Size } from "./constants";

export type SizeDiscountRule = { size: Size; percent: number; productIds: string[] };
export type SizeGiftRule = { size: Size; minSets: number; minPanties: number; giftCount: number };

type PromoBase = { id: string; title: string; description: string; active: boolean; bannerColor: string };
export type PromotionDTO =
  | (PromoBase & { type: "size_discount"; rule: SizeDiscountRule })
  | (PromoBase & { type: "size_gift"; rule: SizeGiftRule });

type Priceable = { id: string; price: number; salePrice: number | null };

/** Rounds to the nearest 100₮, like a real price tag. */
const round100 = (n: number) => Math.round(n / 100) * 100;

export function unitPrice(product: Priceable, size: string | null, promos: PromotionDTO[]) {
  let unit = product.salePrice ?? product.price;
  let promo: { id: string; title: string; percent: number } | null = null;
  if (size) {
    for (const p of promos) {
      if (!p.active || p.type !== "size_discount") continue;
      if (p.rule.size !== size || !p.rule.productIds.includes(product.id)) continue;
      const discounted = round100((product.price * (100 - p.rule.percent)) / 100);
      if (discounted < unit) {
        unit = discounted;
        promo = { id: p.id, title: p.title, percent: p.rule.percent };
      }
    }
  }
  return { unit, original: product.price, promo };
}

/** Size-specific discounts that apply to a product (for badges on cards). */
export function sizeDiscountsFor(productId: string, promos: PromotionDTO[]) {
  return promos.flatMap((p) =>
    p.active && p.type === "size_discount" && p.rule.productIds.includes(productId)
      ? [{ size: p.rule.size as Size, percent: p.rule.percent, title: p.title }]
      : [],
  );
}

export type GiftLine = { categorySlug: string; size: string; qty: number; packSize: number };

export function giftStatus(lines: GiftLine[], promos: PromotionDTO[]) {
  const out: { promoId: string; title: string; eligible: boolean; message: string; giftCount: number }[] = [];
  for (const p of promos) {
    if (!p.active || p.type !== "size_gift") continue;
    const { size, minSets, minPanties, giftCount } = p.rule;
    const sized = lines.filter((l) => l.size === size && isSize(l.size));
    const sets = sized.filter((l) => l.categorySlug === CATEGORY_SLUGS.pajamas).reduce((s, l) => s + l.qty, 0);
    const panties = sized
      .filter((l) => l.categorySlug === CATEGORY_SLUGS.panties)
      .reduce((s, l) => s + l.qty * Math.max(1, l.packSize), 0);
    const eligible = (minSets > 0 && sets >= minSets) || (minPanties > 0 && panties >= minPanties);
    if (eligible) {
      out.push({ promoId: p.id, title: p.title, eligible, giftCount, message: `${p.title}: танд ${giftCount} бэлэг бараа үнэгүй дагалдана!` });
    } else if (panties > 0) {
      out.push({
        promoId: p.id,
        title: p.title,
        eligible,
        giftCount,
        message: `${size} хэмжээтэй дахиад ${minPanties - panties} дотуур өмд нэмбэл ${giftCount} бэлэг авна.`,
      });
    }
  }
  return out;
}

export type DeliverySettings = { deliveryStandard: number; deliveryExpress: number; deliveryExpressFar: number };

export function deliveryFee(type: DeliveryType, district: string | null | undefined, s: DeliverySettings) {
  if (type === "standard") return s.deliveryStandard;
  return district && FAR_DISTRICTS.includes(district) ? s.deliveryExpressFar : s.deliveryExpress;
}

export type PricedLineInput = Priceable & { size: string; qty: number };

export function priceCart<T extends PricedLineInput>(lines: T[], promos: PromotionDTO[]) {
  let subtotal = 0;
  let total = 0;
  const priced = lines.map((l) => {
    const p = unitPrice(l, l.size, promos);
    subtotal += p.original * l.qty;
    total += p.unit * l.qty;
    return { ...l, ...p };
  });
  return { lines: priced, subtotal, discount: subtotal - total, itemsTotal: total };
}
