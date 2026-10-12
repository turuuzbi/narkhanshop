import Link from "next/link";
import { ArrowRight, BadgeCheck, CreditCard, Gift, PackageCheck, Phone, Truck } from "lucide-react";
import { InstagramIcon, Logo, Sparkle } from "@/components/logo";
import { ProductImage } from "@/components/product-image";
import { ProductCard } from "@/components/shop/product-card";
import { SizeFinderButton, SizeFinderForm } from "@/components/shop/size-finder";
import { SIZE_CHART } from "@/lib/constants";
import { getAllProducts, getCategories, getPromotions, getSettings } from "@/lib/data";
import { formatMNT, formatPhone } from "@/lib/format";

export default async function HomePage() {
  const [products, categories, promos, settings] = await Promise.all([getAllProducts(), getCategories(), getPromotions(), getSettings()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const heroMain = bySlug.get("pj-leopard-set") ?? products[0];
  const heroA = bySlug.get("pj-pink-satin") ?? products[1];
  const heroB = bySlug.get("panty-burgundy-lace-brazilian") ?? products[2];
  const newArrivals = products.filter((p) => p.isNew);
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-blush/50 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-20 top-40 size-64 rounded-full bg-peach blur-3xl" aria-hidden />
        <div className="container-shop relative grid items-center gap-8 pb-10 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pb-16 md:pt-14">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkle className="text-plum" /> H&M брэнд · Европоос
            </p>
            <h1 className="h-display mt-3 text-[44px] leading-[1.02] sm:text-6xl lg:text-7xl">
              Зөөлөн мэдрэмж,
              <br />
              <em className="text-plum">өдөр бүр.</em>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              H&M-ийн жинхэнэ дотуур хувцас, унтлагын хувцас. Бүх бараа бэлэн — хэмжээгээ сонгоод захиалахад л хангалттай.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary px-6">
                Дэлгүүр үзэх <ArrowRight className="size-4" />
              </Link>
              <SizeFinderButton />
            </div>
          </div>
          <div className="relative grid grid-cols-[1.35fr_1fr] gap-3">
            <Link href={`/product/${heroMain.slug}`} className="relative row-span-2 h-full min-h-full overflow-hidden rounded-[28px] bg-peach shadow-lift">
              <ProductImage src={heroMain.images[0]} alt={heroMain.name} sizes="(max-width: 768px) 56vw, 320px" preload />
              <span className="badge absolute bottom-3 left-3 bg-white/90 text-plum">Шинэ ирэлт</span>
            </Link>
            <Link href={`/product/${heroA.slug}`} className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-peach shadow-soft">
              <ProductImage src={heroA.images[0]} alt={heroA.name} sizes="(max-width: 768px) 40vw, 230px" />
            </Link>
            <Link href={`/product/${heroB.slug}`} className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-peach shadow-soft">
              <ProductImage src={heroB.images[0]} alt={heroB.name} sizes="(max-width: 768px) 40vw, 230px" />
            </Link>
            <Logo size={92} className="absolute -top-5 left-1 rotate-[-8deg] drop-shadow-md max-sm:size-[72px]" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Давуу талууд" className="border-y border-line/70 bg-white/70">
        <ul className="container-shop no-scrollbar flex gap-6 overflow-x-auto py-4 text-sm md:justify-between">
          {[
            { icon: BadgeCheck, title: "H&M оригинал", sub: "Европоос шууд" },
            { icon: PackageCheck, title: "Бүх бараа бэлэн", sub: "Хүлээлгүй" },
            { icon: Truck, title: `Хүргэлт ${formatMNT(settings.deliveryStandard)}`, sub: "Шуурхай хүргэлттэй" },
            { icon: CreditCard, title: "Storepay · Pocket Zero", sub: "4 хувааж төлөх" },
          ].map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex shrink-0 items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-blush-soft text-plum"><Icon className="size-5" /></span>
              <span>
                <b className="block font-semibold">{title}</b>
                <span className="text-xs text-muted">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Shop by size */}
      <section className="container-shop mt-12">
        <SectionHead eyebrow="Instagram highlight шиг" title="Хэмжээгээр сонгох" />
        <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
          {SIZE_CHART.map((r) => (
            <Link
              key={r.size}
              href={`/shop?size=${r.size}`}
              className="group flex flex-col items-center rounded-2xl border border-line bg-white px-1 py-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-plum/40"
            >
              <span className="font-serif text-3xl leading-none text-ink group-hover:text-plum sm:text-4xl">{r.size}</span>
              <span className="mt-1.5 text-[10px] leading-tight text-muted sm:text-xs">{r.weight}</span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-muted">
          Хэмжээгээ мэдэхгүй байна уу?{" "}
          <SizeFinderButton className="font-semibold text-plum underline underline-offset-4" label="5 секундэд олох" />
        </p>
      </section>

      {/* Categories */}
      <section className="container-shop mt-14">
        <SectionHead eyebrow="Ангилал" title="Юу хайж байна вэ?" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c) => {
            const img = products.find((p) => p.categorySlug === c.slug && p.images[0]?.startsWith("/products/"))?.images[0] ?? products.find((p) => p.categorySlug === c.slug)?.images[0];
            return (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-peach shadow-soft">
                <ProductImage src={img} alt="" categorySlug={c.slug} sizes="(max-width: 1024px) 50vw, 25vw" className="transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <p className="font-serif text-2xl leading-tight">{c.name}</p>
                  <p className="text-xs text-white/85">{c.productCount} загвар</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Promotions */}
      {promos.length > 0 && (
        <section className="container-shop mt-14 grid gap-3 md:grid-cols-2" aria-label="Урамшуулал">
          {promos.map((p) => {
            const dark = isDark(p.bannerColor);
            const href = `/shop?size=${p.rule.size}${p.type === "size_discount" ? "&sale=1" : ""}`;
            return (
              <Link
                key={p.id}
                href={href}
                style={{ backgroundColor: p.bannerColor }}
                className={`group relative overflow-hidden rounded-3xl p-6 shadow-soft transition hover:-translate-y-0.5 ${dark ? "text-white" : "text-plum"}`}
              >
                <div className="stripes absolute -right-10 -top-10 size-40 rounded-full opacity-25" aria-hidden />
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-blush" : "text-plum/80"}`}>
                  {p.type === "size_gift" ? <Gift className="mr-1 inline size-4" /> : <Sparkle className="mr-1 inline" />}
                  Урамшуулал
                </p>
                <p className="mt-2 font-serif text-4xl">{p.title}</p>
                <p className={`mt-2 max-w-sm text-sm leading-relaxed ${dark ? "text-white/85" : "text-ink/80"}`}>{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                  Үзэх <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="mt-14">
          <div className="container-shop">
            <SectionHead eyebrow="Шинэ" title="Шинэ ирэлт" href="/shop?new=1" />
          </div>
          <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} promos={promos} className="w-[44vw] max-w-[240px] shrink-0 snap-start sm:w-[220px]" />
            ))}
          </div>
        </section>
      )}

      {/* Size finder */}
      <section className="container-shop mt-14">
        <div className="grid gap-6 overflow-hidden rounded-[28px] bg-white p-5 shadow-soft sm:p-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Хэмжээ олох</p>
            <h2 className="h-display mt-2 text-4xl">Хэмжээгээ 5 секундэд ол</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Жингээ оруулахад Нарханы хэмжээний хүснэгтээр танд тохирох хэмжээг санал болгоно. Дараа нь зөвхөн таны хэмжээнд байгаа барааг харуулна.
            </p>
          </div>
          <SizeFinderForm compact />
        </div>
      </section>

      {/* Featured */}
      <section className="container-shop mt-14">
        <SectionHead eyebrow="Онцлох" title="Хамгийн их хайгдсан" href="/shop" />
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} promos={promos} />
          ))}
        </div>
      </section>

      {/* Instagram / phone */}
      <section className="container-shop mt-16">
        <div className="relative overflow-hidden rounded-[28px] bg-blush-soft px-6 py-10 text-center">
          <div className="stripes absolute -left-12 -bottom-12 size-44 rounded-full opacity-40" aria-hidden />
          <p className="eyebrow">Асуух зүйл байна уу?</p>
          <h2 className="h-display mt-2 text-4xl">Бид туслахад бэлэн</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Хэмжээ, загварын талаар Instagram-аар бичих эсвэл утсаар холбогдоорой.</p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <a href={`https://ig.me/m/${settings.instagram}`} target="_blank" rel="noreferrer" className="btn btn-primary">
              <InstagramIcon className="size-4" /> Instagram DM
            </a>
            <a href={`tel:${settings.phone}`} className="btn btn-outline">
              <Phone className="size-4" /> {formatPhone(settings.phone)}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h-display mt-1 text-[32px] leading-tight sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 pb-1 text-sm font-semibold text-plum hover:underline">
          Бүгд <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function isDark(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}
