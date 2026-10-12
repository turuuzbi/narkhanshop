import "server-only";
import type { Category, Prisma, Product, ProductVariant } from "@prisma/client";
import { prisma } from "./db";
import { SIZES } from "./constants";
import { parsePromotion } from "./promotion-schema";
import type { PromotionDTO } from "./promotions";
import { DEFAULT_SETTINGS, NUMERIC_SETTINGS, type ShopSettings } from "./settings";

export type Color = { name: string; hex: string };

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  style: string;
  price: number;
  salePrice: number | null;
  packSize: number;
  colors: Color[];
  images: string[];
  isNew: boolean;
  isFeatured: boolean;
  createdAt: string;
  variants: { id: string; size: string; stock: number }[];
};

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toProductDTO(p: Product & { category: Category; variants: ProductVariant[] }): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    style: p.style,
    price: p.price,
    salePrice: p.salePrice,
    packSize: p.packSize,
    colors: parseJson<Color[]>(p.colors, []),
    images: parseJson<string[]>(p.images, []),
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt.toISOString(),
    variants: [...p.variants]
      .sort((a, b) => SIZES.indexOf(a.size as never) - SIZES.indexOf(b.size as never))
      .map((v) => ({ id: v.id, size: v.size, stock: v.stock })),
  };
}

export const productInclude = { category: true, variants: true } as const;

export async function getAllProducts(): Promise<ProductDTO[]> {
  const rows = await prisma.product.findMany({ include: productInclude, orderBy: { createdAt: "desc" } });
  return rows.map(toProductDTO);
}

export async function getProductBySlug(slug: string) {
  const p = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  return p ? toProductDTO(p) : null;
}

export type CategoryDTO = { id: string; name: string; slug: string; styles: string[]; productCount: number };

export async function getCategories(): Promise<CategoryDTO[]> {
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, styles: parseJson<string[]>(c.styles, []), productCount: c._count.products }));
}

type Db = Prisma.TransactionClient;

export async function getPromotions(onlyActive = true, db: Db = prisma): Promise<PromotionDTO[]> {
  const rows = await db.promotion.findMany({ where: onlyActive ? { active: true } : undefined, orderBy: { createdAt: "asc" } });
  return rows.map(parsePromotion).filter((p): p is PromotionDTO => p !== null);
}

export async function getSettings(db: Db = prisma): Promise<ShopSettings> {
  const rows = await db.setting.findMany();
  const s: ShopSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (!(r.key in s)) continue;
    const key = r.key as keyof ShopSettings;
    if ((NUMERIC_SETTINGS as readonly string[]).includes(key)) {
      const n = Number(r.value);
      if (Number.isFinite(n)) (s as Record<string, string | number>)[key] = n;
    } else {
      (s as Record<string, string | number>)[key] = r.value;
    }
  }
  return s;
}
