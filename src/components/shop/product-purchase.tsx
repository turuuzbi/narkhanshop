"use client";

import { useEffect, useState } from "react";
import { Check, Phone, ShoppingBag } from "lucide-react";
import { InstagramIcon } from "@/components/logo";
import { QtyStepper, Sheet } from "@/components/ui";
import { BNPL_INSTALLMENTS, LOW_STOCK_THRESHOLD, SIZES } from "@/lib/constants";
import type { ProductDTO } from "@/lib/data";
import { cn, formatMNT } from "@/lib/format";
import { sizeDiscountsFor, unitPrice } from "@/lib/promotions";
import { useCart, useRecent, useUi } from "@/lib/stores";
import { useShop } from "./shop-provider";
import { SizeChartTable, SizeFinderButton } from "./size-finder";
import { WishlistButton } from "./wishlist-button";

export function ProductPurchase({ product: p, initialSize }: { product: ProductDTO; initialSize?: string }) {
  const { promos, settings } = useShop();
  const stock = Object.fromEntries(p.variants.map((v) => [v.size, v.stock])) as Record<string, number>;
  const [size, setSize] = useState<string | null>(initialSize && stock[initialSize] > 0 ? initialSize : null);
  const [color, setColor] = useState(p.colors[0]?.name ?? null);
  const [qty, setQty] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);
  const [needSize, setNeedSize] = useState(false);
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const toast = useUi((s) => s.toast);
  const pushRecent = useRecent((s) => s.push);

  useEffect(() => {
    pushRecent({ slug: p.slug, name: p.name, image: p.images[0] ?? "", price: p.price, salePrice: p.salePrice });
  }, [p.slug, p.name, p.images, p.price, p.salePrice, pushRecent]);

  const price = unitPrice(p, size, promos);
  const deals = sizeDiscountsFor(p.id, promos);
  const left = size ? stock[size] ?? 0 : 0;
  const soldOut = p.variants.every((v) => v.stock <= 0);
  const installment = Math.ceil(price.unit / BNPL_INSTALLMENTS / 10) * 10;

  const pickSize = (s: string) => {
    setSize(s);
    setQty(1);
    setNeedSize(false);
  };

  const addToCart = () => {
    if (!size) {
      setNeedSize(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        image: p.images[0] ?? "",
        size,
        color,
        price: p.price,
        salePrice: p.salePrice,
        categorySlug: p.categorySlug,
        packSize: p.packSize,
        stock,
      },
      qty,
    );
    toast(`Сагсанд нэмлээ · ${size}`);
    setCartOpen(true);
  };

  const dmText = encodeURIComponent(`Сайн байна уу! ${p.name}${size ? ` (${size})` : ""} захиалмаар байна.`);

  return (
    <div>
      <p className="eyebrow">{p.categoryName} · {p.style}</p>
      <h1 className="h-display mt-2 text-[34px] leading-[1.08] sm:text-[42px]">{p.name}</h1>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("text-2xl font-bold", price.unit < price.original && "text-plum")}>{formatMNT(price.unit)}</span>
        {price.unit < price.original && <span className="text-base text-muted line-through">{formatMNT(price.original)}</span>}
        {price.promo && <span className="badge bg-plum text-white">{price.promo.title} −{price.promo.percent}%</span>}
      </div>
      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] shadow-sm">
        <span className="font-bold text-[#2B46E5]">{settings.labelStorepay}</span>
        <span className="text-ink/80">-р {BNPL_INSTALLMENTS} хувааж: <b className="text-ink">{formatMNT(installment)} × {BNPL_INSTALLMENTS}</b></span>
      </p>
      {deals.length > 0 && !price.promo && (
        <p className="mt-2 text-sm text-plum">
          ✦ {deals.map((d) => `${d.size} хэмжээг сонговол −${d.percent}% (${d.title})`).join(", ")}
        </p>
      )}

      {/* Size */}
      <div id="size-picker" className="mt-7 scroll-mt-28">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            Хэмжээ{size && <span className="font-normal text-muted">: {size}</span>}
          </p>
          <div className="flex gap-3 text-[13px] font-semibold text-plum">
            <SizeFinderButton className="inline-flex items-center gap-1 underline-offset-4 hover:underline" label="Хэмжээ олох" onPick={pickSize} />
            <button type="button" onClick={() => setGuideOpen(true)} className="underline-offset-4 hover:underline">Хүснэгт</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Хэмжээ сонгох">
          {SIZES.map((s) => {
            const n = stock[s] ?? 0;
            const disabled = n <= 0;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                disabled={disabled}
                onClick={() => pickSize(s)}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-bold transition active:scale-95",
                  disabled && "cursor-not-allowed border-dashed border-line bg-transparent text-stone-400 line-through",
                  !disabled && size !== s && "border-line bg-white hover:border-plum/50",
                  size === s && "border-plum bg-plum text-white shadow-soft",
                  needSize && !size && !disabled && "border-plum/60 ring-2 ring-blush",
                )}
              >
                {s}
                {!disabled && n <= LOW_STOCK_THRESHOLD && (
                  <span className={cn("text-[9px] font-semibold", size === s ? "text-blush" : "text-plum")}>{n} үлдсэн</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-2 min-h-5 text-[13px]" aria-live="polite">
          {needSize && !size && <span className="font-semibold text-plum">Эхлээд хэмжээгээ сонгоно уу.</span>}
          {size && left <= LOW_STOCK_THRESHOLD && <span className="font-semibold text-plum">Сүүлийн {left} ширхэг!</span>}
          {size && left > LOW_STOCK_THRESHOLD && <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="size-3.5" /> Бэлэн байгаа — өнөөдөр хүргэнэ</span>}
          {soldOut && <span className="text-muted">Одоогоор бүх хэмжээ дууссан.</span>}
        </div>
      </div>

      {/* Color */}
      {p.colors.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">
            Өнгө: <span className="font-normal text-muted">{color}</span>
          </p>
          <div className="mt-2.5 flex gap-2.5" role="radiogroup" aria-label="Өнгө сонгох">
            {p.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={color === c.name}
                aria-label={c.name}
                onClick={() => setColor(c.name)}
                className={cn("size-10 rounded-full border-2 p-1 transition", color === c.name ? "border-plum" : "border-transparent hover:border-line")}
              >
                <span className="block size-full rounded-full border border-ink/10" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
          {p.packSize > 1 && <p className="mt-2 text-xs text-muted">{p.packSize} ширхэгийн багц — өнгөнүүд багцад хамт ирнэ.</p>}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <QtyStepper value={qty} max={Math.max(1, left)} onChange={(v) => setQty(Math.max(1, v))} label="Тоо ширхэг" />
        <button type="button" onClick={addToCart} disabled={soldOut} className="btn btn-primary h-12 flex-1 text-[15px]">
          <ShoppingBag className="size-4" /> {soldOut ? "Дууссан" : "Сагсанд нэмэх"}
        </button>
        <WishlistButton item={{ slug: p.slug, name: p.name, image: p.images[0] ?? "", price: p.price, salePrice: p.salePrice }} className="size-12 shrink-0 border border-line" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`https://ig.me/m/${settings.instagram}?text=${dmText}`} target="_blank" rel="noreferrer" className="btn btn-soft">
          <InstagramIcon className="size-4" /> DM-ээр захиалах
        </a>
        <a href={`tel:${settings.phone}`} className="btn btn-outline">
          <Phone className="size-4" /> Залгах
        </a>
      </div>

      {/* Sticky mobile add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-cream/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">{formatMNT(price.unit * qty)}</p>
            <p className="truncate text-xs text-muted">{size ? `Хэмжээ ${size}${qty > 1 ? ` · ${qty} ширхэг` : ""}` : "Хэмжээ сонгоогүй"}</p>
          </div>
          <button type="button" onClick={addToCart} disabled={soldOut} className="btn btn-primary ml-auto h-12 px-6">
            <ShoppingBag className="size-4" /> {size ? "Сагслах" : "Хэмжээ сонгох"}
          </button>
        </div>
      </div>

      <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title="Хэмжээний хүснэгт">
        <SizeChartTable highlight={size} />
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Хоёр хэмжээний дунд байвал сул загварт томыг, биед таарсан загварт жижгийг сонгохыг зөвлөж байна. Эргэлзвэл Instagram-аар бичээрэй.
        </p>
      </Sheet>
    </div>
  );
}
