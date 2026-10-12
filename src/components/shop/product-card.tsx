import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { LOW_STOCK_THRESHOLD, SIZES } from "@/lib/constants";
import type { ProductDTO } from "@/lib/data";
import { cn, formatMNT } from "@/lib/format";
import { sizeDiscountsFor, type PromotionDTO } from "@/lib/promotions";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product: p,
  promos,
  preload,
  highlightSize,
  className,
}: {
  product: ProductDTO;
  promos: PromotionDTO[];
  preload?: boolean;
  highlightSize?: string;
  className?: string;
}) {
  const price = p.salePrice ?? p.price;
  const salePct = p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
  const sizeDeals = sizeDiscountsFor(p.id, promos);
  const stock = Object.fromEntries(p.variants.map((v) => [v.size, v.stock]));
  const soldOut = p.variants.every((v) => v.stock <= 0);
  const href = `/product/${p.slug}${highlightSize ? `?size=${highlightSize}` : ""}`;

  return (
    <article className={cn("group relative", className)}>
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-peach/60 shadow-soft">
          <ProductImage
            src={p.images[0]}
            alt={p.name}
            categorySlug={p.categorySlug}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
            preload={preload}
            className={cn("transition duration-500 group-hover:scale-[1.03]", soldOut && "opacity-60")}
          />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {p.isNew && <span className="badge bg-white/90 text-plum shadow-sm">Шинэ</span>}
            {salePct > 0 && <span className="badge bg-plum text-white">−{salePct}%</span>}
            {sizeDeals.map((d) => (
              <span key={d.title} className="badge bg-ink/85 text-white">{d.title} −{d.percent}%</span>
            ))}
            {soldOut && <span className="badge bg-stone-700 text-white">Дууссан</span>}
          </div>
        </div>
        <div className="px-0.5 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{p.style}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-plum">{p.name}</h3>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className={cn("text-[15px] font-bold", p.salePrice && "text-plum")}>{formatMNT(price)}</span>
            {p.salePrice && <span className="text-xs text-muted line-through">{formatMNT(p.price)}</span>}
          </p>
          <ul className="mt-2 flex gap-1" aria-label="Боломжит хэмжээ">
            {SIZES.map((s) => {
              const n = stock[s] ?? 0;
              return (
                <li
                  key={s}
                  className={cn(
                    "grid h-6 min-w-7 place-items-center rounded-md border px-1 text-[10px] font-semibold",
                    n <= 0 && "border-transparent bg-stone-100 text-stone-600 line-through",
                    n > 0 && n <= LOW_STOCK_THRESHOLD && "border-blush bg-blush-soft text-plum",
                    n > LOW_STOCK_THRESHOLD && "border-line bg-white text-ink/80",
                    highlightSize === s && n > 0 && "border-plum bg-plum text-white",
                  )}
                  title={n <= 0 ? `${s} — дууссан` : `${s} — ${n} ширхэг`}
                >
                  {s}
                </li>
              );
            })}
          </ul>
        </div>
      </Link>
      <WishlistButton
        item={{ slug: p.slug, name: p.name, image: p.images[0] ?? "", price: p.price, salePrice: p.salePrice }}
        className="absolute right-2 top-2"
      />
    </article>
  );
}
