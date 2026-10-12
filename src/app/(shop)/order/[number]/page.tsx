import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Gift, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/logo";
import { ProductImage } from "@/components/product-image";
import { TotalsRows } from "@/components/shop/cart-lines";
import { BNPL_INSTALLMENTS, STATUS_META, type OrderStatus } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { prisma } from "@/lib/db";
import { formatMNT, formatPhone } from "@/lib/format";
import { paymentLabel } from "@/lib/settings";

export const metadata: Metadata = { title: "Захиалга хүлээн авлаа" };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { number: decodeURIComponent(number) }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  const pay = paymentLabel(order.paymentMethod, settings);
  const steps =
    order.paymentMethod === "bank"
      ? [
          `${settings.bankAccount} данс руу ${formatMNT(order.total)} шилжүүлнэ үү.`,
          `Гүйлгээний утга дээр ${order.number} гэж бичээрэй.`,
          "Төлбөр орсны дараа бид утсаар баталгаажуулна.",
        ]
      : [
          `${pay} аппликейшнээр ${formatPhone(order.phone)} дугаарт нэхэмжлэх очно (демо).`,
          `Эхний төлөлт ${formatMNT(Math.ceil(order.total / BNPL_INSTALLMENTS / 10) * 10)}, үлдсэнийг ${BNPL_INSTALLMENTS} хувааж төлнө.`,
          "Баталгаажмагц захиалгыг хүргэлтэнд гаргана.",
        ];
  steps.push(order.deliveryType === "express" ? "Шуурхай хүргэлт: өнөөдөртөө 3–6 цагийн дотор хүргэнэ." : "Энгийн хүргэлт: 24–48 цагийн дотор хүргэнэ.");

  return (
    <div className="container-shop max-w-2xl pt-10">
      <div className="text-center animate-pop-in">
        <CircleCheck className="mx-auto size-14 text-plum" strokeWidth={1.5} />
        <p className="eyebrow mt-4">Баярлалаа, {order.customerName}!</p>
        <h1 className="h-display mt-2 text-4xl sm:text-5xl">Захиалга хүлээн авлаа</h1>
        <p className="mt-3 text-sm text-muted">Захиалгын дугаар</p>
        <p className="mt-1 inline-block rounded-full bg-plum px-5 py-2 font-mono text-xl font-bold tracking-wider text-white">{order.number}</p>
        <p className="mt-3 text-sm">
          Төлөв: <span className={`badge ${STATUS_META[order.status as OrderStatus]?.className}`}>{STATUS_META[order.status as OrderStatus]?.label}</span>
        </p>
      </div>

      <section className="card mt-8 p-5">
        <h2 className="h-display text-2xl">Дараагийн алхам</h2>
        <ol className="mt-3 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blush-soft text-xs font-bold text-plum">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        {order.giftNote && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-plum px-3 py-2.5 text-sm text-white">
            <Gift className="size-4" /> {order.giftNote} — захиалгад хамт ирнэ.
          </p>
        )}
      </section>

      <section className="card mt-4 p-5">
        <h2 className="h-display text-2xl">Захиалгын мэдээлэл</h2>
        <ul className="mt-2 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-peach">
                <ProductImage src={i.image ?? undefined} alt={i.name} sizes="48px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-muted">{i.size} · {i.quantity} ширхэг</p>
              </div>
              <p className="text-sm font-semibold">{formatMNT(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <TotalsRows subtotal={order.subtotal} discount={order.discount} delivery={order.deliveryFee} total={order.total} />
        </div>
        <dl className="mt-4 grid gap-1 border-t border-line pt-4 text-sm">
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted">Хаяг</dt><dd>{order.district} дүүрэг, {order.khoroo}-р хороо, {order.address}</dd></div>
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted">Утас</dt><dd>{formatPhone(order.phone)}</dd></div>
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-muted">Төлбөр</dt><dd>{pay}</dd></div>
        </dl>
      </section>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Link href="/shop" className="btn btn-primary">Дэлгүүр үргэлжлүүлэх</Link>
        <a href={`https://ig.me/m/${settings.instagram}`} target="_blank" rel="noreferrer" className="btn btn-outline">
          <InstagramIcon className="size-4" /> DM бичих
        </a>
        <a href={`tel:${settings.phone}`} className="btn btn-outline"><Phone className="size-4" /> {formatPhone(settings.phone)}</a>
      </div>
      <p className="mt-6 rounded-2xl border border-dashed border-blush bg-white/60 px-4 py-3 text-center text-sm text-muted">
        Демо: энэ захиалга админд шууд орсон.{" "}
        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-plum underline underline-offset-4">Админаас харах →</Link>
      </p>
    </div>
  );
}
