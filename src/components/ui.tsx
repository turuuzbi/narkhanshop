"use client";

import { useEffect, useId, useRef } from "react";
import { CircleCheck, Info, Minus, Plus, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/format";
import { useUi } from "@/lib/stores";

/** Accessible modal sheet: bottom sheet on mobile, right drawer or centered dialog on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  variant = "bottom",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "bottom" | "right" | "center";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const panel = {
    bottom:
      "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl animate-sheet-up sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:w-[min(560px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:animate-pop-in",
    right: "inset-y-0 right-0 w-full max-w-md animate-sheet-left sm:rounded-l-3xl",
    center:
      "left-1/2 top-1/2 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl animate-pop-in max-h-[88dvh]",
  }[variant];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("absolute flex flex-col bg-cream shadow-lift outline-none", panel, className)}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
          <h2 id={titleId} className="h-display text-2xl">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Хаах">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Тийм",
  danger,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      variant="center"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Болих
          </button>
          <button
            type="button"
            className={cn("btn", danger ? "bg-red-700 text-white hover:bg-red-800" : "btn-primary")}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Түр хүлээнэ үү…" : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm leading-relaxed text-muted">{description}</div>
    </Sheet>
  );
}

export function QtyStepper({
  value,
  max,
  onChange,
  size = "md",
  label,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  label: string;
}) {
  const btn = size === "sm" ? "size-8" : "size-10";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white" role="group" aria-label={label}>
      <button type="button" className={cn(btn, "grid place-items-center rounded-full hover:bg-ink/5")} onClick={() => onChange(value - 1)} aria-label="Хасах">
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn(btn, "grid place-items-center rounded-full hover:bg-ink/5 disabled:opacity-30")}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Нэмэх"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => {
        const Icon = t.tone === "error" ? TriangleAlert : t.tone === "info" ? Info : CircleCheck;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lift animate-pop-in"
          >
            <Icon className={cn("size-4 shrink-0", t.tone === "error" ? "text-red-300" : "text-blush")} />
            {t.message}
          </button>
        );
      })}
    </div>
  );
}
