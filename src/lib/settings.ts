/** Client-safe settings defaults & helpers (values are stored in the Setting table). */
export const DEFAULT_SETTINGS = {
  phone: "95601111",
  instagram: "narkhan_shop",
  facebook: "Narkhan shop",
  deliveryStandard: 5000,
  deliveryExpress: 10000,
  deliveryExpressFar: 15000,
  labelStorepay: "Storepay",
  labelPocketzero: "Pocket Zero",
  labelBank: "Дансаар шилжүүлэх",
  labelCash: "Хүргэлтээр төлөх",
  bankAccount: "Хаан банк · 5000 123 456 · Нархан (демо данс)",
};
export type ShopSettings = typeof DEFAULT_SETTINGS;
export const NUMERIC_SETTINGS = ["deliveryStandard", "deliveryExpress", "deliveryExpressFar"] as const;

export function paymentLabel(method: string, s: ShopSettings) {
  return (
    { storepay: s.labelStorepay, pocketzero: s.labelPocketzero, bank: s.labelBank, cash: s.labelCash } as Record<string, string>
  )[method] ?? method;
}
