"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ruler, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui";
import { SIZE_CHART } from "@/lib/constants";
import { cn } from "@/lib/format";
import { recommendSize } from "@/lib/sizes";

export function SizeChartTable({ highlight }: { highlight?: string | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">Хэмжээний хүснэгт</caption>
        <thead className="bg-blush-soft text-left text-xs uppercase tracking-wider text-plum">
          <tr>
            <th scope="col" className="px-4 py-2.5">Хэмжээ</th>
            <th scope="col" className="px-4 py-2.5">Жин</th>
            <th scope="col" className="px-4 py-2.5">Өндөр/Бэлхүүс</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((r) => (
            <tr key={r.size} className={cn("border-t border-line/70", highlight === r.size && "bg-plum text-white")}>
              <th scope="row" className="px-4 py-2.5 text-left font-bold">{r.size}</th>
              <td className="px-4 py-2.5">{r.weight}</td>
              <td className="px-4 py-2.5 tabular-nums">{r.heightWaist}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line/70 px-4 py-2 text-[11px] text-muted">Өндөр/бэлхүүс — см. Нарханы хэмжээний хүснэгт.</p>
    </div>
  );
}

/** Weight (+ optional height) → recommended size → "show everything in my size". */
export function SizeFinderForm({ onPick, compact }: { onPick?: (size: string) => void; compact?: boolean }) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const w = Number(weight);
  const valid = w >= 30 && w <= 200;
  const result = valid ? recommendSize(w, Number(height) || null) : null;

  return (
    <div>
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()}>
        <label>
          <span className="label">Жин (кг)</span>
          <input
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="ж: 58"
            value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </label>
        <label>
          <span className="label">
            Өндөр (см) <span className="font-normal text-muted">заавал биш</span>
          </span>
          <input
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="ж: 165"
            value={height}
            onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </label>
      </form>
      <div className="mt-4 min-h-[124px]" aria-live="polite">
        {result ? (
          <div className="rounded-2xl bg-plum p-4 text-white animate-pop-in">
            <p className="text-xs uppercase tracking-[0.18em] text-blush">Танд тохирох хэмжээ</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="font-serif text-5xl leading-none">{result.size}</p>
              {result.alternative && (
                <p className="max-w-[60%] text-right text-xs leading-snug text-white/80">
                  Өндөр тул сул загварт <b className="text-white">{result.alternative}</b> ч тохирч магадгүй
                </p>
              )}
            </div>
            {onPick ? (
              <button type="button" onClick={() => onPick(result.size)} className="btn mt-4 w-full bg-white text-plum hover:bg-blush-soft">
                {result.size} хэмжээг сонгох
              </button>
            ) : (
              <Link href={`/shop?size=${result.size}`} className="btn mt-4 w-full bg-white text-plum hover:bg-blush-soft">
                {result.size} хэмжээтэй бүх бараа <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid min-h-[124px] place-items-center rounded-2xl border border-dashed border-blush bg-white/60 p-4 text-center text-sm text-muted">
            <span>
              <Sparkles className="mx-auto mb-2 size-5 text-plum" />
              {weight && !valid ? "30–200 кг хооронд жингээ оруулна уу" : "Жингээ оруулахад хэмжээг шууд санал болгоно"}
            </span>
          </div>
        )}
      </div>
      {!compact && (
        <div className="mt-5">
          <SizeChartTable highlight={result?.size} />
        </div>
      )}
    </div>
  );
}

export function SizeFinderButton({ className, label = "Хэмжээгээ олох", onPick }: { className?: string; label?: string; onPick?: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? "btn btn-outline"}>
        <Ruler className="size-4" /> {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Хэмжээ олох">
        <SizeFinderForm
          onPick={
            onPick
              ? (s) => {
                  onPick(s);
                  setOpen(false);
                }
              : undefined
          }
        />
      </Sheet>
    </>
  );
}
