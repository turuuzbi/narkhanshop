import Link from "next/link";
import { Phone } from "lucide-react";
import { InstagramIcon, Logo } from "@/components/logo";
import { formatPhone } from "@/lib/format";
import type { ShopSettings } from "@/lib/settings";

export function DemoCredit({ className = "" }: { className?: string }) {
  return <p className={`text-center text-xs text-muted ${className}`}>Demo by Turuu, not the official site.</p>;
}

export function Footer({ settings, categories }: { settings: ShopSettings; categories: { name: string; slug: string }[] }) {
  return (
    <footer className="mt-20 border-t border-line/70 bg-white/60 pb-24 md:pb-8">
      <div className="container-shop grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size={84} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Европоос ирсэн H&M-ийн жинхэнэ дотуур хувцас, унтлагын хувцас. Бүх бараа бэлэн, хүргэлтээр.
          </p>
        </div>
        <FooterCol title="Ангилал">
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`}>{c.name}</Link>
          ))}
        </FooterCol>
        <FooterCol title="Тусламж">
          <Link href="/size-guide">Хэмжээний заавар</Link>
          <Link href="/info">Хүргэлт & төлбөр</Link>
          <Link href="/wishlist">Хадгалсан бараа</Link>
          <Link href="/admin">Админ (демо)</Link>
        </FooterCol>
        <FooterCol title="Холбоо барих">
          <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2"><Phone className="size-4" /> {formatPhone(settings.phone)}</a>
          <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
            <InstagramIcon className="size-4" /> @{settings.instagram}
          </a>
          <span className="text-muted">Storepay · Pocket Zero · Дансаар</span>
        </FooterCol>
      </div>
      <div className="container-shop border-t border-line/70 pt-6">
        <DemoCredit />
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <div className="flex flex-col gap-2.5 text-sm text-ink/80 [&_a:hover]:text-plum">{children}</div>
    </div>
  );
}
