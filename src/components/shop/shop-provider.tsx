"use client";

import { createContext, useContext } from "react";
import type { PromotionDTO } from "@/lib/promotions";
import type { ShopSettings } from "@/lib/settings";

type ShopContextValue = {
  settings: ShopSettings;
  promos: PromotionDTO[];
  categories: { name: string; slug: string }[];
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ value, children }: { value: ShopContextValue; children: React.ReactNode }) {
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
