"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Ellipsis,
  LayoutDashboard,
  Package,
  PanelLeft,
  Percent,
  Settings,
  Store,
  Tags,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { DemoCredit } from "@/components/shop/footer";
import { Sheet, Toaster } from "@/components/ui";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Хянах самбар", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Захиалга", icon: ClipboardList },
  { href: "/admin/quick-order", label: "DM захиалга", icon: Zap },
  { href: "/admin/products", label: "Бараа", icon: Package },
  { href: "/admin/inventory", label: "Үлдэгдэл", icon: Boxes },
  { href: "/admin/categories", label: "Ангилал", icon: Tags },
  { href: "/admin/promotions", label: "Урамшуулал", icon: Percent },
  { href: "/admin/settings", label: "Тохиргоо", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children, newOrders }: { children: React.ReactNode; newOrders: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("narkhan-admin-collapsed") === "1");
    } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("narkhan-admin-collapsed", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  return (
    <div className="min-h-dvh bg-[#F7F1EC]">
      <div className="bg-ink px-4 py-1.5 text-center text-[11px] font-medium text-white/90">
        Демо горим: admin хэсэг бүх хүнд нээлттэй.
      </div>
      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white/80 py-4 backdrop-blur transition-[width] duration-300 md:flex",
            collapsed ? "w-[76px] px-3" : "w-60 px-4",
          )}
        >
          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <Logo size={44} />
            {!collapsed && (
              <div className="leading-tight">
                <p className="font-serif text-xl italic text-plum">Нархан</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Админ</p>
              </div>
            )}
          </div>
          <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Админ цэс">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                  isActive(pathname, href) ? "bg-plum text-white shadow-soft" : "text-ink/75 hover:bg-blush-soft hover:text-plum",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="flex-1">{label}</span>}
                {!collapsed && href === "/admin/orders" && newOrders > 0 && (
                  <span className={cn("rounded-full px-1.5 text-[11px] font-bold", isActive(pathname, href) ? "bg-white text-plum" : "bg-plum text-white")}>
                    {newOrders}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Link href="/" className={cn("flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-blush-soft", collapsed && "justify-center px-0")}>
            <Store className="size-[18px]" /> {!collapsed && "Дэлгүүр харах"}
          </Link>
          <button type="button" onClick={toggle} className={cn("mt-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:bg-blush-soft", collapsed && "justify-center px-0")} aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хураах"}>
            <PanelLeft className="size-[18px]" /> {!collapsed && "Хураах"}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-line bg-white/90 px-4 backdrop-blur md:hidden">
            <Logo size={36} />
            <p className="font-serif text-lg italic text-plum">Нархан</p>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">Админ</span>
            <Link href="/" className="ml-auto text-xs font-semibold text-plum">Дэлгүүр →</Link>
          </div>
          <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 md:px-8 md:py-8 md:pb-8">{children}</main>
          <DemoCredit className="pb-28 md:pb-6" />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Админ доод цэс">
        <div className="grid h-16 grid-cols-5 items-center">
          <BottomLink href="/admin" label="Самбар" icon={LayoutDashboard} active={isActive(pathname, "/admin")} />
          <BottomLink href="/admin/orders" label="Захиалга" icon={ClipboardList} active={isActive(pathname, "/admin/orders")} badge={newOrders} />
          <Link href="/admin/quick-order" className="flex flex-col items-center" aria-label="DM захиалга">
            <span className={cn("-mt-6 grid size-14 place-items-center rounded-full bg-plum text-white shadow-lift ring-4 ring-white", isActive(pathname, "/admin/quick-order") && "bg-plum-dark")}>
              <Zap className="size-6" />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-plum">DM захиалга</span>
          </Link>
          <BottomLink href="/admin/products" label="Бараа" icon={Package} active={isActive(pathname, "/admin/products")} />
          <button type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted">
            <Ellipsis className="size-5" /> Бусад
          </button>
        </div>
      </nav>
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Бусад">
        <div className="grid grid-cols-2 gap-2">
          {[...NAV.slice(4), { href: "/", label: "Дэлгүүр харах", icon: Store }].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="card flex min-h-20 flex-col items-start justify-center gap-2 p-4 text-sm font-semibold">
              <Icon className="size-5 text-plum" /> {label}
            </Link>
          ))}
        </div>
      </Sheet>
      <Toaster />
    </div>
  );
}

function BottomLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: typeof Zap; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn("relative flex flex-col items-center gap-0.5 text-[10px] font-medium", active ? "text-plum" : "text-muted")}>
      <Icon className="size-5" />
      {label}
      {!!badge && <span className="absolute -top-1 left-1/2 ml-1.5 rounded-full bg-plum px-1.5 text-[10px] font-bold leading-4 text-white">{badge}</span>}
    </Link>
  );
}
