import Link from "next/link";
import Form from "next/form";
import { Package, Plus, Search } from "lucide-react";
import { EmptyState, PageTitle } from "@/components/admin/bits";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { ProductImage } from "@/components/product-image";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getAllProducts, getCategories } from "@/lib/data";
import { cn, formatMNT } from "@/lib/format";

export const metadata = { title: "Бараа" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const [all, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const query = q.trim().toLowerCase();
  const products = all
    .filter((p) => !category || p.categorySlug === category)
    .filter((p) => !query || p.name.toLowerCase().includes(query) || p.slug.includes(query) || p.style.toLowerCase().includes(query));

  return (
    <>
      <PageTitle title="Бараа" sub={`${all.length} бараа · ${categories.length} ангилал`}>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm"><Plus className="size-4" /> Шинэ бараа</Link>
      </PageTitle>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Form action="/admin/products" className="relative sm:w-80">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} className="input pl-10" placeholder="Бараа хайх…" aria-label="Бараа хайх" />
        </Form>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ slug: "", name: "Бүгд" }, ...categories].map((c) => (
            <Link key={c.slug} href={`/admin/products?${new URLSearchParams({ ...(c.slug ? { category: c.slug } : {}), ...(q ? { q } : {}) })}`} className={cn("chip min-h-9 shrink-0", category === c.slug && "chip-active")}>
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {products.length === 0 ? (
          <EmptyState icon={<Package className="size-6" />} title="Бараа олдсонгүй" text="Хайлтаа өөрчлөх эсвэл шинэ бараа нэмнэ үү.">
            <Link href="/admin/products/new" className="btn btn-primary btn-sm"><Plus className="size-4" /> Шинэ бараа</Link>
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line">
            {products.map((p) => {
              const total = p.variants.reduce((s, v) => s + v.stock, 0);
              const low = p.variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD).length;
              return (
                <li key={p.id} className="flex items-center gap-3 p-3 sm:p-4">
                  <Link href={`/admin/products/${p.id}`} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-peach">
                    <ProductImage src={p.images[0]} alt="" sizes="48px" categorySlug={p.categorySlug} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="block truncate text-sm font-semibold hover:text-plum">{p.name}</Link>
                    <p className="text-xs text-muted">{p.categoryName} · {p.style}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold">{formatMNT(p.salePrice ?? p.price)}</span>
                      {p.salePrice && <span className="text-[11px] text-muted line-through">{formatMNT(p.price)}</span>}
                      {p.isNew && <span className="badge bg-blush-soft text-plum">Шинэ</span>}
                      {p.isFeatured && <span className="badge bg-amber-50 text-amber-800">Онцлох</span>}
                    </div>
                  </div>
                  <div className="hidden text-right text-xs sm:block">
                    <p className="font-semibold">{total} ширхэг</p>
                    {low > 0 && <p className="text-amber-700">{low} хэмжээ дуусаж буй</p>}
                  </div>
                  <ProductRowActions id={p.id} name={p.name} slug={p.slug} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
