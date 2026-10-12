"use client";

import { useState } from "react";
import { cn, formatMNT } from "@/lib/format";

type Day = { key: string; label: string; date: string; revenue: number; orders: number };

const BAR = "#A3446A"; // validated mid-tone of the brand plum (dark plum is reserved for text)

function niceMax(v: number) {
  if (v <= 0) return 100000;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
}
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}сая` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

export function RevenueChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const ticks = [max, max / 2, 0];

  return (
    <figure>
      <div className="relative flex h-52 gap-3">
        <div className="flex w-9 flex-col justify-between pb-6 text-right text-[10px] tabular-nums text-muted" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1.5">{short(t)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <div key={t} className={cn("border-t", t === 0 ? "border-ink/20" : "border-dashed border-line")} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
            {days.map((d, i) => {
              const h = (d.revenue / max) * 100;
              const isToday = i === days.length - 1;
              return (
                <button
                  key={d.key}
                  type="button"
                  className="group relative flex h-full flex-1 flex-col justify-end outline-none"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${d.label} ${d.date}: ${formatMNT(d.revenue)}, ${d.orders} захиалга`}
                >
                  <div className="relative mb-6 flex flex-1 items-end">
                    <div
                      className={cn("w-full rounded-t-[4px] transition-opacity", hover !== null && hover !== i && "opacity-50")}
                      style={{ height: `${Math.max(h, d.revenue > 0 ? 2 : 0)}%`, background: BAR }}
                    />
                  </div>
                  <span className={cn("absolute inset-x-0 bottom-0 text-center text-[11px]", isToday ? "font-bold text-ink" : "text-muted")}>
                    {isToday ? "Өнөөдөр" : d.label}
                  </span>
                  {hover === i && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-left text-xs text-white shadow-lift">
                      <span className="block text-white/70">{d.label} · {d.date}</span>
                      <b className="block text-sm">{formatMNT(d.revenue)}</b>
                      <span className="text-white/70">{d.orders} захиалга</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Сүүлийн 7 хоногийн орлого</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}><th>{d.date}</th><td>{formatMNT(d.revenue)}</td><td>{d.orders} захиалга</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
