import { z } from "zod";
import type { PromotionDTO } from "./promotions";

/** Zod schemas for promotion rules (server-side only, to keep Zod out of the client bundle). */
export const sizeDiscountRule = z.object({
  size: z.enum(["XS", "S", "M", "L", "XL"]),
  percent: z.number().int().min(1).max(90),
  productIds: z.array(z.string()),
});
export const sizeGiftRule = z.object({
  size: z.enum(["XS", "S", "M", "L", "XL"]),
  minSets: z.number().int().min(0),
  minPanties: z.number().int().min(0),
  giftCount: z.number().int().min(1),
});

export function parsePromotion(p: {
  id: string;
  title: string;
  description: string;
  active: boolean;
  bannerColor: string;
  type: string;
  rule: string;
}): PromotionDTO | null {
  let raw: unknown;
  try {
    raw = JSON.parse(p.rule);
  } catch {
    return null;
  }
  const base = { id: p.id, title: p.title, description: p.description, active: p.active, bannerColor: p.bannerColor };
  if (p.type === "size_discount") {
    const r = sizeDiscountRule.safeParse(raw);
    return r.success ? { ...base, type: "size_discount", rule: r.data } : null;
  }
  if (p.type === "size_gift") {
    const r = sizeGiftRule.safeParse(raw);
    return r.success ? { ...base, type: "size_gift", rule: r.data } : null;
  }
  return null;
}
