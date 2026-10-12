import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** 18000 -> "18,000₮" */
export function formatMNT(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")}₮`;
}

/** 99112233 -> "9911 2233" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : phone;
}

const UB_TZ = "Asia/Ulaanbaatar";

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: UB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(",", "");
}

/** Calendar day key in Ulaanbaatar time, e.g. "2026-10-12". */
export function dayKey(date: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: UB_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(date),
  );
}

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
export function weekdayShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Latin-only slug, transliterating Mongolian Cyrillic. */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l",
  м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
