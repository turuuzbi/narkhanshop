"use client";

import { useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { Heart, Menu, Phone, Search, ShoppingBag } from "lucide-react";
import { InstagramIcon, Logo, Sparkle } from "@/components/logo";
import { Sheet } from "@/components/ui";
import { SIZES } from "@/lib/constants";
import { cn, formatPhone } from "@/lib/format";
import { useCart, useHydrated, useUi, useWishlist } from "@/lib/stores";
import { useShop } from "./shop-provider";

export function Header() {
  const { categories, settings } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const wishCount = useWishlist((s) => s.items.length);
  const setCartOpen = useUi((s) => s.setCartOpen);

  const nav = [
    { href: "/shop", label: "Бүх бараа" },
    ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
    { href: "/size-guide", label: "Хэмжээ олох" },
  ];

  return (
    <>
      <div className="bg-plum text-[11px] font-medium tracking-wide text-white/95">
        <p className="container-shop flex h-8 items-center justify-center gap-2 overflow-hidden whitespace-nowrap">
          <Sparkle className="size-2.5 text-blush" /> H&M брэнд Европоос
          <span className="hidden sm:inline">· Бүх бараа бэлэн</span> · Хүргэлт 5,000₮
          <Sparkle className="size-2.5 text-blush" />
        </p>
      </div>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/90 backdrop-blur-md">
        <div className="container-shop flex h-16 items-center gap-1 lg:h-[72px]">
          <button type="button" className="icon-btn -ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Цэс нээх">
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2.5 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            <Logo size={50} />
            <span className="hidden font-serif text-2xl italic text-plum xl:inline">Нархан</span>
          </Link>
          <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Үндсэн цэс">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-blush-soft hover:text-plum",
                  pathname === n.href && "text-plum",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center">
            <button type="button" className="icon-btn" onClick={() => setSearchOpen((v) => !v)} aria-label="Хайх" aria-expanded={searchOpen}>
              <Search className="size-5" />
            </button>
            <Link href="/wishlist" className="icon-btn relative max-sm:hidden" aria-label="Хадгалсан бараа">
              <Heart className="size-5" />
              {hydrated && wishCount > 0 && <Dot n={wishCount} />}
            </Link>
            <button type="button" className="icon-btn relative -mr-2" onClick={() => setCartOpen(true)} aria-label={`Сагс, ${hydrated ? count : 0} бараа`}>
              <ShoppingBag className="size-5" />
              {hydrated && count > 0 && <Dot n={count} />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="container-shop pb-3 animate-fade-in">
            <Form action="/shop" className="relative" onSubmit={() => setSearchOpen(false)}>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input name="q" autoFocus placeholder="Пижама, thong, сатин…" className="input pl-10" aria-label="Бараа хайх" />
            </Form>
          </div>
        )}
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Цэс" variant="bottom">
        <nav className="space-y-1" aria-label="Гар утасны цэс">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium hover:bg-blush-soft">
              {n.label}
            </Link>
          ))}
          <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium hover:bg-blush-soft">
            Хадгалсан бараа
          </Link>
          <Link href="/info" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium hover:bg-blush-soft">
            Хүргэлт & төлбөр
          </Link>
        </nav>
        <p className="eyebrow mt-6 mb-3">Хэмжээгээр сонгох</p>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <Link key={s} href={`/shop?size=${s}`} onClick={() => setMenuOpen(false)} className="chip flex-1 px-0">
              {s}
            </Link>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <a href={`tel:${settings.phone}`} className="btn btn-outline">
            <Phone className="size-4" /> {formatPhone(settings.phone)}
          </a>
          <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="btn btn-outline">
            <InstagramIcon className="size-4" /> Instagram
          </a>
        </div>
      </Sheet>
    </>
  );
}

function Dot({ n }: { n: number }) {
  return (
    <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-plum px-1 text-[10px] font-bold leading-[18px] text-white animate-pop-in">
      {n > 99 ? "99+" : n}
    </span>
  );
}
