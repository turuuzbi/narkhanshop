export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type Size = (typeof SIZES)[number];

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

/** Real size chart from the shop's Instagram post. */
export const SIZE_CHART: { size: Size; weight: string; heightWaist: string; maxWeight: number }[] = [
  { size: "XS", weight: "50 кг хүртэл", heightWaist: "160/90", maxWeight: 50 },
  { size: "S", weight: "50–60 кг", heightWaist: "165/95", maxWeight: 60 },
  { size: "M", weight: "60–75 кг", heightWaist: "170/110", maxWeight: 75 },
  { size: "L", weight: "75–85 кг", heightWaist: "175/110", maxWeight: 85 },
  { size: "XL", weight: "86 кг-аас дээш", heightWaist: "180/120", maxWeight: Infinity },
];

export const LOW_STOCK_THRESHOLD = 2;
export const BNPL_INSTALLMENTS = 4;

export const DISTRICTS = [
  "Баянгол",
  "Баянзүрх",
  "Сүхбаатар",
  "Сонгинохайрхан",
  "Хан-Уул",
  "Чингэлтэй",
  "Налайх",
  "Багануур",
  "Багахангай",
] as const;
/** Outer districts use the higher express fee. */
export const FAR_DISTRICTS: readonly string[] = ["Налайх", "Багануур", "Багахангай"];

export const ORDER_STATUSES = ["new", "confirmed", "shipping", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_META: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  new: { label: "Шинэ", className: "bg-blush-soft text-plum", dot: "bg-plum" },
  confirmed: { label: "Баталгаажсан", className: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  shipping: { label: "Хүргэлтэнд гарсан", className: "bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  delivered: { label: "Хүргэгдсэн", className: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Цуцалсан", className: "bg-stone-100 text-stone-600", dot: "bg-stone-400" },
};

/** Forward-only pipeline; delivered & cancelled are final. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "shipping",
  shipping: "delivered",
};

export const DELIVERY_TYPES = ["standard", "express"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const PAYMENT_METHODS = ["storepay", "pocketzero", "bank", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
/** Methods offered on the public checkout (cash on delivery is staff-only for DM orders). */
export const WEB_PAYMENT_METHODS: PaymentMethod[] = ["storepay", "pocketzero", "bank"];

export const ORDER_SOURCES = ["web", "instagram", "facebook", "phone"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];
export const SOURCE_LABELS: Record<OrderSource, string> = {
  web: "Вэбсайт",
  instagram: "Instagram",
  facebook: "Facebook",
  phone: "Утас",
};

export const CATEGORY_SLUGS = { bras: "bras", panties: "panties", pajamas: "pajamas", tops: "tops" } as const;

export const PHONE_REGEX = /^[6-9]\d{7}$/;
