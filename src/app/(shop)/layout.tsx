import { CartDrawer, MobileCartBar } from "@/components/shop/cart-drawer";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { ShopProvider } from "@/components/shop/shop-provider";
import { Toaster } from "@/components/ui";
import { getCategories, getPromotions, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, promos, cats] = await Promise.all([getSettings(), getPromotions(), getCategories()]);
  const categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <ShopProvider value={{ settings, promos, categories }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Үндсэн агуулга руу шилжих
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <MobileCartBar />
      <Toaster />
    </ShopProvider>
  );
}
