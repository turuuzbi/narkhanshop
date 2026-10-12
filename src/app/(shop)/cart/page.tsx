import type { Metadata } from "next";
import { CartView } from "@/components/shop/cart-view";

export const metadata: Metadata = { title: "Сагс" };

export default function CartPage() {
  return (
    <div className="container-shop pt-6 md:pt-10">
      <h1 className="h-display text-4xl sm:text-5xl">Сагс</h1>
      <CartView />
    </div>
  );
}
