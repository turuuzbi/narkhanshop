import { PageTitle } from "@/components/admin/bits";
import { CategoriesEditor } from "@/components/admin/categories-editor";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Ангилал" };

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <>
      <PageTitle title="Ангилал & загвар" sub="Дэлгүүрийн шүүлтүүрт харагдах загварын нэрс" />
      <CategoriesEditor categories={categories} />
    </>
  );
}
