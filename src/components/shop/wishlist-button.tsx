"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/format";
import { useHydrated, useUi, useWishlist, type SavedProduct } from "@/lib/stores";

export function WishlistButton({ item, className, withLabel }: { item: SavedProduct; className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated();
  const saved = useWishlist((s) => s.items.some((i) => i.slug === item.slug)) && hydrated;
  const toggle = useWishlist((s) => s.toggle);
  const toast = useUi((s) => s.toast);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(item);
        toast(saved ? "Хадгалснаас хаслаа" : "Хадгаллаа ♡", "info");
      }}
      aria-pressed={saved}
      aria-label={saved ? "Хадгалснаас хасах" : "Хадгалах"}
      className={cn(
        withLabel
          ? "btn btn-outline"
          : "grid size-10 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition hover:bg-white active:scale-90",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition", saved && "fill-plum text-plum")} />
      {withLabel && (saved ? "Хадгалсан" : "Хадгалах")}
    </button>
  );
}
