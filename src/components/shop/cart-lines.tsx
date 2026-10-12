"use client";

import Link from "next/link";
import { Gift, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { QtyStepper } from "@/components/ui";
import { SIZES } from "@/lib/constants";
import { cn, formatMNT } from "@/lib/format";
import { giftStatus, priceCart, unitPrice } from "@/lib/promotions";
import { maxFor, useCart, type CartLine } from "@/lib/stores";
import { useShop } from "./shop-provider";

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  const { promos } = useShop();
  const priced = priceCart(
    lines.map((l) => ({ id: l.productId, price: l.price, salePrice: l.salePrice, size: l.size, qty: l.qty })),
    promos,
  );
  const gifts = giftStatus(
    lines.map((l) => ({ categorySlug: l.categorySlug, size: l.size, qty: l.qty, packSize: l.packSize })),
    promos,
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, count, subtotal: priced.subtotal, discount: priced.discount, itemsTotal: priced.itemsTotal, gifts };
}

export function CartLineRow({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const { promos } = useShop();
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const changeSize = useCart((s) => s.changeSize);
  const p = unitPrice({ id: line.productId, price: line.price, salePrice: line.salePrice }, line.size, promos);
  return (
    <li className="flex gap-3 py-4">
      <Link
        href={`/product/${line.slug}`}
        onClick={onNavigate}
        className={cn("relative shrink-0 overflow-hidden rounded-xl bg-peach", compact ? "h-24 w-[72px]" : "h-32 w-24")}
      >
        <ProductImage src={line.image} alt={line.name} sizes="96px" categorySlug={line.categorySlug} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${line.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-plum">
            {line.name}
          </Link>
          <button type="button" onClick={() => remove(line.key)} className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label={`${line.name} хасах`}>
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          {compact ? (
            <span>Хэмжээ: <b className="text-ink">{line.size}</b></span>
          ) : (
            <label className="flex items-center gap-1.5">
              Хэмжээ:
              <select
                value={line.size}
                onChange={(e) => changeSize(line.key, e.target.value)}
                className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink"
                aria-label="Хэмжээ солих"
              >
                {SIZES.map((s) => (
                  <option key={s} value={s} disabled={!line.stock[s]}>
                    {s}{!line.stock[s] ? " — дууссан" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {line.color && <span>· {line.color}</span>}
        </div>
        {p.promo && <span className="badge mt-1.5 w-fit bg-plum text-white">{p.promo.title} −{p.promo.percent}%</span>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <QtyStepper value={line.qty} max={maxFor(line)} onChange={(v) => setQty(line.key, v)} size="sm" label={`${line.name} тоо ширхэг`} />
          <div className="text-right">
            {p.unit < p.original && <div className="text-xs text-muted line-through">{formatMNT(p.original * line.qty)}</div>}
            <div className="text-sm font-bold">{formatMNT(p.unit * line.qty)}</div>
          </div>
        </div>
        {line.qty >= maxFor(line) && <p className="mt-1 text-[11px] text-plum">Энэ хэмжээнээс үлдсэн бүгдийг сонгосон байна.</p>}
      </div>
    </li>
  );
}

export function GiftNotes({ gifts }: { gifts: ReturnType<typeof giftStatus> }) {
  if (!gifts.length) return null;
  return (
    <div className="space-y-2">
      {gifts.map((g) => (
        <p
          key={g.promoId}
          className={cn(
            "flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium leading-relaxed",
            g.eligible ? "bg-plum text-white" : "bg-blush-soft text-plum",
          )}
        >
          <Gift className="mt-0.5 size-4 shrink-0" />
          {g.message}
        </p>
      ))}
    </div>
  );
}

export function TotalsRows({
  subtotal,
  discount,
  delivery,
  total,
}: {
  subtotal: number;
  discount: number;
  delivery?: number | null;
  total: number;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Барааны дүн</dt><dd>{formatMNT(subtotal)}</dd></div>
      {discount > 0 && (
        <div className="flex justify-between text-plum"><dt>Хөнгөлөлт</dt><dd>−{formatMNT(discount)}</dd></div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">Хүргэлт</dt>
        <dd>{delivery == null ? "Захиалах үед" : formatMNT(delivery)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold">
        <dt>Нийт</dt>
        <dd>{formatMNT(total)}</dd>
      </div>
    </dl>
  );
}
