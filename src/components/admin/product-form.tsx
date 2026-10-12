"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Plus, Save, X } from "lucide-react";
import { saveProduct } from "@/app/actions/admin";
import { ProductImage } from "@/components/product-image";
import { LOW_STOCK_THRESHOLD, SIZES } from "@/lib/constants";
import type { CategoryDTO, Color, ProductDTO } from "@/lib/data";
import { cn } from "@/lib/format";
import { useUi } from "@/lib/stores";

export function ProductForm({ categories, product }: { categories: CategoryDTO[]; product?: ProductDTO }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [colors, setColors] = useState<Color[]>(product?.colors.length ? product.colors : [{ name: "", hex: "#F4C7CF" }]);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const styles = categories.find((c) => c.id === categoryId)?.styles ?? [];
  const stock = Object.fromEntries((product?.variants ?? []).map((v) => [v.size, v.stock]));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("colors", JSON.stringify(colors.filter((c) => c.name.trim())));
    fd.set("existingImages", JSON.stringify(images));
    fd.delete("newImages");
    previews.forEach((p) => fd.append("newImages", p.file));
    start(async () => {
      const res = await saveProduct(fd);
      if (res.ok) {
        toast(product ? "Хадгаллаа" : "Бараа нэмэгдлээ");
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
        router.push(`/admin/products/${res.id}`);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast(res.error, "error");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 pb-24 lg:grid-cols-[1fr_340px] lg:pb-0">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-4">
        <section className="card space-y-4 p-5">
          <F label="Нэр" error={errors.name}>
            <input name="name" defaultValue={product?.name} className="input" required />
          </F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Ангилал" error={errors.categoryId}>
              <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </F>
            <F label="Загвар" error={errors.style}>
              <select name="style" defaultValue={product?.style} key={categoryId} className="input">
                {styles.map((s) => <option key={s} value={s}>{s}</option>)}
                {product && !styles.includes(product.style) && <option value={product.style}>{product.style}</option>}
              </select>
            </F>
          </div>
          <F label="Тайлбар" error={errors.description}>
            <textarea name="description" rows={3} defaultValue={product?.description} className="input py-3" />
          </F>
          <div className="grid grid-cols-3 gap-3">
            <F label="Үнэ (₮)" error={errors.price}><input name="price" inputMode="numeric" defaultValue={product?.price} className="input" /></F>
            <F label="Хямдралтай үнэ" error={errors.salePrice}><input name="salePrice" inputMode="numeric" defaultValue={product?.salePrice ?? ""} placeholder="—" className="input" /></F>
            <F label="Багцад (ш)" error={errors.packSize}><input name="packSize" inputMode="numeric" defaultValue={product?.packSize ?? 1} className="input" /></F>
          </div>
          <F label="Slug (URL)" error={errors.slug}>
            <input name="slug" defaultValue={product?.slug} placeholder="Хоосон бол нэрнээс автоматаар" className="input font-mono text-sm" />
          </F>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Хэмжээ тус бүрийн үлдэгдэл</h2>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {SIZES.map((s) => (
              <label key={s} className="text-center">
                <span className="mb-1 block text-xs font-bold">{s}</span>
                <input
                  name={`stock_${s}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  defaultValue={stock[s] ?? 0}
                  className={cn("input px-1 text-center tabular-nums", (stock[s] ?? 0) <= LOW_STOCK_THRESHOLD && product && "border-amber-300 bg-amber-50")}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Өнгө</h2>
          {errors.colors && <p className="field-error">{errors.colors}</p>}
          <div className="mt-3 space-y-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={c.hex} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))} className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" aria-label="Өнгө сонгох" />
                <input value={c.name} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Өнгөний нэр, ж: Ягаан" className="input" />
                <button type="button" onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))} className="icon-btn shrink-0" aria-label="Өнгө хасах"><X className="size-4" /></button>
              </div>
            ))}
          </div>
          {colors.length < 6 && (
            <button type="button" onClick={() => setColors((cs) => [...cs, { name: "", hex: "#F4C7CF" }])} className="btn btn-ghost btn-sm mt-2"><Plus className="size-4" /> Өнгө нэмэх</button>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="card p-5">
          <h2 className="font-semibold">Зураг</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {images.map((src) => (
              <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-peach">
                <ProductImage src={src} alt="" sizes="100px" />
                <button type="button" onClick={() => setImages((im) => im.filter((x) => x !== src))} className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 shadow" aria-label="Зураг хасах"><X className="size-3.5" /></button>
              </div>
            ))}
            {previews.map((p) => (
              <div key={p.url} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-peach">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.url} alt="" className="size-full object-cover" />
                <span className="badge absolute bottom-1 left-1 bg-plum text-white">Шинэ</span>
                <button type="button" onClick={() => setPreviews((ps) => ps.filter((x) => x !== p))} className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 shadow" aria-label="Зураг хасах"><X className="size-3.5" /></button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-[3/4] place-items-center rounded-xl border-2 border-dashed border-blush text-plum hover:bg-blush-soft">
              <span className="flex flex-col items-center gap-1 text-xs font-semibold"><ImagePlus className="size-6" /> Нэмэх</span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              setPreviews((ps) => [...ps, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
              e.target.value = "";
            }}
          />
          <p className="mt-2 text-[11px] text-muted">JPG/PNG/WEBP, 5MB хүртэл. Демо: public/uploads хавтсанд хадгалагдана.</p>
        </section>

        <section className="card space-y-3 p-5">
          <Toggle name="isNew" label="Шинэ ирэлт" defaultChecked={product?.isNew} />
          <Toggle name="isFeatured" label="Онцлох (нүүр хуудсанд)" defaultChecked={product?.isFeatured} />
        </section>

        <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <Link href="/admin/products" className="btn btn-outline">Болих</Link>
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Хадгалах
          </button>
        </div>
      </aside>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className={cn("block", error && "[&_.input]:border-red-400")}>{children}</span>
      {error && <span className="field-error block">{error}</span>}
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
      {label}
      <span className="relative inline-flex">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-plum peer-focus-visible:ring-2 peer-focus-visible:ring-plum peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
