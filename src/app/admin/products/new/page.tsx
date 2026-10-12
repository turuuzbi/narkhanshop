import { PageTitle } from "@/components/admin/bits";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Шинэ бараа" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <>
      <PageTitle title="Шинэ бараа" />
      <ProductForm categories={categories} />
    </>
  );
}
