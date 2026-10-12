import { PageTitle } from "@/components/admin/bits";
import { QuickOrderForm } from "@/components/admin/quick-order-form";
import { getAllProducts, getCategories, getPromotions, getSettings } from "@/lib/data";

export const metadata = { title: "DM захиалга" };

export default async function QuickOrderPage() {
  const [products, categories, promos, settings] = await Promise.all([getAllProducts(), getCategories(), getPromotions(), getSettings()]);
  return (
    <>
      <PageTitle title="DM захиалга" sub="Instagram, Facebook-оор ирсэн захиалгыг 30 секундэд бүртгэ — үлдэгдэл автоматаар хасагдана." />
      <QuickOrderForm
        products={products}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        promos={promos}
        settings={settings}
      />
    </>
  );
}
