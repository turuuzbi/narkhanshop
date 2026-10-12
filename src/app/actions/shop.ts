"use server";

import { revalidatePath } from "next/cache";
import { WEB_PAYMENT_METHODS } from "@/lib/constants";
import { createOrder, StockError, type StockIssue } from "@/lib/orders";
import { fieldErrors, orderInputSchema } from "@/lib/validation";

export type PlaceOrderResult =
  | { ok: true; number: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; stock?: StockIssue[] };

export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Мэдээллээ шалгаад дахин оролдоно уу.", fieldErrors: fieldErrors(parsed.error) };
  }
  if (!WEB_PAYMENT_METHODS.includes(parsed.data.paymentMethod)) {
    return { ok: false, error: "Төлбөрийн хэлбэрээ сонгоно уу.", fieldErrors: { paymentMethod: "Төлбөрийн хэлбэрээ сонгоно уу" } };
  }
  try {
    const order = await createOrder({ ...parsed.data, source: "web" });
    revalidatePath("/admin", "layout");
    return { ok: true, number: order.number };
  } catch (e) {
    if (e instanceof StockError) {
      return { ok: false, error: "Зарим барааны үлдэгдэл өөрчлөгдсөн байна. Сагсаа шалгаад дахин захиална уу.", stock: e.issues };
    }
    console.error(e);
    return { ok: false, error: "Алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу." };
  }
}
