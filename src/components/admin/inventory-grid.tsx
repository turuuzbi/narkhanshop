"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle } from "lucide-react";
import { updateStock } from "@/app/actions/admin";
import { ProductImage } from "@/components/product-image";
import { LOW_STOCK_THRESHOLD, SIZES } from "@/lib/constants";
import { cn } from "@/lib/format";
import { useUi } from "@/lib/stores";

type Row = { id: string; name: string; categorySlug: string; image: string; variants: { id: string; size: string; stock: number }[] };

export function InventoryGrid({ rows, categories, initialLowOnly }: { rows: Row[]; categories: { slug: string; name: string }[]; initialLowOnly: boolean }) {
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(initialLowOnly);
  const visible = rows.filter((r) => (!cat || r.categorySlug === cat) && (!lowOnly || r.variants.some((v) => v.stock <= LOW_STOCK_THRESHOLD)));

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {[{ slug: "", name: "Бүгд" }, ...categories].map((c) => (
          <button key={c.slug} type="button" onClick={() => setCat(c.slug)} className={cn("chip min-h-9 shrink-0", cat === c.slug && "chip-active")}>{c.name}</button>
        ))}
        <button type="button" onClick={() => setLowOnly((v) => !v)} aria-pressed={lowOnly} className={cn("chip min-h-9 shrink-0", lowOnly && "border-amber-500 bg-amber-50 text-amber-900")}>
          ⚠ Зөвхөн дуусаж буй
        </button>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-blush-soft/60 text-xs text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-[#FCF1F3] px-3 py-3 text-left font-semibold">Бараа</th>
              {SIZES.map((s) => <th key={s} className="w-20 px-1 py-3 text-center font-bold text-ink">{s}</th>)}
              <th className="w-16 px-3 py-3 text-right font-semibold">Нийт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.length === 0 && (
              <tr><td colSpan={7} className="py-10 text-center text-muted">Тохирох бараа алга 🎉</td></tr>
            )}
            {visible.map((r) => (
              <InventoryRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block size-3 rounded bg-red-100 align-middle" /> Дууссан</span>
        <span><span className="mr-1 inline-block size-3 rounded bg-amber-100 align-middle" /> {LOW_STOCK_THRESHOLD} ба түүнээс бага</span>
      </p>
    </>
  );
}

function InventoryRow({ row }: { row: Row }) {
  const [values, setValues] = useState(Object.fromEntries(row.variants.map((v) => [v.size, v.stock])) as Record<string, number>);
  const total = Object.values(values).reduce((a, b) => a + b, 0);
  return (
    <tr className="hover:bg-cream/70">
      <td className="sticky left-0 z-10 bg-white px-3 py-2">
        <Link href={`/admin/products/${row.id}`} className="flex items-center gap-2.5 hover:text-plum">
          <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-peach">
            <ProductImage src={row.image} alt="" sizes="32px" categorySlug={row.categorySlug} />
          </span>
          <span className="line-clamp-2 max-w-[180px] text-xs font-medium leading-snug">{row.name}</span>
        </Link>
      </td>
      {SIZES.map((s) => {
        const v = row.variants.find((x) => x.size === s);
        return (
          <td key={s} className="px-1 py-2 text-center">
            {v ? <StockCell variantId={v.id} value={values[s]} label={`${row.name} ${s}`} onSaved={(n) => setValues((p) => ({ ...p, [s]: n }))} /> : "—"}
          </td>
        );
      })}
      <td className="px-3 py-2 text-right font-semibold tabular-nums">{total}</td>
    </tr>
  );
}

function StockCell({ variantId, value, label, onSaved }: { variantId: string; value: number; label: string; onSaved: (n: number) => void }) {
  const toast = useUi((s) => s.toast);
  const [draft, setDraft] = useState(String(value));
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const n = Number(draft);

  const commit = async () => {
    const next = Math.max(0, Math.floor(Number(draft) || 0));
    setDraft(String(next));
    if (next === value) return;
    setState("saving");
    const res = await updateStock(variantId, next);
    if (res.ok) {
      onSaved(next);
      setState("saved");
      setTimeout(() => setState("idle"), 1200);
    } else {
      setDraft(String(value));
      setState("idle");
      toast(res.error, "error");
    }
  };

  return (
    <span className="relative inline-block">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={draft}
        aria-label={`${label} үлдэгдэл`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        onFocus={(e) => e.target.select()}
        className={cn(
          "h-10 w-16 rounded-lg border text-center font-semibold tabular-nums outline-none transition focus:border-plum focus:ring-2 focus:ring-blush",
          n <= 0 ? "border-red-200 bg-red-50 text-red-800" : n <= LOW_STOCK_THRESHOLD ? "border-amber-200 bg-amber-50 text-amber-900" : "border-line bg-white",
        )}
      />
      {state !== "idle" && (
        <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-white shadow">
          {state === "saving" ? <LoaderCircle className="size-3 animate-spin text-plum" /> : <Check className="size-3 text-emerald-600" />}
        </span>
      )}
    </span>
  );
}
