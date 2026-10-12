import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, RotateCcw, Truck } from "lucide-react";
import { Gallery } from "@/components/shop/gallery";
import { ProductCard } from "@/components/shop/product-card";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { RecentlyViewed } from "@/components/shop/saved-list";
import { getAllProducts, getProductBySlug, getPromotions, getSettings } from "@/lib/data";
import { formatMNT } from "@/lib/format";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ size?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return p ? { title: p.name, description: p.description } : { title: "Бараа олдсонгүй" };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, { size }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [all, promos, settings] = await Promise.all([getAllProducts(), getPromotions(), getSettings()]);
  const related = all.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4);

  return (
    <div className="pb-24 md:pb-0">
      <div className="container-shop pt-4 md:pt-8">
        <nav className="mb-4 hidden text-xs text-muted sm:block" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-plum">Нүүр</Link> / <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-plum">{product.categoryName}</Link> / <span>{product.name}</span>
        </nav>
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <Gallery images={product.images} alt={product.name} categorySlug={product.categorySlug} />
          <div className="md:pt-2">
            <ProductPurchase product={product} initialSize={size} />
            <div className="mt-8 space-y-4 border-t border-line pt-6">
              <div>
                <h2 className="text-sm font-semibold">Тайлбар</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink/80">{product.description}</p>
              </div>
              <ul className="grid gap-2.5 text-sm text-ink/80">
                <li className="flex items-center gap-2.5"><BadgeCheck className="size-4 text-plum" /> H&M оригинал, Европоос авчирсан</li>
                <li className="flex items-center gap-2.5"><Truck className="size-4 text-plum" /> Хүргэлт {formatMNT(settings.deliveryStandard)} · Шуурхай {formatMNT(settings.deliveryExpress)}-аас</li>
                <li className="flex items-center gap-2.5"><RotateCcw className="size-4 text-plum" /> Хэмжээ таарахгүй бол 24 цагийн дотор солино</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-shop mt-16">
          <h2 className="h-display text-3xl">Танд таалагдаж магадгүй</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} promos={promos} />
            ))}
          </div>
        </section>
      )}
      <RecentlyViewed exclude={product.slug} />
    </div>
  );
}
