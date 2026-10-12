"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/ui";
import { SIZES } from "@/lib/constants";
import { cn } from "@/lib/format";

export type CatalogParams = {
  category: string;
  style: string;
  size: string;
  color: string;
  price: string;
  sale: string;
  new: string;
  sort: string;
  q: string;
};

const SORTS = [
  { value: "recommended", label: "Санал болгох" },
  { value: "new", label: "Шинэ нь эхэнд" },
  { value: "popular", label: "Эрэлттэй" },
  { value: "price-asc", label: "Үнэ: багаас их" },
  { value: "price-desc", label: "Үнэ: ихээс бага" },
];

export function CatalogControls({
  params,
  resultCount,
  categories,
  colors,
  priceRanges,
}: {
  params: CatalogParams;
  resultCount: number;
  categories: { slug: string; name: string; styles: string[] }[];
  colors: { name: string; hex: string }[];
  priceRanges: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<CatalogParams>) => {
    const next = { ...params, ...patch };
    if (patch.category !== undefined && patch.category !== params.category) next.style = "";
    const sp = new URLSearchParams();
    (Object.keys(next) as (keyof CatalogParams)[]).forEach((k) => {
      if (next[k] && !(k === "sort" && next[k] === "recommended")) sp.set(k, next[k]);
    });
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/shop?${qs}` : "/shop", { scroll: false }));
  };
  const toggle = (k: keyof CatalogParams, v: string) => update({ [k]: params[k] === v ? "" : v });

  const styles = categories.find((c) => c.slug === params.category)?.styles ?? [];
  const activeCount = (["category", "style", "size", "color", "price", "sale", "new"] as const).filter((k) => params[k]).length;

  const groups = (
    <div className="space-y-6">
      <Group title="Ангилал">
        <Chip active={!params.category} onClick={() => update({ category: "" })}>Бүгд</Chip>
        {categories.map((c) => (
          <Chip key={c.slug} active={params.category === c.slug} onClick={() => toggle("category", c.slug)}>{c.name}</Chip>
        ))}
      </Group>
      {styles.length > 0 && (
        <Group title="Загвар">
          {styles.map((s) => (
            <Chip key={s} active={params.style === s} onClick={() => toggle("style", s)}>{s}</Chip>
          ))}
        </Group>
      )}
      <Group title="Хэмжээ (бэлэн байгаа)">
        <div className="grid w-full grid-cols-5 gap-1.5">
          {SIZES.map((s) => (
            <Chip key={s} active={params.size === s} onClick={() => toggle("size", s)} className="px-0">{s}</Chip>
          ))}
        </div>
      </Group>
      <Group title="Өнгө">
        {colors.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => toggle("color", c.name)}
            aria-pressed={params.color === c.name}
            className={cn("chip gap-2 pl-2", params.color === c.name && "border-plum ring-2 ring-plum/20")}
          >
            <span className="size-5 rounded-full border border-ink/10" style={{ background: c.hex }} aria-hidden />
            {c.name}
          </button>
        ))}
      </Group>
      <Group title="Үнэ">
        {priceRanges.map((r) => (
          <Chip key={r.key} active={params.price === r.key} onClick={() => toggle("price", r.key)}>{r.label}</Chip>
        ))}
      </Group>
      <Group title="Онцлох">
        <Chip active={!!params.sale} onClick={() => toggle("sale", "1")}>Хямдралтай</Chip>
        <Chip active={!!params.new} onClick={() => toggle("new", "1")}>Шинэ ирэлт</Chip>
      </Group>
    </div>
  );

  const sortSelect = (
    <label className="relative">
      <span className="sr-only">Эрэмбэлэх</span>
      <select
        value={params.sort}
        onChange={(e) => update({ sort: e.target.value })}
        className="input min-h-10 w-auto appearance-none rounded-full pr-8 text-sm font-medium"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted">▾</span>
    </label>
  );

  return (
    <>
      {/* Mobile / tablet bar */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center gap-2 border-b border-line/60 bg-cream/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <button type="button" className="chip font-semibold" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" /> Шүүлтүүр
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-plum text-[10px] text-white">{activeCount}</span>}
        </button>
        {pending && <LoaderCircle className="size-4 animate-spin text-plum" aria-label="Ачаалж байна" />}
        <div className="ml-auto">{sortSelect}</div>
      </div>
      <ActiveFilters params={params} categories={categories} priceRanges={priceRanges} update={update} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Шүүлтүүр">
        <div className="sticky top-24 space-y-6">
          <div className="flex items-center justify-between">
            {sortSelect}
            {pending && <LoaderCircle className="size-4 animate-spin text-plum" aria-label="Ачаалж байна" />}
          </div>
          {groups}
        </div>
      </aside>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Шүүлтүүр"
        footer={
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={() => startTransition(() => router.push("/shop", { scroll: false }))}>
              Цэвэрлэх
            </button>
            <button type="button" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} {resultCount} бараа харах
            </button>
          </div>
        }
      >
        {groups}
      </Sheet>
    </>
  );
}

function ActiveFilters({
  params,
  categories,
  priceRanges,
  update,
}: {
  params: CatalogParams;
  categories: { slug: string; name: string }[];
  priceRanges: { key: string; label: string }[];
  update: (p: Partial<CatalogParams>) => void;
}) {
  const chips: { key: keyof CatalogParams; label: string }[] = [];
  if (params.q) chips.push({ key: "q", label: `“${params.q}”` });
  if (params.category) chips.push({ key: "category", label: categories.find((c) => c.slug === params.category)?.name ?? params.category });
  if (params.style) chips.push({ key: "style", label: params.style });
  if (params.size) chips.push({ key: "size", label: `Хэмжээ ${params.size}` });
  if (params.color) chips.push({ key: "color", label: params.color });
  if (params.price) chips.push({ key: "price", label: priceRanges.find((r) => r.key === params.price)?.label ?? params.price });
  if (params.sale) chips.push({ key: "sale", label: "Хямдралтай" });
  if (params.new) chips.push({ key: "new", label: "Шинэ" });
  if (!chips.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-3 lg:hidden">
      {chips.map((c) => (
        <button key={c.key} type="button" onClick={() => update({ [c.key]: "" })} className="badge shrink-0 bg-blush-soft py-2 pl-3 pr-2 text-xs text-plum">
          {c.label} <X className="size-3.5" aria-label="арилгах" />
        </button>
      ))}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-[13px] font-semibold text-ink">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn("chip", active && "chip-active", className)}>
      {children}
    </button>
  );
}
