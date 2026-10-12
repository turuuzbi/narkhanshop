import { STATUS_META, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as OrderStatus] ?? STATUS_META.new;
  return (
    <span className={cn("badge whitespace-nowrap", m.className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} aria-hidden /> {m.label}
    </span>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h-display text-[34px] leading-tight md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: React.ReactNode; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-blush bg-white/60 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-blush-soft text-plum">{icon}</div>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
