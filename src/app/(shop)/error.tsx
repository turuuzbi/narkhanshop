"use client";

import Link from "next/link";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-shop flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Уучлаарай</p>
      <h1 className="h-display mt-2 text-4xl">Алдаа гарлаа</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Хуудсыг ачаалах үед асуудал гарлаа. Дахин оролдоно уу.</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Дахин оролдох</button>
        <Link href="/" className="btn btn-outline">Нүүр хуудас</Link>
      </div>
    </div>
  );
}
