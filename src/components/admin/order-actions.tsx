"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, X } from "lucide-react";
import { setOrderStatus } from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/ui";
import { NEXT_STATUS, STATUS_META, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/format";
import { useUi } from "@/lib/stores";

const PIPELINE: OrderStatus[] = ["new", "confirmed", "shipping", "delivered"];
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Баталгаажуулах",
  confirmed: "Хүргэлтэнд гаргах",
  shipping: "Хүргэгдсэн болгох",
};

export function OrderActions({ orderId, status, driverText }: { orderId: string; status: string; driverText: string }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = status as OrderStatus;
  const next = NEXT_STATUS[current];
  const final = current === "delivered" || current === "cancelled";

  const move = (to: OrderStatus) =>
    start(async () => {
      const res = await setOrderStatus(orderId, to);
      if (res.ok) {
        toast(to === "cancelled" ? "Цуцаллаа · үлдэгдэл буцаагдлаа" : `Төлөв: ${STATUS_META[to].label}`);
        setConfirmCancel(false);
        router.refresh();
      } else toast(res.error, "error");
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(driverText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = driverText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast("Жолоочид илгээх мэдээлэл хуулагдлаа");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="card p-5">
      <h2 className="font-semibold">Төлөв</h2>
      <ol className="mt-4 grid grid-cols-4 gap-1">
        {PIPELINE.map((s, i) => {
          const reached = current !== "cancelled" && PIPELINE.indexOf(current) >= i;
          return (
            <li key={s} className="text-center">
              <div className={cn("h-1.5 rounded-full", reached ? "bg-plum" : "bg-peach")} />
              <p className={cn("mt-2 text-[11px] leading-tight", reached ? "font-semibold text-ink" : "text-muted")}>{STATUS_META[s].label}</p>
            </li>
          );
        })}
      </ol>
      {current === "cancelled" && <p className="mt-3 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-700">Энэ захиалга цуцлагдсан. Бараа үлдэгдэлд буцаагдсан.</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {next && (
          <button type="button" disabled={pending} onClick={() => move(next)} className="btn btn-primary w-full sm:w-auto">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} {NEXT_LABEL[current]}
          </button>
        )}
        <button type="button" onClick={copy} className="btn btn-outline flex-1 sm:flex-none">
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} Жолоочид хуулах
        </button>
        {!final && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="btn btn-ghost text-red-700 hover:bg-red-50">
            <X className="size-4" /> Цуцлах
          </button>
        )}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-muted">Жолоочид очих текстийг харах</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-cream p-3 font-sans text-[13px] leading-relaxed">{driverText}</pre>
      </details>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => move("cancelled")}
        pending={pending}
        danger
        title="Захиалгыг цуцлах уу?"
        confirmLabel="Цуцлах"
        description="Захиалгын бүх бараа үлдэгдэлд автоматаар буцаж нэмэгдэнэ. Энэ үйлдлийг буцаах боломжгүй."
      />
    </section>
  );
}
