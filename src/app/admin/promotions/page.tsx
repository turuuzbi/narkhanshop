import { PageTitle } from "@/components/admin/bits";
import { PromotionsEditor } from "@/components/admin/promotions-editor";
import { getAllProducts, getPromotions } from "@/lib/data";

export const metadata = { title: "Урамшуулал" };

export default async function PromotionsPage() {
  const [promos, products] = await Promise.all([getPromotions(false), getAllProducts()]);
  return (
    <>
      <PageTitle title="Урамшуулал" sub="Идэвхтэй урамшуулал нүүр хуудас, сагс, захиалга дээр автоматаар үйлчилнэ" />
      <PromotionsEditor promos={promos} products={products.map((p) => ({ id: p.id, name: p.name, categoryName: p.categoryName }))} />
    </>
  );
}
