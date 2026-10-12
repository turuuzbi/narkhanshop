import "server-only";
import { prisma } from "./db";
import { NEXT_STATUS, type OrderStatus } from "./constants";
import { getPromotions, getSettings } from "./data";
import { deliveryFee, giftStatus, priceCart } from "./promotions";
import type { OrderInput } from "./validation";

export type StockIssue = { productId: string; size: string; name: string; available: number };

export class StockError extends Error {
  constructor(public issues: StockIssue[]) {
    super("Үлдэгдэл хүрэлцэхгүй байна");
  }
}

/**
 * Creates an order and decrements stock atomically. Prices, promotions and
 * delivery fees are always recomputed on the server from the database.
 */
export async function createOrder(input: OrderInput, status: OrderStatus = "new") {
  // Merge duplicate product+size lines.
  const merged = new Map<string, { productId: string; size: string; qty: number }>();
  for (const i of input.items) {
    const key = `${i.productId}:${i.size}`;
    const prev = merged.get(key);
    merged.set(key, { ...i, qty: (prev?.qty ?? 0) + i.qty });
  }
  const items = [...merged.values()];

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: { variants: true, category: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const issues: StockIssue[] = [];
    for (const i of items) {
      const p = byId.get(i.productId);
      const v = p?.variants.find((x) => x.size === i.size);
      if (!p || !v || v.stock < i.qty) issues.push({ productId: i.productId, size: i.size, name: p?.name ?? "Бараа", available: v?.stock ?? 0 });
    }
    if (issues.length) throw new StockError(issues);

    for (const i of items) {
      const v = byId.get(i.productId)!.variants.find((x) => x.size === i.size)!;
      // Conditional decrement guards against two customers buying the last piece at once.
      const res = await tx.productVariant.updateMany({ where: { id: v.id, stock: { gte: i.qty } }, data: { stock: { decrement: i.qty } } });
      if (res.count !== 1) throw new StockError([{ productId: i.productId, size: i.size, name: byId.get(i.productId)!.name, available: 0 }]);
    }

    const [promos, settings] = await Promise.all([getPromotions(true, tx), getSettings(tx)]);
    const lines = items.map((i) => {
      const p = byId.get(i.productId)!;
      return { ...i, id: p.id, price: p.price, salePrice: p.salePrice, product: p };
    });
    const priced = priceCart(lines, promos);
    const gifts = giftStatus(
      lines.map((l) => ({ categorySlug: l.product.category.slug, size: l.size, qty: l.qty, packSize: l.product.packSize })),
      promos,
    ).filter((g) => g.eligible);
    const fee = deliveryFee(input.deliveryType, input.district, settings);

    const last = await tx.order.findFirst({ orderBy: { seq: "desc" }, select: { seq: true } });
    const seq = (last?.seq ?? 1000) + 1;

    return tx.order.create({
      data: {
        seq,
        number: `NK-${seq}`,
        customerName: input.customerName,
        phone: input.phone,
        district: input.district,
        khoroo: input.khoroo,
        address: input.address,
        note: input.note || null,
        deliveryType: input.deliveryType,
        deliveryFee: fee,
        paymentMethod: input.paymentMethod,
        status,
        source: input.source,
        subtotal: priced.subtotal,
        discount: priced.discount,
        total: priced.itemsTotal + fee,
        giftNote: gifts.length ? gifts.map((g) => `${g.title}: ${g.giftCount} бэлэг бараа`).join("; ") : null,
        items: {
          create: priced.lines.map((l) => {
            const colors = JSON.parse(l.product.colors || "[]") as { name: string }[];
            const images = JSON.parse(l.product.images || "[]") as string[];
            return {
              productId: l.id,
              name: l.product.name,
              image: images[0] ?? null,
              size: l.size,
              color: colors[0]?.name ?? null,
              unitPrice: l.unit,
              quantity: l.qty,
            };
          }),
        },
      },
    });
  });
}

/** Moves an order through the pipeline. Cancelling returns the items to stock. */
export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error("Захиалга олдсонгүй");
    const from = order.status as OrderStatus;
    if (from === status) return order;
    if (from === "cancelled" || from === "delivered") throw new Error("Энэ захиалгын төлөв эцэслэгдсэн байна");
    const allowed = status === "cancelled" || NEXT_STATUS[from] === status;
    if (!allowed) throw new Error("Төлөвийг дарааллын дагуу өөрчилнө үү");

    if (status === "cancelled") {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.productVariant.updateMany({
          where: { productId: item.productId, size: item.size },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    return tx.order.update({ where: { id: orderId }, data: { status } });
  });
}
