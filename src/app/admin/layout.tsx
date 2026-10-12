import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/db-config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Админ", template: "%s · Нархан админ" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const newOrders = await prisma.order.count({ where: { status: "new" } });
  return (
    <AdminShell newOrders={newOrders} demoMode={isDemoMode()}>
      {children}
    </AdminShell>
  );
}
