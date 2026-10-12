"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ORDER_STATUSES, SIZES, type OrderStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { changeOrderStatus, createOrder, StockError } from "@/lib/orders";
import { sizeDiscountRule, sizeGiftRule } from "@/lib/promotion-schema";
import { seedDatabase } from "@/lib/seed";
import { fieldErrors, orderInputSchema } from "@/lib/validation";

// NOTE: demo only — there is intentionally no authentication on these actions.

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: Record<string, string> };

const refresh = () => revalidatePath("/", "layout");
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Алдаа гарлаа");

/* ---------------- Orders ---------------- */

export async function setOrderStatus(orderId: string, status: string): Promise<ActionResult> {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Буруу төлөв" };
  try {
    await changeOrderStatus(orderId, status as OrderStatus);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function createQuickOrder(payload: unknown): Promise<ActionResult<{ id: string; number: string }>> {
  const status = (payload as { status?: string })?.status === "new" ? "new" : "confirmed";
  const parsed = orderInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Мэдээллээ шалгана уу", fieldErrors: fieldErrors(parsed.error) };
  try {
    const order = await createOrder(parsed.data, status);
    refresh();
    return { ok: true, id: order.id, number: order.number };
  } catch (e) {
    if (e instanceof StockError) {
      return { ok: false, error: `Үлдэгдэл хүрэлцэхгүй: ${e.issues.map((i) => `${i.name} (${i.size}) — ${i.available} үлдсэн`).join(", ")}` };
    }
    return { ok: false, error: errMsg(e) };
  }
}

/* ---------------- Products ---------------- */

const colorSchema = z.array(z.object({ name: z.string().trim().min(1).max(30), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(6);

const productSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Нэр оруулна уу" }).max(120),
    slug: z.string().trim().max(80).optional(),
    categoryId: z.string().min(1, { error: "Ангилал сонгоно уу" }),
    style: z.string().trim().min(1, { error: "Загвар сонгоно уу" }).max(40),
    description: z.string().trim().min(5, { error: "Тайлбар оруулна уу" }).max(600),
    price: z.coerce.number().int().min(100, { error: "Үнэ оруулна уу" }).max(10_000_000),
    salePrice: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(100).max(10_000_000).nullable()),
    packSize: z.coerce.number().int().min(1).max(10),
    isNew: z.boolean(),
    isFeatured: z.boolean(),
  })
  .refine((d) => d.salePrice == null || d.salePrice < d.price, { path: ["salePrice"], error: "Хямдралтай үнэ үндсэн үнээс бага байх ёстой" });

async function saveUploads(files: File[]) {
  const urls: string[] = [];
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  for (const f of files) {
    if (!f.size) continue;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(f.type)) throw new Error("Зөвхөн JPG, PNG, WEBP зураг оруулна уу");
    if (f.size > 5 * 1024 * 1024) throw new Error("Зураг 5MB-аас ихгүй байх ёстой");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[f.type]!;
    const name = `${randomUUID()}.${ext}`;
    await fs.writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
    urls.push(`/api/uploads/${name}`);
  }
  return urls;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = base || `product-${Date.now().toString(36)}`;
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
}

export async function saveProduct(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const id = (formData.get("id") as string) || undefined;
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    categoryId: formData.get("categoryId"),
    style: formData.get("style"),
    description: formData.get("description"),
    price: formData.get("price"),
    salePrice: formData.get("salePrice"),
    packSize: formData.get("packSize") || 1,
    isNew: formData.get("isNew") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { ok: false, error: "Мэдээллээ шалгана уу", fieldErrors: fieldErrors(parsed.error) };
  const colors = colorSchema.safeParse(JSON.parse((formData.get("colors") as string) || "[]"));
  if (!colors.success) return { ok: false, error: "Өнгөний мэдээлэл буруу", fieldErrors: { colors: "Өнгө бүрт нэр өгнө үү" } };
  const stock = Object.fromEntries(SIZES.map((s) => [s, Math.max(0, Math.floor(Number(formData.get(`stock_${s}`)) || 0))]));

  try {
    const kept = z.array(z.string()).parse(JSON.parse((formData.get("existingImages") as string) || "[]"));
    const uploaded = await saveUploads(formData.getAll("newImages").filter((f): f is File => f instanceof File));
    const images = [...kept, ...uploaded];
    const d = parsed.data;
    const slug = await uniqueSlug(slugify(d.slug || d.name), id);
    const data = {
      name: d.name, slug, categoryId: d.categoryId, style: d.style, description: d.description,
      price: d.price, salePrice: d.salePrice, packSize: d.packSize, isNew: d.isNew, isFeatured: d.isFeatured,
      colors: JSON.stringify(colors.data), images: JSON.stringify(images),
    };
    const product = id
      ? await prisma.product.update({ where: { id }, data })
      : await prisma.product.create({ data });
    for (const size of SIZES) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size } },
        update: { stock: stock[size] },
        create: { productId: product.id, size, stock: stock[size] },
      });
    }
    refresh();
    return { ok: true, id: product.id };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await prisma.product.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const p = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!p) return { ok: false, error: "Бараа олдсонгүй" };
  const copy = await prisma.product.create({
    data: {
      name: `${p.name} (хуулбар)`,
      slug: await uniqueSlug(`${p.slug}-copy`),
      description: p.description, categoryId: p.categoryId, style: p.style, price: p.price, salePrice: p.salePrice,
      packSize: p.packSize, colors: p.colors, images: p.images, isNew: p.isNew, isFeatured: false,
      variants: { create: p.variants.map((v) => ({ size: v.size, stock: 0 })) },
    },
  });
  refresh();
  return { ok: true, id: copy.id };
}

