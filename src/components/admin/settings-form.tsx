"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { resetDemoData, saveSettings } from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/format";
import type { ShopSettings } from "@/lib/settings";
import { useCart, useUi } from "@/lib/stores";

const GROUPS: { title: string; fields: { key: keyof ShopSettings; label: string; numeric?: boolean }[] }[] = [
  {
    title: "Холбоо барих",
    fields: [
      { key: "phone", label: "Утас" },
      { key: "instagram", label: "Instagram хаяг" },
      { key: "facebook", label: "Facebook хуудас" },
    ],
  },
  {
    title: "Хүргэлтийн үнэ (₮)",
    fields: [
      { key: "deliveryStandard", label: "Энгийн", numeric: true },
      { key: "deliveryExpress", label: "Шуурхай", numeric: true },
      { key: "deliveryExpressFar", label: "Шуурхай (алс дүүрэг)", numeric: true },
    ],
  },
  {
    title: "Төлбөрийн хэлбэрийн нэрс",
    fields: [
      { key: "labelStorepay", label: "Storepay" },
      { key: "labelPocketzero", label: "Pocket Zero" },
      { key: "labelBank", label: "Дансаар" },
      { key: "labelCash", label: "Хүргэлтээр (DM захиалга)" },
      { key: "bankAccount", label: "Дансны мэдээлэл" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const clearCart = useCart((s) => s.clear);
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, String(v)])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [resetting, startReset] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveSettings(values);
      if (res.ok) {
        setErrors({});
        toast("Тохиргоо хадгалагдлаа");
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast(res.error, "error");
      }
    });
  };

  const reset = () =>
    startReset(async () => {
      const res = await resetDemoData();
      setConfirm(false);
      if (res.ok) {
        clearCart();
        toast("Демо өгөгдлийг анхны байдалд орууллаа");
        router.push("/admin");
        router.refresh();
      } else toast(res.error, "error");
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <form onSubmit={save} className="space-y-4">
        {GROUPS.map((g) => (
          <section key={g.title} className="card p-5">
            <h2 className="font-semibold">{g.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.fields.map((f) => (
                <label key={f.key} className={cn("block", f.key === "bankAccount" && "sm:col-span-2")}>
                  <span className="label">{f.label}</span>
                  <input
                    className={cn("input", errors[f.key] && "border-red-400")}
                    inputMode={f.numeric || f.key === "phone" ? "numeric" : undefined}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                  {errors[f.key] && <span className="field-error block">{errors[f.key]}</span>}
                </label>
              ))}
            </div>
          </section>
        ))}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Хадгалах
        </button>
      </form>

      <aside className="space-y-4">
        <section className="card p-5">
          <h2 className="font-semibold">Захиалга экспортлох</h2>
          <p className="mt-1 text-sm text-muted">Бүх захиалгыг Excel-д нээгдэх CSV файлаар татна.</p>
          <a href="/admin/orders/export" className="btn btn-outline btn-sm mt-3"><Download className="size-4" /> CSV татах</a>
        </section>
        <section className="card border-red-100 p-5">
          <h2 className="font-semibold">Демо өгөгдөл</h2>
          <p className="mt-1 text-sm text-muted">Бараа, үлдэгдэл, захиалга, урамшууллыг анхны байдалд нь буцаана.</p>
          <button type="button" onClick={() => setConfirm(true)} className="btn btn-sm mt-3 bg-red-700 text-white hover:bg-red-800">
            <RotateCcw className="size-4" /> Демо өгөгдлийг сэргээх
          </button>
        </section>
      </aside>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={reset}
        pending={resetting}
        danger
        title="Демо өгөгдлийг сэргээх үү?"
        confirmLabel="Тийм, сэргээх"
        description="Бүх захиалга, барааны өөрчлөлт, үлдэгдэл устаж анхны демо өгөгдөл дахин үүснэ. Буцаах боломжгүй."
      />
    </div>
  );
}
