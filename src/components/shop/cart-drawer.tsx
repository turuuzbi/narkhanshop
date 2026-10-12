"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Sheet } from "@/components/ui";
import { formatMNT } from "@/lib/format";
import { useHydrated, useUi } from "@/lib/stores";
import { CartLineRow, GiftNotes, TotalsRows, useCartTotals } from "./cart-lines";

export function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const { lines, count, subtotal, discount, itemsTotal, gifts } = useCartTotals();
  const close = () => setOpen(false);

  return (
    <Sheet
      open={open}
      onClose={close}
      variant="right"
      title={<>Сагс {count > 0 && <span className="font-sans text-base text-muted">({count})</span>}</>}
      footer={
        lines.length > 0 && (
          <div className="space-y-3">
            <TotalsRows subtotal={subtotal} discount={discount} total={itemsTotal} />
            <Link href="/checkout" onClick={close} className="btn btn-primary w-full">
              Захиалах <ArrowRight className="size-4" />
            </Link>
            <Link href="/cart" onClick={close} className="btn btn-ghost w-full">
              Сагс дэлгэрэнгүй
            </Link>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <EmptyCart onNavigate={close} />
      ) : (
        <div className="space-y-3">
          <GiftNotes gifts={gifts} />
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <CartLineRow key={l.key} line={l} compact onNavigate={close} />
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-blush-soft text-plum">
        <ShoppingBag className="size-8" />
      </div>
      <p className="h-display mt-5 text-2xl">Сагс хоосон байна</p>
      <p className="mt-1.5 max-w-xs text-sm text-muted">Хэмжээгээ сонгоод таалагдсан бараагаа сагслаарай.</p>
      <Link href="/shop" onClick={onNavigate} className="btn btn-primary mt-6">
        Дэлгүүр үзэх
      </Link>
    </div>
  );
}

/** Sticky bottom bar on mobile so the cart is always one thumb-tap away. */
export function MobileCartBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const setOpen = useUi((s) => s.setCartOpen);
  const { count, itemsTotal } = useCartTotals();
  const hidden = ["/cart", "/checkout"].includes(pathname) || pathname.startsWith("/product/") || pathname.startsWith("/order/");
  if (!hydrated || count === 0 || hidden) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-3 rounded-full bg-ink pl-5 pr-2 text-white shadow-lift animate-pop-in"
      >
        <ShoppingBag className="size-5 text-blush" />
        <span className="text-sm font-semibold">{count} бараа</span>
        <span className="text-sm text-white/70">· {formatMNT(itemsTotal)}</span>
        <span className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-full bg-blush px-4 text-sm font-bold text-plum">
          Сагс <ArrowRight className="size-4" />
        </span>
      </button>
    </div>
  );
}
