"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { formatMNT } from "@/lib/format";
import { useHydrated, useRecent, useWishlist, type SavedProduct } from "@/lib/stores";
import { WishlistButton } from "./wishlist-button";

function MiniCard({ p }: { p: SavedProduct }) {
  return (
    <div className="relative">
      <Link href={`/product/${p.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-peach/60 shadow-soft">
          <ProductImage src={p.image} alt={p.name} sizes="(max-width: 640px) 45vw, 220px" className="transition duration-500 group-hover:scale-[1.03]" />
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-plum">{p.name}</p>
        <p className="mt-1 text-sm font-bold">{formatMNT(p.salePrice ?? p.price)}</p>
      </Link>
      <WishlistButton item={p} className="absolute right-2 top-2" />
    </div>
  );
}

export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const hydrated = useHydrated();
  const items = useRecent((s) => s.items).filter((i) => i.slug !== exclude);
  if (!hydrated || items.length === 0) return null;
  return (
    <section className="container-shop mt-16">
      <h2 className="h-display text-3xl">Саяхан үзсэн</h2>
      <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4">
        {items.map((p) => (
          <div key={p.slug} className="w-[40vw] max-w-[200px] shrink-0 snap-start">
            <MiniCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function WishlistGrid() {
  const hydrated = useHydrated();
  const items = useWishlist((s) => s.items);
  if (!hydrated) return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>;
  if (items.length === 0)
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-blush bg-white/60 px-6 py-16 text-center">
        <Heart className="size-10 text-plum" />
        <p className="h-display mt-4 text-3xl">Хадгалсан бараа алга</p>
        <p className="mt-1 max-w-sm text-sm text-muted">Таалагдсан бараан дээрх ♡ тэмдгийг дарж хадгалаарай.</p>
        <Link href="/shop" className="btn btn-primary mt-6">Дэлгүүр үзэх</Link>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-4">
      {items.map((p) => (
        <MiniCard key={p.slug} p={p} />
      ))}
    </div>
  );
}
