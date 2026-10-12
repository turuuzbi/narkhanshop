"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** True only after hydration, so persisted (localStorage) state never causes SSR mismatches. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string | null;
  qty: number;
  price: number;
  salePrice: number | null;
  categorySlug: string;
  packSize: number;
  /** Stock snapshot per size, taken when the item was added (server re-checks at checkout). */
  stock: Record<string, number>;
};

export const maxFor = (l: Pick<CartLine, "stock" | "size">) => l.stock[l.size] ?? 0;

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  changeSize: (key: string, size: string) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const lineKey = (productId: string, size: string, color: string | null) => `${productId}:${size}:${color ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, qty = 1) =>
        set((s) => {
          const key = lineKey(line.productId, line.size, line.color);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, ...line, qty: Math.min(l.qty + qty, maxFor(line)) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, key, qty: Math.min(qty, maxFor(line)) }] };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.key === key ? { ...l, qty: Math.max(0, Math.min(qty, maxFor(l))) } : l))
            .filter((l) => l.qty > 0),
        })),
      changeSize: (key, size) =>
        set((s) => {
          const line = s.lines.find((l) => l.key === key);
          if (!line) return s;
          const newKey = lineKey(line.productId, size, line.color);
          const others = s.lines.filter((l) => l.key !== key && l.key !== newKey);
          const merged = s.lines.find((l) => l.key === newKey);
          const qty = Math.min((merged?.qty ?? 0) + line.qty, line.stock[size] ?? 0);
          const idx = s.lines.findIndex((l) => l.key === key);
          const next = { ...line, key: newKey, size, qty };
          others.splice(Math.min(idx, others.length), 0, next);
          return { lines: others.filter((l) => l.qty > 0) };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "narkhan-cart", version: 2, migrate: () => ({ lines: [] }) as never },
  ),
);

export type SavedProduct = { slug: string; name: string; image: string; price: number; salePrice: number | null };

type ListState = {
  items: SavedProduct[];
  toggle: (p: SavedProduct) => void;
  push: (p: SavedProduct) => void;
  has: (slug: string) => boolean;
};

export const useWishlist = create<ListState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) =>
        set((s) => ({
          items: s.items.some((i) => i.slug === p.slug) ? s.items.filter((i) => i.slug !== p.slug) : [p, ...s.items],
        })),
      push: () => {},
      has: (slug) => get().items.some((i) => i.slug === slug),
    }),
    { name: "narkhan-wishlist" },
  ),
);

export const useRecent = create<ListState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: () => {},
      push: (p) => set((s) => ({ items: [p, ...s.items.filter((i) => i.slug !== p.slug)].slice(0, 8) })),
      has: (slug) => get().items.some((i) => i.slug === slug),
    }),
    { name: "narkhan-recent" },
  ),
);

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type UiState = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
};

let toastId = 0;
export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  toasts: [],
  toast: (message, tone = "success") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
