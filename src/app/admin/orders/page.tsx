import Link from "next/link";
import Form from "next/form";
import { ClipboardList, Download, Search, Zap } from "lucide-react";
import { EmptyState, PageTitle, StatusBadge } from "@/components/admin/bits";
import { ORDER_STATUSES, SOURCE_LABELS, STATUS_META, type OrderSource } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cn, formatDateTime, formatMNT, formatPhone } from "@/lib/format";

export const metadata = { title: "Захиалга" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const query = q.trim();
  const digits = query.replace(/\D/g, "");
  const where = {
    ...(ORDER_STATUSES.includes(status as never) ? { status } : {}),
    ...(query
      ? {
          OR: [
            { number: { contains: query.toUpperCase() } },
            { customerName: { contains: query } },
            ...(digits ? [{ phone: { contains: digits } }, { number: { contains: digits } }] : []),
          ],
        }
      : {}),
  };
  const [orders, grouped] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } }, take: 200 }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<string, number>;
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const tab = (s: string) => `/admin/orders?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(query ? { q: query } : {}) })}`;

  return (
    <>
      <PageTitle title="Захиалга" sub={`Нийт ${all} захиалга`}>
        <a href={`/admin/orders/export${status ? `?status=${status}` : ""}`} className="btn btn-outline btn-sm"><Download className="size-4" /> CSV татах</a>
        <Link href="/admin/quick-order" className="btn btn-primary btn-sm"><Zap className="size-4" /> DM захиалга</Link>
      </PageTitle>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {[{ s: "", label: "Бүгд", n: all }, ...ORDER_STATUSES.map((s) => ({ s, label: STATUS_META[s].label, n: counts[s] ?? 0 }))].map((t) => (
          <Link key={t.s} href={tab(t.s)} className={cn("chip shrink-0 min-h-9", status === t.s && "chip-active")}>
            {t.label} <span className={cn("text-xs", status === t.s ? "text-white/80" : "text-muted")}>{t.n}</span>
          </Link>
        ))}
      </div>

      <Form action="/admin/orders" className="relative mt-3 max-w-md">
        {status && <input type="hidden" name="status" value={status} />}
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={query} className="input pl-10" placeholder="Дугаар, нэр, утас…" aria-label="Захиалга хайх" />
      </Form>

      <div className="mt-4">
        {orders.length === 0 ? (
          <EmptyState icon={<ClipboardList className="size-6" />} title="Захиалга олдсонгүй" text={query ? "Хайлтаа өөрчлөөд үзнэ үү." : "Энэ төлөвт захиалга алга."} />
        ) : (
          <>
            <div className="card hidden overflow-hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-blush-soft/60 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Дугаар</th>
                    <th className="px-4 py-3 font-semibold">Үйлчлүүлэгч</th>
                    <th className="px-4 py-3 font-semibold">Хаяг</th>
                    <th className="px-4 py-3 font-semibold">Суваг</th>
                    <th className="px-4 py-3 font-semibold">Огноо</th>
                    <th className="px-4 py-3 text-right font-semibold">Дүн</th>
                    <th className="px-4 py-3 font-semibold">Төлөв</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id} className="transition hover:bg-cream">
                      <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-plum hover:underline">{o.number}</Link></td>
                      <td className="px-4 py-3">{o.customerName}<span className="block text-xs text-muted">{formatPhone(o.phone)}</span></td>
                      <td className="px-4 py-3 text-muted">{o.district}, {o.khoroo}-р хороо</td>
                      <td className="px-4 py-3 text-muted">{SOURCE_LABELS[o.source as OrderSource] ?? o.source}</td>
                      <td className="px-4 py-3 text-muted tabular-nums">{formatDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMNT(o.total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 md:hidden">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="card block p-4 active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-plum">{o.number}</p>
                        <p className="text-sm">{o.customerName} · {formatPhone(o.phone)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-2 flex items-end justify-between text-xs text-muted">
                      <span>{formatDateTime(o.createdAt)} · {SOURCE_LABELS[o.source as OrderSource] ?? o.source} · {o._count.items} бараа</span>
                      <b className="text-sm text-ink tabular-nums">{formatMNT(o.total)}</b>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
