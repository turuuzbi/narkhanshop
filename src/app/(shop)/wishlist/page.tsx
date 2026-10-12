import type { Metadata } from "next";
import { WishlistGrid } from "@/components/shop/saved-list";

export const metadata: Metadata = { title: "Хадгалсан бараа" };

export default function WishlistPage() {
  return (
    <div className="container-shop pt-8">
      <h1 className="h-display text-4xl sm:text-5xl">Хадгалсан бараа</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Энэ төхөөрөмж дээр хадгалагдана.</p>
      <WishlistGrid />
    </div>
  );
}
