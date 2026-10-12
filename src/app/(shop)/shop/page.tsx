import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { CatalogControls, type CatalogParams } from "@/components/shop/catalog-controls";
import { ProductCard } from "@/components/shop/product-card";
import { isSize } from "@/lib/constants";
import { getAllProducts, getCategories, getPromotions } from "@/lib/data";
import { prisma } from "@/lib/db";
import { sizeDiscountsFor } from "@/lib/promotions";

export const metadata: Metadata = { title: "Дэлгүүр" };

const PRICE_RANGES = [
  { key: "0-30000", label: "30,000₮ хүртэл", min: 0, max: 30000 },
  { key: "30000-60000", label: "30–60 мянга", min: 30000, max: 60000 },
  { key: "60000-100000", label: "60–100 мянга", min: 60000, max: 100000 },
  { key: "100000-", label: "100 мянгаас дээш", min: 100000, max: Infinity },
];

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]?.[0] : raw[k]) || "";
  const params: CatalogParams = {
    category: one("category"),
    style: one("style"),
    size: isSize(one("size")) ? one("size") : "",
    color: one("color"),
    price: one("price"),
    sale: one("sale") === "1" ? "1" : "",
    new: one("new") === "1" ? "1" : "",
    sort: one("sort") || "recommended",
    q: one("q").trim().slice(0, 60),
  };

  const [all, categories, promos, sold] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getPromotions(),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, where: { order: { status: { not: "cancelled" } } } }),
  ]);
  const soldMap = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]));
  const range = PRICE_RANGES.find((r) => r.key === params.price);
  const q = params.q.toLowerCase();

  const products = all
    .filter((p) => !params.category || p.categorySlug === params.category)
    .filter((p) => !params.style || p.style === params.style)
    .filter((p) => !params.size || p.variants.some((v) => v.size === params.size && v.stock > 0))
    .filter((p) => !params.color || p.colors.some((c) => c.name === params.color))
    .filter((p) => !range || ((p.salePrice ?? p.price) >= range.min && (p.salePrice ?? p.price) < range.max))
    .filter((p) => !params.new || p.isNew)
    .filter(
      (p) =>
        !params.sale ||
        p.salePrice != null ||
        sizeDiscountsFor(p.id, promos).some((d) => !params.size || d.size === params.size),
    )
    .filter(
      (p) =>
        !q ||
        [p.name, p.description, p.style, p.categoryName, ...p.colors.map((c) => c.name)].some((t) => t.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      const pa = a.salePrice ?? a.price;
      const pb = b.salePrice ?? b.price;
      switch (params.sort) {
        case "price-asc":
          return pa - pb;
        case "price-desc":
          return pb - pa;
        case "new":
          return b.createdAt.localeCompare(a.createdAt);
        case "popular":
          return (soldMap.get(b.id) ?? 0) - (soldMap.get(a.id) ?? 0);
        default:
          return Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt);
      }
    });

  const colorMap = new Map<string, string>();
  all.forEach((p) => p.colors.forEach((c) => colorMap.set(c.name, c.hex)));
  const category = categories.find((c) => c.slug === params.category);
  const title = params.q ? `“${params.q}”` : (category?.name ?? (params.size ? `${params.size} хэмжээ` : "Бүх бараа"));

  return (
    <div className="container-shop pt-6 md:pt-10">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-plum">Нүүр</Link> <span aria-hidden>/</span> <span>Дэлгүүр</span>
      </nav>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h1 className="h-display text-4xl sm:text-5xl">{title}</h1>
        <p className="pb-1.5 text-sm text-muted">{products.length} бараа</p>
      </div>
      {params.size && !params.q && (
        <p className="mt-1 text-sm text-muted">Зөвхөн {params.size} хэмжээ нь бэлэн байгаа барааг харуулж байна.</p>
      )}

      <div className="mt-6 gap-8 lg:grid lg:grid-cols-[230px_1fr]">
        <CatalogControls
          params={params}
          resultCount={products.length}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name, styles: c.styles }))}
          colors={[...colorMap].map(([name, hex]) => ({ name, hex }))}
          priceRanges={PRICE_RANGES.map(({ key, label }) => ({ key, label }))}
        />
        <section aria-label="Бараанууд" className="mt-5 lg:mt-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-blush bg-white/60 px-6 py-16 text-center">
              <SearchX className="size-10 text-plum" />
              <p className="h-display mt-4 text-3xl">Илэрц олдсонгүй</p>
              <p className="mt-1 max-w-sm text-sm text-muted">Шүүлтүүрээ багасгаад үзээрэй. Эсвэл Instagram-аар бичвэл бид хайж өгье.</p>
              <Link href="/shop" className="btn btn-primary mt-6">Шүүлтүүр арилгах</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} promos={promos} preload={i < 2} highlightSize={params.size || undefined} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
