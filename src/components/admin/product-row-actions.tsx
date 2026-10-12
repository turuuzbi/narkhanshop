"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyPlus, Ellipsis, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteProduct, duplicateProduct } from "@/app/actions/admin";
import { ConfirmDialog, Sheet } from "@/components/ui";
import { useUi } from "@/lib/stores";

export function ProductRowActions({ id, name, slug }: { id: string; name: string; slug: string }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const dup = () =>
    start(async () => {
      const res = await duplicateProduct(id);
      setMenu(false);
      if (res.ok) {
        toast("Хуулбар үүслээ");
        router.push(`/admin/products/${res.id}`);
      } else toast(res.error, "error");
    });
  const del = () =>
    start(async () => {
      const res = await deleteProduct(id);
      setConfirm(false);
      if (res.ok) {
        toast("Устгалаа");
        router.refresh();
      } else toast(res.error, "error");
    });

  return (
    <>
      <button type="button" className="icon-btn" onClick={() => setMenu(true)} aria-label={`${name} — үйлдэл`}>
        <Ellipsis className="size-5" />
      </button>
      <Sheet open={menu} onClose={() => setMenu(false)} title={name} variant="center">
        <div className="grid gap-2">
          <Link href={`/admin/products/${id}`} className="btn btn-outline justify-start"><Pencil className="size-4" /> Засах</Link>
          <button type="button" onClick={dup} disabled={pending} className="btn btn-outline justify-start"><CopyPlus className="size-4" /> Хуулбар үүсгэх</button>
          <Link href={`/product/${slug}`} target="_blank" className="btn btn-outline justify-start"><ExternalLink className="size-4" /> Дэлгүүрт харах</Link>
          <button type="button" onClick={() => { setMenu(false); setConfirm(true); }} className="btn btn-ghost justify-start text-red-700 hover:bg-red-50"><Trash2 className="size-4" /> Устгах</button>
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={del}
        pending={pending}
        danger
        title="Бараа устгах уу?"
        confirmLabel="Устгах"
        description={<><b className="text-ink">{name}</b> болон түүний үлдэгдэл устна. Өмнөх захиалгууд хэвээр үлдэнэ.</>}
      />
    </>
  );
}
