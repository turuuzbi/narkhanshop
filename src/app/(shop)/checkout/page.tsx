import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = { title: "Захиалах" };

export default function CheckoutPage() {
  return (
    <div className="container-shop pt-6 md:pt-10">
      <nav className="text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/cart" className="hover:text-plum">Сагс</Link> / <span>Захиалах</span>
      </nav>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Захиалах</h1>
      <p className="mt-1 text-sm text-muted">Нэг хуудсанд бөглөөд л болно — 1 минут ч болохгүй.</p>
      <CheckoutForm />
    </div>
  );
}
