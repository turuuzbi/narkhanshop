"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, LoaderCircle, Search, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { createQuickOrder } from "@/app/actions/admin";
import { ProductImage } from "@/components/product-image";
import { GiftNotes, TotalsRows } from "@/components/shop/cart-lines";
import { QtyStepper } from "@/components/ui";
import { DISTRICTS, LOW_STOCK_THRESHOLD, PAYMENT_METHODS, SIZES, type DeliveryType, type OrderSource, type PaymentMethod } from "@/lib/constants";
import type { ProductDTO } from "@/lib/data";
import { cn, formatMNT } from "@/lib/format";
import { deliveryFee, giftStatus, priceCart, type PromotionDTO } from "@/lib/promotions";
import { paymentLabel, type ShopSettings } from "@/lib/settings";
import { useUi } from "@/lib/stores";

type Line = { productId: string; size: string; qty: number };

const ABBR: Record<string, string> = { бзд: "Баянзүрх", сбд: "Сүхбаатар", худ: "Хан-Уул", бгд: "Баянгол", схд: "Сонгинохайрхан", чд: "Чингэлтэй", чгд: "Чингэлтэй", нд: "Налайх" };
const ADDRESS_WORDS = /(байр|тоот|хороолол|орц|гудамж|хотхон|давхар|хаалга|toot|bair)/i;
const SAMPLE_DM = `Сайн байна уу 😊 Оюунаа гэдэг
9911 4455
БЗД 26-р хороо, Зайсан Хилл хотхон 5-р байр 22 тоот
Орой 7-оос хойш авна`;