export async function updateStock(variantId: string, stock: number): Promise<ActionResult> {
  const n = Math.floor(stock);
  if (!Number.isFinite(n) || n < 0 || n > 9999) return { ok: false, error: "0–9999 хооронд тоо оруулна уу" };
  await prisma.productVariant.update({ where: { id: variantId }, data: { stock: n } });
  refresh();
  return { ok: true };
}

/* ---------------- Categories ---------------- */

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, { error: "Нэр оруулна уу" }).max(40),
  styles: z.array(z.string().trim().min(1).max(40)).max(20),
});

export async function saveCategory(payload: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: fieldErrors(parsed.error).name ?? "Мэдээллээ шалгана уу" };
  const { id, name, styles } = parsed.data;
  const unique = [...new Set(styles)];
  try {
    if (id) {
      await prisma.category.update({ where: { id }, data: { name, styles: JSON.stringify(unique) } });
    } else {
      let slug = slugify(name) || `category-${Date.now().toString(36)}`;
      if (await prisma.category.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      const count = await prisma.category.count();
      await prisma.category.create({ data: { name, slug, styles: JSON.stringify(unique), sortOrder: count } });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, error: `Энэ ангилалд ${count} бараа байна. Эхлээд барааг шилжүүлнэ үү.` };
  await prisma.category.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/* ---------------- Promotions ---------------- */

const promotionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("size_discount"), rule: sizeDiscountRule }),
  z.object({ type: z.literal("size_gift"), rule: sizeGiftRule }),
]);
const promotionBase = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, { error: "Гарчиг оруулна уу" }).max(40),
  description: z.string().trim().min(5, { error: "Тайлбар оруулна уу" }).max(300),
  active: z.boolean(),
  bannerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function savePromotion(payload: unknown): Promise<ActionResult> {
  const base = promotionBase.safeParse(payload);
  const typed = promotionSchema.safeParse(payload);
  if (!base.success) return { ok: false, error: "Мэдээллээ шалгана уу", fieldErrors: fieldErrors(base.error) };
  if (!typed.success) return { ok: false, error: "Урамшууллын нөхцөл буруу байна" };
  const { id, ...rest } = base.data;
  const data = { ...rest, type: typed.data.type, rule: JSON.stringify(typed.data.rule) };
  if (id) await prisma.promotion.update({ where: { id }, data });
  else await prisma.promotion.create({ data });
  refresh();
  return { ok: true };
}

export async function togglePromotion(id: string, active: boolean): Promise<ActionResult> {
  await prisma.promotion.update({ where: { id }, data: { active } });
  refresh();
  return { ok: true };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  await prisma.promotion.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/* ---------------- Settings & demo ---------------- */

const settingsSchema = z.object({
  phone: z.string().regex(/^\d{8}$/, { error: "8 оронтой дугаар" }),
  instagram: z.string().trim().min(1).max(40),
  facebook: z.string().trim().max(60),
  deliveryStandard: z.coerce.number().int().min(0).max(100000),
  deliveryExpress: z.coerce.number().int().min(0).max(100000),
  deliveryExpressFar: z.coerce.number().int().min(0).max(100000),
  labelStorepay: z.string().trim().min(1).max(40),
  labelPocketzero: z.string().trim().min(1).max(40),
  labelBank: z.string().trim().min(1).max(40),
  labelCash: z.string().trim().min(1).max(40),
  bankAccount: z.string().trim().min(3).max(120),
});

export async function saveSettings(payload: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Мэдээллээ шалгана уу", fieldErrors: fieldErrors(parsed.error) };
  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
    ),
  );
  refresh();
  return { ok: true };
}

export async function resetDemoData(): Promise<ActionResult> {
  try {
    await seedDatabase(prisma);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
