"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, LoaderCircle, Pencil, Percent, Plus, Search, Trash2 } from "lucide-react";
import { deletePromotion, savePromotion, togglePromotion } from "@/app/actions/admin";
import { ConfirmDialog, Sheet } from "@/components/ui";
import { SIZES, type Size } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { PromotionDTO } from "@/lib/promotions";
import { useUi } from "@/lib/stores";

type ProductLite = { id: string; name: string; categoryName: string };

export function PromotionsEditor({ promos, products }: { promos: PromotionDTO[]; products: ProductLite[] }) {
  const [editing, setEditing] = useState<PromotionDTO | "new" | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {promos.map((p) => (
          <PromoCard key={p.id} promo={p} products={products} onEdit={() => setEditing(p)} />
        ))}
        <button type="button" onClick={() => setEditing("new")} className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blush text-sm font-semibold text-plum hover:bg-blush-soft">
          <Plus className="size-6" /> Шинэ урамшуулал
        </button>
      </div>
      {editing && <PromoForm key={editing === "new" ? "new" : editing.id} promo={editing === "new" ? null : editing} products={products} onClose={() => setEditing(null)} />}
    </>
  );
}

function PromoCard({ promo: p, products, onEdit }: { promo: PromotionDTO; products: ProductLite[]; onEdit: () => void }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const summary =
    p.type === "size_discount"
      ? `${p.rule.size} хэмжээ −${p.rule.percent}% · ${p.rule.productIds.filter((id) => products.some((x) => x.id === id)).length} бараа`
      : `${p.rule.size}: ${p.rule.minSets} хослол эсвэл ${p.rule.minPanties} дотуур өмд → ${p.rule.giftCount} бэлэг`;

  return (
    <section className={cn("card overflow-hidden", !p.active && "opacity-70")}>
      <div className="h-2" style={{ background: p.bannerColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              {p.type === "size_discount" ? <Percent className="size-3.5" /> : <Gift className="size-3.5" />}
              {p.type === "size_discount" ? "Хэмжээний хямдрал" : "Бэлэгтэй урамшуулал"}
            </p>
            <h2 className="mt-1 font-serif text-3xl">{p.title}</h2>
          </div>
          <label className="relative mt-1 inline-flex cursor-pointer">
            <input
              type="checkbox"
              checked={p.active}
              disabled={pending}
              onChange={(e) =>
                start(async () => {
                  await togglePromotion(p.id, e.target.checked);
                  toast(e.target.checked ? "Идэвхжүүллээ" : "Түр зогсоолоо");
                  router.refresh();
                })
              }
              className="peer sr-only"
              aria-label={`${p.title} идэвхтэй эсэх`}
            />
            <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-plum peer-focus-visible:ring-2 peer-focus-visible:ring-plum" />
            <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </label>
        </div>
        <p className="mt-2 text-sm text-muted">{p.description}</p>
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs font-medium">{summary}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onEdit} className="btn btn-outline btn-sm"><Pencil className="size-4" /> Засах</button>
          <button type="button" onClick={() => setConfirm(true)} className="btn btn-ghost btn-sm text-red-700 hover:bg-red-50"><Trash2 className="size-4" /> Устгах</button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        pending={pending}
        danger
        title="Урамшуулал устгах уу?"
        confirmLabel="Устгах"
        description="Түр зогсоохыг хүсвэл устгалгүйгээр унтраалгаар идэвхгүй болгож болно."
        onConfirm={() =>
          start(async () => {
            await deletePromotion(p.id);
            setConfirm(false);
            toast("Устгалаа");
            router.refresh();
          })
        }
      />
    </section>
  );
}

function PromoForm({ promo, products, onClose }: { promo: PromotionDTO | null; products: ProductLite[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(promo?.title ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");
  const [bannerColor, setBannerColor] = useState(promo?.bannerColor ?? "#F4C7CF");
  const [active, setActive] = useState(promo?.active ?? true);
  const [type, setType] = useState<PromotionDTO["type"]>(promo?.type ?? "size_discount");
  const [size, setSize] = useState<Size>((promo?.rule.size as Size) ?? "L");
  const [percent, setPercent] = useState(promo?.type === "size_discount" ? promo.rule.percent : 20);
  const [productIds, setProductIds] = useState<string[]>(promo?.type === "size_discount" ? promo.rule.productIds : []);
  const [minSets, setMinSets] = useState(promo?.type === "size_gift" ? promo.rule.minSets : 1);
  const [minPanties, setMinPanties] = useState(promo?.type === "size_gift" ? promo.rule.minPanties : 3);
  const [giftCount, setGiftCount] = useState(promo?.type === "size_gift" ? promo.rule.giftCount : 2);
  const [q, setQ] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () =>
    start(async () => {
      const rule = type === "size_discount" ? { size, percent: Number(percent), productIds } : { size, minSets: Number(minSets), minPanties: Number(minPanties), giftCount: Number(giftCount) };
      const res = await savePromotion({ id: promo?.id, title, description, bannerColor, active, type, rule });
      if (res.ok) {
        toast("Хадгаллаа");
        onClose();
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast(res.error, "error");
      }
    });

  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Sheet
      open
      onClose={onClose}
      title={promo ? "Урамшуулал засах" : "Шинэ урамшуулал"}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline">Болих</button>
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary flex-1">
            {pending && <LoaderCircle className="size-4 animate-spin" />} Хадгалах
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="label">Гарчиг</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="ж: Sale L" />
          {errors.title && <span className="field-error block">{errors.title}</span>}
        </label>
        <label className="block">
          <span className="label">Тайлбар</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input py-3" />
          {errors.description && <span className="field-error block">{errors.description}</span>}
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="color" value={bannerColor} onChange={(e) => setBannerColor(e.target.value.toUpperCase())} className="size-10 cursor-pointer rounded-lg border border-line p-0.5" />
            Баннерын өнгө
          </label>
          <label className="ml-auto flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#6B1E3A]" /> Идэвхтэй
          </label>
        </div>
        <fieldset>
          <legend className="label">Төрөл</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["size_discount", "Хэмжээний хямдрал"],
                ["size_gift", "Бэлэгтэй"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setType(v)} aria-pressed={type === v} className={cn("chip", type === v && "chip-active")}>{l}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Хэмжээ</legend>
          <div className="grid grid-cols-5 gap-1.5">
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} aria-pressed={size === s} className={cn("chip px-0", size === s && "chip-active")}>{s}</button>
            ))}
          </div>
        </fieldset>
        {type === "size_discount" ? (
          <>
            <label className="block">
              <span className="label">Хямдрал (%)</span>
              <input type="number" min={1} max={90} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="input w-28" />
            </label>
            <div>
              <p className="label">Хамрах бараа ({productIds.length})</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} className="input min-h-10 pl-9 text-sm" placeholder="Хайх…" aria-label="Бараа хайх" />
              </div>
              <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-white">
                {list.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-cream">
                      <input
                        type="checkbox"
                        checked={productIds.includes(p.id)}
                        onChange={(e) => setProductIds((ids) => (e.target.checked ? [...ids, p.id] : ids.filter((x) => x !== p.id)))}
                        className="size-4 accent-[#6B1E3A]"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-muted">{p.categoryName}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <label><span className="label">Хослол ≥</span><input type="number" min={0} value={minSets} onChange={(e) => setMinSets(Number(e.target.value))} className="input" /></label>
            <label><span className="label">Дотуур өмд ≥</span><input type="number" min={0} value={minPanties} onChange={(e) => setMinPanties(Number(e.target.value))} className="input" /></label>
            <label><span className="label">Бэлэг</span><input type="number" min={1} value={giftCount} onChange={(e) => setGiftCount(Number(e.target.value))} className="input" /></label>
          </div>
        )}
      </div>
    </Sheet>
  );
}
