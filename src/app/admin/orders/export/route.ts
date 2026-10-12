import { ORDER_STATUSES, SOURCE_LABELS, STATUS_META, type OrderSource, type OrderStatus } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { paymentLabel } from "@/lib/settings";

export const dynamic = "force-dynamic";

const cell = (v: string | number | null | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where: status && ORDER_STATUSES.includes(status as never) ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    getSettings(),
  ]);
  const header = ["Дугаар", "Огноо", "Төлөв", "Суваг", "Нэр", "Утас", "Дүүрэг", "Хороо", "Хаяг", "Бараа", "Барааны дүн", "Хөнгөлөлт", "Хүргэлт", "Нийт", "Төлбөр", "Тэмдэглэл"];
  const rows = orders.map((o) => [
    o.number,
    formatDateTime(o.createdAt),
    STATUS_META[o.status as OrderStatus]?.label ?? o.status,
    SOURCE_LABELS[o.source as OrderSource] ?? o.source,
    o.customerName,
    o.phone,
    o.district,
    o.khoroo,
    o.address,
    o.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join("; "),
    o.subtotal,
    o.discount,
    o.deliveryFee,
    o.total,
    paymentLabel(o.paymentMethod, settings),
    o.note ?? "",
  ]);
  // BOM so Excel opens Cyrillic correctly.
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="narkhan-orders-${date}.csv"`,
    },
  });
}
