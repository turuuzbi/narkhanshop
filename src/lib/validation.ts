import { z } from "zod";
import { DELIVERY_TYPES, DISTRICTS, ORDER_SOURCES, PAYMENT_METHODS, PHONE_REGEX, SIZES } from "./constants";

export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(PHONE_REGEX, { error: "8 оронтой утасны дугаар оруулна уу (ж: 99112233)" }));

export const customerSchema = z.object({
  customerName: z.string().trim().min(2, { error: "Нэрээ оруулна уу" }).max(60),
  phone: phoneSchema,
  district: z.enum(DISTRICTS, { error: "Дүүргээ сонгоно уу" }),
  khoroo: z.string().trim().regex(/^\d{1,2}$/, { error: "Хорооны дугаараа оруулна уу" }),
  address: z.string().trim().min(5, { error: "Байр, орц, тоотоо дэлгэрэнгүй бичнэ үү" }).max(200),
  note: z.string().trim().max(300).optional().default(""),
  deliveryType: z.enum(DELIVERY_TYPES),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Төлбөрийн хэлбэрээ сонгоно уу" }),
});

export const orderItemsSchema = z
  .array(z.object({ productId: z.string().min(1), size: z.enum(SIZES), qty: z.number().int().min(1).max(20) }))
  .min(1, { error: "Сагс хоосон байна" })
  .max(50);

export const orderInputSchema = customerSchema.extend({
  items: orderItemsSchema,
  source: z.enum(ORDER_SOURCES).default("web"),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type OrderInput = z.output<typeof orderInputSchema>;

/** Flattens Zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
