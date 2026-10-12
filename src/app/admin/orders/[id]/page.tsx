import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, Phone } from "lucide-react";
import { StatusBadge } from "@/components/admin/bits";
import { OrderActions } from "@/components/admin/order-actions";
import { ProductImage } from "@/components/product-image";
import { TotalsRows } from "@/components/shop/cart-lines";
import { SOURCE_LABELS, type OrderSource } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMNT, formatPhone } from "@/lib/format";
import { paymentLabel } from "@/lib/settings";

export const metadata = { title: "Захиалгын дэлгэрэнгүй" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [order, settings] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();

  const pay = paymentLabel(order.paymentMethod, settings);
  const collect = order.paymentMethod === "cash" ? order.total : 0;
  const driverText = [
    `📦 ${order.number}`,
    `👤 ${order.customerName} — ${formatPhone(order.phone)}`,
    `📍 ${order.district} дүүрэг, ${order.khoroo}-р хороо, ${order.address}`,
    order.note ? `📝 ${order.note}` : null,
    `🛍 Бараа:`,
    ...order.items.map((i) => `• ${i.name} (${i.size}) × ${i.quantity}`),
    order.giftNote ? `🎁 ${order.giftNote}` : null,
    `🚚 ${order.deliveryType === "express" ? "Шуурхай хүргэлт" : "Энгийн хүргэлт"}`,
    `💰 Авах дүн: ${formatMNT(collect)}${collect === 0 ? ` (${pay}-р төлөгдсөн)` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-plum"><ArrowLeft className="size-4" /> Захиалгууд</Link>
      {created && (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-pop-in">✓ Захиалга бүртгэгдлээ, үлдэгдэл автоматаар хасагдлаа.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="h-display text-4xl">{order.number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatDateTime(order.createdAt)} · {SOURCE_LABELS[order.source as OrderSource] ?? order.source}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <OrderActions orderId={order.id} status={order.status} driverText={driverText} />
          <section className="card p-5">
            <h2 className="font-semibold">Бараа ({order.items.length})</h2>
            <ul className="mt-2 divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-peach">
                    <ProductImage src={i.image ?? undefined} alt="" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {i.productId ? <Link href={`/admin/products/${i.productId}`} className="text-sm font-semibold hover:text-plum">{i.name}</Link> : <p className="text-sm font-semibold">{i.name}</p>}
                    <p className="text-xs text-muted">Хэмжээ {i.size}{i.color ? ` · ${i.color}` : ""} · {formatMNT(i.unitPrice)} × {i.quantity}</p>
                  </div>
                  <b className="text-sm tabular-nums">{formatMNT(i.unitPrice * i.quantity)}</b>
                </li>
              ))}
            </ul>
            {order.giftNote && <p className="mt-2 flex items-center gap-2 rounded-xl bg-blush-soft px-3 py-2 text-sm text-plum"><Gift className="size-4" /> {order.giftNote}</p>}
            <div className="mt-3 border-t border-line pt-3">
              <TotalsRows subtotal={order.subtotal} discount={order.discount} delivery={order.deliveryFee} total={order.total} />
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          <section className="card p-5 text-sm">
            <h2 className="font-semibold">Үйлчлүүлэгч</h2>
            <p className="mt-2 text-base font-semibold">{order.customerName}</p>
            <a href={`tel:${order.phone}`} className="mt-1 inline-flex items-center gap-1.5 font-medium text-plum"><Phone className="size-4" /> {formatPhone(order.phone)}</a>
            <dl className="mt-4 space-y-2.5">
              <div><dt className="text-xs text-muted">Хаяг</dt><dd>{order.district} дүүрэг, {order.khoroo}-р хороо<br />{order.address}</dd></div>
              {order.note && <div><dt className="text-xs text-muted">Тэмдэглэл</dt><dd>{order.note}</dd></div>}
              <div><dt className="text-xs text-muted">Хүргэлт</dt><dd>{order.deliveryType === "express" ? "Шуурхай" : "Энгийн"} · {formatMNT(order.deliveryFee)}</dd></div>
              <div><dt className="text-xs text-muted">Төлбөр</dt><dd>{pay}</dd></div>
              <div><dt className="text-xs text-muted">Жолооч авах дүн</dt><dd className="font-bold">{formatMNT(collect)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
