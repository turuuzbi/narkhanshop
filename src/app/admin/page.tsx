import Link from "next/link";
import { ArrowRight, ClipboardList, Clock, TriangleAlert, TrendingUp, Wallet, Zap } from "lucide-react";
import { EmptyState, PageTitle, StatusBadge } from "@/components/admin/bits";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ProductImage } from "@/components/product-image";
import { LOW_STOCK_THRESHOLD, ORDER_STATUSES, SOURCE_LABELS, STATUS_META, type OrderSource } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cn, dayKey, formatDateTime, formatMNT, weekdayShort } from "@/lib/format";

export const metadata = { title: "Хянах самбар" };

export default async function Dashboard() {
  const since = new Date(Date.now() - 8 * 86400_000);
  const [recent, statusCounts, lowStock, sold, latest] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { total: true, status: true, createdAt: true, source: true } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.productVariant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      include: { product: { select: { name: true, id: true } } },
      orderBy: [{ stock: "asc" }],
      take: 50,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { not: "cancelled" } }, productId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const topProducts = await prisma.product.findMany({ where: { id: { in: sold.map((s) => s.productId!) } } });

  const today = dayKey(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400_000);
    const key = dayKey(d);
    return { key, label: weekdayShort(key), date: key.slice(5).replace("-", "/"), revenue: 0, orders: 0 };
  });
  const live = recent.filter((o) => o.status !== "cancelled");
  for (const o of live) {
    const d = days.find((x) => x.key === dayKey(o.createdAt));
    if (d) {
      d.revenue += o.total;
      d.orders += 1;
    }
  }
  const todayOrders = recent.filter((o) => dayKey(o.createdAt) === today);
  const todayRevenue = days[6].revenue;
  const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Record<string, number>;
  const pending = (counts.new ?? 0) + (counts.confirmed ?? 0);
  const weekOrders = days.reduce((s, d) => s + d.orders, 0);
  const webOrders = live.filter((o) => o.source === "web").length;
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const stats = [
    { label: "Өнөөдрийн захиалга", value: String(todayOrders.length), icon: ClipboardList, sub: `${weekOrders} энэ 7 хоногт` },
    { label: "Өнөөдрийн орлого", value: formatMNT(todayRevenue), icon: Wallet, sub: "Цуцалснаас бусад" },
    { label: "7 хоногийн орлого", value: formatMNT(weekRevenue), icon: TrendingUp, sub: `Дундаж ${formatMNT(weekOrders ? weekRevenue / weekOrders : 0)}` },
    { label: "Хүлээгдэж буй", value: String(pending), icon: Clock, sub: "Шинэ + баталгаажсан" },
  ];

  return (
    <>
      <PageTitle title="Сайн байна уу 👋" sub="Нарханы өнөөдрийн байдал">
        <Link href="/admin/quick-order" className="btn btn-primary"><Zap className="size-4" /> DM захиалга бүртгэх</Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between text-muted">
              <p className="text-xs font-medium">{label}</p>
              <Icon className="size-4 text-plum" />
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-plum p-4 text-sm text-white sm:flex sm:items-center sm:justify-between">
        <p>
          ✦ Энэ 7 хоногт <b>{webOrders}</b> захиалга вэбсайтаар өөрөө орж ирсэн — DM-д хариулах ойролцоогоор{" "}
          <b>{webOrders * 10} минут</b> хэмнэлээ.
        </p>
        <Link href="/admin/orders?status=new" className="mt-2 inline-flex items-center gap-1 font-semibold text-blush sm:mt-0">
          Шинэ захиалгууд <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Сүүлийн 7 хоногийн орлого</h2>
            <p className="text-sm font-bold tabular-nums">{formatMNT(weekRevenue)}</p>
          </div>
          <div className="mt-6">
            <RevenueChart days={days} />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Захиалгын төлөв</h2>
          <ul className="mt-4 space-y-3">
            {ORDER_STATUSES.map((s) => {
              const n = counts[s] ?? 0;
              return (
                <li key={s}>
                  <Link href={`/admin/orders?status=${s}`} className="group block">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} /> {STATUS_META[s].label}
                      </span>
                      <b className="tabular-nums group-hover:text-plum">{n}</b>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-peach/60">
                      <div className={cn("h-full rounded-full", STATUS_META[s].dot)} style={{ width: `${totalAll ? (n / totalAll) * 100 : 0}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <section className="card p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4 text-amber-600" /> Дуусаж буй хэмжээ</h2>
            <Link href="/admin/inventory?low=1" className="text-xs font-semibold text-plum">Бүгд ({lowStock.length})</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Бүх хэмжээ хангалттай байна.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {lowStock.slice(0, 7).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/admin/products/${v.product.id}`} className="min-w-0 truncate hover:text-plum">{v.product.name}</Link>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md border border-line px-1.5 text-xs font-semibold">{v.size}</span>
                    <span className={cn("badge", v.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>
                      {v.stock === 0 ? "Дууссан" : `${v.stock} үлдсэн`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Их борлуулалттай</h2>
          {sold.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Одоогоор борлуулалт алга.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {sold.map((s, i) => {
                const p = topProducts.find((x) => x.id === s.productId);
                if (!p) return null;
                const img = (JSON.parse(p.images) as string[])[0];
                return (
                  <li key={s.productId} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-peach">
                      <ProductImage src={img} alt="" sizes="36px" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">{p.name}</p>
                    <b className="text-sm tabular-nums">{s._sum.quantity}ш</b>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Сүүлийн захиалгууд</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-plum">Бүгд</Link>
          </div>
          {latest.length === 0 ? (
            <EmptyState icon={<ClipboardList className="size-6" />} title="Захиалга алга" />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {latest.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2 py-2.5 hover:text-plum">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{o.number} · {o.customerName}</span>
                      <span className="text-[11px] text-muted">{formatDateTime(o.createdAt)} · {SOURCE_LABELS[o.source as OrderSource] ?? o.source}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <b className="text-sm tabular-nums">{formatMNT(o.total)}</b>
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
