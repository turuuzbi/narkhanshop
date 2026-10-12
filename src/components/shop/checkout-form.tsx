"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Lock, TriangleAlert } from "lucide-react";
import { placeOrder } from "@/app/actions/shop";
import { ProductImage } from "@/components/product-image";
import { BNPL_INSTALLMENTS, DISTRICTS, WEB_PAYMENT_METHODS, type DeliveryType, type PaymentMethod } from "@/lib/constants";
import { cn, formatMNT } from "@/lib/format";
import { deliveryFee } from "@/lib/promotions";
import { paymentLabel } from "@/lib/settings";
import { useCart, useHydrated, useUi } from "@/lib/stores";
import { customerSchema, fieldErrors } from "@/lib/validation";
import { EmptyCart } from "./cart-drawer";
import { GiftNotes, TotalsRows, useCartTotals } from "./cart-lines";
import { useShop } from "./shop-provider";

type Form = {
  customerName: string;
  phone: string;
  district: string;
  khoroo: string;
  address: string;
  note: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod | "";
};

const PAYMENT_HINTS: Record<string, string> = {
  storepay: `${BNPL_INSTALLMENTS} хувааж, хүүгүй төлнө`,
  pocketzero: "Pocket апп-аар 0% хувааж төлнө",
  bank: "Захиалгын дугаараа гүйлгээний утгад бичнэ",
};

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { settings } = useShop();
  const { lines, subtotal, discount, itemsTotal, gifts } = useCartTotals();
  const clear = useCart((s) => s.clear);
  const setQty = useCart((s) => s.setQty);
  const toast = useUi((s) => s.toast);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [f, setF] = useState<Form>({
    customerName: "",
    phone: "",
    district: "",
    khoroo: "",
    address: "",
    note: "",
    deliveryType: "standard",
    paymentMethod: "storepay",
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  if (!hydrated) return <div className="skeleton mt-6 h-96" />;
  if (lines.length === 0 && !done) return <EmptyCart />;

  const fee = deliveryFee(f.deliveryType, f.district, settings);
  const total = itemsTotal + fee;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const check = customerSchema.safeParse(f);
    if (!check.success) {
      const fe = fieldErrors(check.error);
      setErrors(fe);
      document.querySelector<HTMLElement>(`[name="${Object.keys(fe)[0]}"]`)?.focus();
      return;
    }
    startTransition(async () => {
      const res = await placeOrder({
        ...check.data,
        items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
      });
      if (res.ok) {
        setDone(true);
        clear();
        router.push(`/order/${res.number}`);
        return;
      }
      setFormError(res.error);
      if (res.fieldErrors) setErrors(res.fieldErrors);
      if (res.stock) {
        for (const issue of res.stock) {
          const line = lines.find((l) => l.productId === issue.productId && l.size === issue.size);
          if (line) setQty(line.key, issue.available);
        }
        toast("Сагсыг үлдэгдлээр шинэчиллээ", "error");
      }
    });
  };

  if (done) {
    return (
      <div className="grid place-items-center py-20 text-plum">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid gap-8 pb-28 lg:grid-cols-[1fr_380px] lg:pb-0">
      <div className="space-y-8">
        <Section n={1} title="Холбоо барих">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Нэр" error={errors.customerName}>
              <input name="customerName" className="input" autoComplete="name" value={f.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="ж: Сараа" />
            </Field>
            <Field label="Утасны дугаар" error={errors.phone}>
              <input
                name="phone"
                className="input tabular-nums"
                inputMode="numeric"
                autoComplete="tel"
                value={f.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="99112233"
              />
            </Field>
          </div>
        </Section>

        <Section n={2} title="Хүргэлтийн хаяг">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Дүүрэг" error={errors.district}>
              <select name="district" className="input" value={f.district} onChange={(e) => set("district", e.target.value)}>
                <option value="">Сонгох…</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Хороо" error={errors.khoroo}>
              <input name="khoroo" className="input" inputMode="numeric" value={f.khoroo} onChange={(e) => set("khoroo", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="ж: 4" />
            </Field>
          </div>
          <Field label="Дэлгэрэнгүй хаяг" error={errors.address} className="mt-4">
            <textarea name="address" rows={2} className="input py-3" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Хороолол, байр, орц, давхар, тоот" />
          </Field>
          <Field label="Нэмэлт тэмдэглэл" hint="заавал биш" className="mt-4">
            <input name="note" className="input" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="ж: Оройн 6 цагаас хойш" />
          </Field>
        </Section>

        <Section n={3} title="Хүргэлт">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { v: "standard", title: "Энгийн хүргэлт", sub: "24–48 цагийн дотор", fee: settings.deliveryStandard },
                { v: "express", title: "Шуурхай хүргэлт", sub: "Өнөөдөр, 3–6 цагт", fee: deliveryFee("express", f.district, settings) },
              ] as const
            ).map((o) => (
              <Choice key={o.v} name="deliveryType" checked={f.deliveryType === o.v} onChange={() => set("deliveryType", o.v)}>
                <span className="flex w-full items-start justify-between gap-2">
                  <span>
                    <b className="block text-sm">{o.title}</b>
                    <span className="text-xs text-muted">{o.sub}</span>
                  </span>
                  <b className="text-sm">{formatMNT(o.fee)}</b>
                </span>
              </Choice>
            ))}
          </div>
          {f.deliveryType === "express" && !f.district && <p className="mt-2 text-xs text-muted">Налайх, Багануур, Багахангай руу шуурхай хүргэлт {formatMNT(settings.deliveryExpressFar)}.</p>}
        </Section>

        <Section n={4} title="Төлбөр">
          <div className="grid gap-3">
            {WEB_PAYMENT_METHODS.map((m) => (
              <Choice key={m} name="paymentMethod" checked={f.paymentMethod === m} onChange={() => set("paymentMethod", m)}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span>
                    <b className={cn("block text-[15px]", m === "storepay" && "text-[#2B46E5]", m === "pocketzero" && "text-[#E8384F]")}>{paymentLabel(m, settings)}</b>
                    <span className="text-xs text-muted">{PAYMENT_HINTS[m]}</span>
                  </span>
                  {m !== "bank" && (
                    <span className="shrink-0 text-right text-xs text-muted">
                      <b className="block text-sm text-ink">{formatMNT(Math.ceil(total / BNPL_INSTALLMENTS / 10) * 10)}</b>× {BNPL_INSTALLMENTS}
                    </span>
                  )}
                </span>
              </Choice>
            ))}
          </div>
          {errors.paymentMethod && <p className="field-error">{errors.paymentMethod}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" /> Демо: жинхэнэ төлбөр татагдахгүй.
          </p>
        </Section>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="card p-5">
          <h2 className="h-display text-2xl">Таны захиалга</h2>
          <ul className="mt-3 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-peach">
                  <ProductImage src={l.image} alt={l.name} sizes="48px" categorySlug={l.categorySlug} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted">{l.size} · {l.qty} ширхэг</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-3">
            <GiftNotes gifts={gifts} />
            <TotalsRows subtotal={subtotal} discount={discount} delivery={fee} total={total} />
          </div>
        </div>
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
          </p>
        )}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-cream/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <button type="submit" disabled={pending} className="btn btn-primary h-12 w-full text-[15px]">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {pending ? "Илгээж байна…" : `Захиалах · ${formatMNT(total)}`}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-plum text-xs font-bold text-white">{n}</span>
        <span className="h-display text-2xl">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      <span className={cn("block", error && "[&_.input]:border-red-400")}>{children}</span>
      {error && <span className="field-error block">{error}</span>}
    </label>
  );
}

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 transition",
        checked ? "border-plum ring-4 ring-blush/40" : "border-line hover:border-plum/40",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4 shrink-0 accent-[#6B1E3A]" />
      {children}
    </label>
  );
}
