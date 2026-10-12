"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="h-display text-3xl">Алдаа гарлаа</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "Түр хүлээгээд дахин оролдоно уу."}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">Дахин оролдох</button>
    </div>
  );
}
