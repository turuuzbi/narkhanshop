import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/bits";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, productInclude, toProductDTO } from "@/lib/data";
import { prisma } from "@/lib/db";

export const metadata = { title: "Бараа засах" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, categories] = await Promise.all([prisma.product.findUnique({ where: { id }, include: productInclude }), getCategories()]);
  if (!row) notFound();
  const product = toProductDTO(row);
  return (
    <>
      <PageTitle title="Бараа засах" sub={product.name} />
      <ProductForm categories={categories} product={product} />
    </>
  );
}
