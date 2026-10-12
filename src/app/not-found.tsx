import Link from "next/link";
import { Logo } from "@/components/logo";
import { DemoCredit } from "@/components/shop/footer";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={96} />
      <h1 className="h-display mt-6 text-4xl">Хуудас олдсонгүй</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Таны хайсан хуудас устсан эсвэл хаяг буруу байна.</p>
      <Link href="/shop" className="btn btn-primary mt-6">Дэлгүүр үзэх</Link>
      <DemoCredit className="mt-16" />
    </div>
  );
}
