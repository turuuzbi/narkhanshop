"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Truck } from "lucide-react";
import { formatMNT } from "@/lib/format";
import { useHydrated } from "@/lib/stores";
import { EmptyCart } from "./cart-drawer";
import { CartLineRow, GiftNotes, TotalsRows, useCartTotals } from "./cart-lines";
import { useShop } from "./shop-provider";

export function CartView() {
  const hydrated = useHydrated();
  const { settings } = useShop();
  const { lines, subtotal, discount, itemsTotal, gifts } = useCartTotals();

  if (!hydrated) return <div className="skeleton mt-6 h-64" />;
  if (lines.length === 0) return <EmptyCart />;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <GiftNotes gifts={gifts} />
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <CartLineRow key={l.key} line={l} />
          ))}
        </ul>
      </div>
      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="h-display text-2xl">Төлбөрийн мэдээлэл</h2>
        <TotalsRows subtotal={subtotal} discount={discount} total={itemsTotal} />
        <p className="flex items-start gap-2 text-xs text-muted">
          <Truck className="size-4 shrink-0 text-plum" /> Хүргэлт {formatMNT(settings.deliveryStandard)}, шуурхай {formatMNT(settings.deliveryExpress)}–{formatMNT(settings.deliveryExpressFar)}. Дараагийн алхамд сонгоно.
        </p>
        <p className="flex items-start gap-2 text-xs text-muted">
          <CreditCard className="size-4 shrink-0 text-plum" /> {settings.labelStorepay}, {settings.labelPocketzero}-р хувааж төлөх боломжтой.
        </p>
        <Link href="/checkout" className="btn btn-primary w-full">
          Захиалах <ArrowRight className="size-4" />
        </Link>
        <Link href="/shop" className="btn btn-ghost w-full">Үргэлжлүүлэн үзэх</Link>
      </aside>
    </div>
  );
}