/** Pulls phone, district, khoroo, name and address out of a pasted DM. */
function parseDm(text: string) {
  const out: Partial<Record<"customerName" | "phone" | "district" | "khoroo" | "address" | "note", string>> = {};
  const phone = text.match(/(?<!\d)([6-9]\d{3})[\s-]?(\d{4})(?!\d)/);
  if (phone) out.phone = phone[1] + phone[2];
  const lower = text.toLowerCase();
  const district =
    DISTRICTS.find((d) => lower.includes(d.toLowerCase().slice(0, 6))) ??
    Object.entries(ABBR).find(([k]) => new RegExp(`(^|[^а-яөү])${k}([^а-яөү]|$)`, "i").test(lower))?.[1];
  if (district) out.district = district;
  const khoroo = text.match(/(\d{1,2})\s*-?\s*(?:р|дугаар|-р)?\s*хороо/i);
  if (khoroo) out.khoroo = khoroo[1];

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const named = text.match(/нэр\s*[:：-]?\s*([А-ЯЁӨҮа-яёөүA-Za-z.\s]{2,30})/i) ?? text.match(/([А-ЯЁӨҮ][а-яёөү]{2,20})\s+гэдэг/);
  if (named) out.customerName = named[1].trim();
  const addr = lines.filter((l) => ADDRESS_WORDS.test(l));
  if (addr.length) {
    out.address = addr
      .join(", ")
      .replace(/(?<!\d)([6-9]\d{3})[\s-]?(\d{4})(?!\d)/, "")
      .replace(/^(бзд|сбд|худ|бгд|схд|чд|чгд|нд)\s*/i, "")
      .replace(/\d{1,2}\s*-?\s*(р|дугаар)?\s*хороо,?\s*/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  const noteLine = lines.find((l) => /(орой|өглөө|цаг|хойш|өмнө|залга)/i.test(l) && !ADDRESS_WORDS.test(l) && !/гэдэг/.test(l));
  if (noteLine) out.note = noteLine;
  return out;
}

export function QuickOrderForm({
  products,
  categories,
  promos,
  settings,
}: {
  products: ProductDTO[];
  categories: { slug: string; name: string }[];
  promos: PromotionDTO[];
  settings: ShopSettings;
}) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [dm, setDm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    customerName: "",
    phone: "",
    district: "",
    khoroo: "",
    address: "",
    note: "",
    source: "instagram" as OrderSource,
    deliveryType: "standard" as DeliveryType,
    paymentMethod: "cash" as PaymentMethod,
    status: "confirmed" as "confirmed" | "new",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const q = query.trim().toLowerCase();
  const visible = products.filter(
    (p) => (!cat || p.categorySlug === cat) && (!q || p.name.toLowerCase().includes(q) || p.style.toLowerCase().includes(q)),
  );

  const stockOf = (productId: string, size: string) => byId.get(productId)?.variants.find((v) => v.size === size)?.stock ?? 0;
  const addLine = (productId: string, size: string) => {
    setLines((ls) => {
      const hit = ls.find((l) => l.productId === productId && l.size === size);
      if (hit) {
        if (hit.qty >= stockOf(productId, size)) return ls;
        return ls.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...ls, { productId, size, qty: 1 }];
    });
    setErrors((e) => ({ ...e, items: "" }));
  };
  const setQty = (i: number, qty: number) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, qty } : l)).filter((l) => l.qty > 0));

  const priced = priceCart(
    lines.map((l) => {
      const p = byId.get(l.productId)!;
      return { id: p.id, price: p.price, salePrice: p.salePrice, size: l.size, qty: l.qty };
    }),
    promos,
  );
  const gifts = giftStatus(
    lines.map((l) => {
      const p = byId.get(l.productId)!;
      return { categorySlug: p.categorySlug, size: l.size, qty: l.qty, packSize: p.packSize };
    }),
    promos,
  );
  const fee = deliveryFee(f.deliveryType, f.district, settings);
  const total = priced.itemsTotal + fee;

  const applyDm = (text = dm) => {
    const parsed = parseDm(text);
    const n = Object.keys(parsed).length;
    setF((p) => ({ ...p, ...parsed }));
    setErrors({});
    toast(n ? `${n} талбар автоматаар бөглөгдлөө` : "Мэдээлэл танигдсангүй — гараар бөглөнө үү", n ? "success" : "info");
  };

  const submit = () => {
    if (!lines.length) {
      setErrors({ items: "Дор хаяж 1 бараа сонгоно уу" });
      document.getElementById("qo-products")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    start(async () => {
      const res = await createQuickOrder({ ...f, items: lines });
      if (res.ok) {
        toast(`${res.number} бүртгэгдлээ`);
        router.push(`/admin/orders/${res.id}?created=1`);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pb-0">
      {/* Products */}
      <section id="qo-products" className="card min-w-0 scroll-mt-20 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-plum text-xs text-white">1</span> Бараа сонгох</h2>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" placeholder="Нэрээр хайх: сатин, thong…" aria-label="Бараа хайх" />
        </div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ slug: "", name: "Бүгд" }, ...categories].map((c) => (
            <button key={c.slug} type="button" onClick={() => setCat(c.slug)} className={cn("chip min-h-8 shrink-0 px-3 text-xs", cat === c.slug && "chip-active")}>
              {c.name}
            </button>
          ))}
        </div>
        {errors.items && <p className="field-error">{errors.items}</p>}
        <ul className="mt-3 max-h-[440px] divide-y divide-line overflow-y-auto overscroll-contain pr-1 lg:max-h-[620px]">
          {visible.length === 0 && <li className="py-8 text-center text-sm text-muted">Бараа олдсонгүй</li>}
          {visible.map((p) => (
            <li key={p.id} className="flex gap-3 py-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-peach">
                <ProductImage src={p.images[0]} alt="" sizes="48px" categorySlug={p.categorySlug} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{formatMNT(p.salePrice ?? p.price)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {SIZES.map((s) => {
                    const n = stockOf(p.id, s);
                    const chosen = lines.find((l) => l.productId === p.id && l.size === s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={n <= 0}
                        onClick={() => addLine(p.id, s)}
                        aria-label={`${p.name} ${s} нэмэх, ${n} үлдэгдэлтэй`}
                        className={cn(
                          "flex h-9 min-w-11 flex-col items-center justify-center rounded-lg border px-1.5 text-[11px] font-bold leading-none transition active:scale-95",
                          n <= 0 && "border-dashed border-line text-stone-400 line-through",
                          n > 0 && !chosen && "border-line bg-white hover:border-plum",
                          chosen && "border-plum bg-plum text-white",
                        )}
                      >
                        {s}
                        <span className={cn("mt-0.5 text-[9px] font-medium", chosen ? "text-blush" : n <= LOW_STOCK_THRESHOLD ? "text-plum" : "text-muted")}>
                          {chosen ? `×${chosen.qty}` : n}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="min-w-0 space-y-4">
        {/* Selected */}
        <section className="card p-4 sm:p-5">
          <h2 className="font-semibold">Сонгосон бараа {lines.length > 0 && <span className="text-muted">({lines.reduce((s, l) => s + l.qty, 0)})</span>}</h2>
          {lines.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Зүүн талаас хэмжээн дээр дарж нэмнэ.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {lines.map((l, i) => {
                const p = byId.get(l.productId)!;
                const line = priced.lines[i];
                return (
                  <li key={`${l.productId}-${l.size}`} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted">
                        {l.size} · {formatMNT(line.unit)}
                        {line.promo && <span className="ml-1 font-semibold text-plum">{line.promo.title}</span>}
                      </p>
                    </div>
                    <QtyStepper value={l.qty} max={stockOf(l.productId, l.size)} onChange={(v) => setQty(i, v)} size="sm" label={`${p.name} тоо`} />
                    <button type="button" onClick={() => setQty(i, 0)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-ink/5" aria-label="Хасах">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {gifts.length > 0 && <div className="mt-3"><GiftNotes gifts={gifts} /></div>}
        </section>

        {/* Customer */}
        <section className="card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-plum text-xs text-white">2</span> Үйлчлүүлэгч</h2>
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="qo-dm" className="text-[13px] font-semibold">DM-ээс хуулж буулгах</label>
              <button type="button" onClick={() => { setDm(SAMPLE_DM); applyDm(SAMPLE_DM); }} className="inline-flex items-center gap-1 text-xs font-semibold text-plum">
                <Sparkles className="size-3.5" /> Жишээ
              </button>
            </div>
            <textarea
              id="qo-dm"
              value={dm}
              onChange={(e) => setDm(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (text) setTimeout(() => applyDm(text), 0);
              }}
              rows={3}
              className="input py-3 text-sm"
              placeholder="Нэр, утас, хаягтай мессежийг энд paste хийхэд талбарууд автоматаар бөглөгдөнө"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => applyDm()} disabled={!dm.trim()} className="btn btn-soft btn-sm"><Wand2 className="size-4" /> Автоматаар бөглөх</button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                try {
                  const t = await navigator.clipboard.readText();
                  setDm(t);
                  applyDm(t);
                } catch {
                  toast("Clipboard уншиж чадсангүй — гараар paste хийнэ үү", "info");
                }
              }}
            >
              <ClipboardPaste className="size-4" /> Paste
            </button>
            {dm && <button type="button" onClick={() => setDm("")} className="btn btn-ghost btn-sm ml-auto" aria-label="Цэвэрлэх"><X className="size-4" /></button>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Нэр" error={errors.customerName}><input className="input" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} /></Field>
            <Field label="Утас" error={errors.phone}><input className="input tabular-nums" inputMode="numeric" value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 8))} /></Field>
            <Field label="Дүүрэг" error={errors.district}>
              <select className="input" value={f.district} onChange={(e) => set("district", e.target.value)}>
                <option value="">Сонгох…</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Хороо" error={errors.khoroo}><input className="input" inputMode="numeric" value={f.khoroo} onChange={(e) => set("khoroo", e.target.value.replace(/\D/g, "").slice(0, 2))} /></Field>
          </div>
          <Field label="Хаяг" error={errors.address} className="mt-3"><input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Байр, орц, тоот" /></Field>
          <Field label="Тэмдэглэл" className="mt-3"><input className="input" value={f.note} onChange={(e) => set("note", e.target.value)} /></Field>
        </section>

        {/* Delivery & payment */}
        <section className="card space-y-4 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-plum text-xs text-white">3</span> Хүргэлт & төлбөр</h2>
          <Seg label="Суваг" value={f.source} onChange={(v) => set("source", v)} options={[["instagram", "Instagram"], ["facebook", "Facebook"], ["phone", "Утас"]]} />
          <Seg label="Хүргэлт" value={f.deliveryType} onChange={(v) => set("deliveryType", v)} options={[["standard", `Энгийн · ${formatMNT(settings.deliveryStandard)}`], ["express", `Шуурхай · ${formatMNT(deliveryFee("express", f.district, settings))}`]]} />
          <Seg label="Төлбөр" value={f.paymentMethod} onChange={(v) => set("paymentMethod", v)} options={PAYMENT_METHODS.map((m) => [m, paymentLabel(m, settings)] as [PaymentMethod, string])} />
          <Seg label="Төлөв" value={f.status} onChange={(v) => set("status", v)} options={[["confirmed", "Баталгаажсан"], ["new", "Шинэ"]]} />
          <div className="border-t border-line pt-4">
            <TotalsRows subtotal={priced.subtotal} discount={priced.discount} delivery={fee} total={total} />
          </div>
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
            <button type="button" onClick={submit} disabled={pending} className="btn btn-primary h-12 w-full">
              {pending && <LoaderCircle className="size-4 animate-spin" />} Захиалга хадгалах · {formatMNT(total)}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      <span className={cn("block", error && "[&_.input]:border-red-400")}>{children}</span>
      {error && <span className="field-error block">{error}</span>}
    </label>
  );
}

function Seg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={cn("chip min-h-9 px-3 text-xs", value === v && "chip-active")}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
