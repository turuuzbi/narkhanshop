import { PageTitle } from "@/components/admin/bits";
import { InventoryGrid } from "@/components/admin/inventory-grid";
import { getAllProducts, getCategories } from "@/lib/data";

export const metadata = { title: "Үлдэгдэл" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ low?: string }> }) {
  const [{ low }, products, categories] = await Promise.all([searchParams, getAllProducts(), getCategories()]);
  const total = products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock, 0), 0);
  return (
    <>
      <PageTitle title="Үлдэгдэл" sub={`Нийт ${total} ширхэг · нүдэн дээр дарж засна, Enter эсвэл гадагш дарахад хадгалагдана`} />
      <InventoryGrid
        initialLowOnly={low === "1"}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        rows={products.map((p) => ({ id: p.id, name: p.name, categorySlug: p.categorySlug, image: p.images[0] ?? "", variants: p.variants }))}
      />
    </>
  );
}
