"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Save, Trash2, X } from "lucide-react";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { ConfirmDialog } from "@/components/ui";
import type { CategoryDTO } from "@/lib/data";
import { useUi } from "@/lib/stores";

export function CategoriesEditor({ categories }: { categories: CategoryDTO[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((c) => (
        <CategoryCard key={c.id} category={c} />
      ))}
      <CategoryCard />
    </div>
  );
}

function CategoryCard({ category }: { category?: CategoryDTO }) {
  const router = useRouter();
  const toast = useUi((s) => s.toast);
  const [pending, start] = useTransition();
  const [name, setName] = useState(category?.name ?? "");
  const [styles, setStyles] = useState<string[]>(category?.styles ?? []);
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState(false);

  const addStyle = () => {
    const s = draft.trim();
    if (s && !styles.includes(s)) setStyles([...styles, s]);
    setDraft("");
  };
  const save = () =>
    start(async () => {
      const res = await saveCategory({ id: category?.id, name, styles });
      if (res.ok) {
        toast(category ? "Хадгаллаа" : "Ангилал нэмэгдлээ");
        if (!category) {
          setName("");
          setStyles([]);
        }
        router.refresh();
      } else toast(res.error, "error");
    });
  const remove = () =>
    start(async () => {
      const res = await deleteCategory(category!.id);
      setConfirm(false);
      if (res.ok) {
        toast("Устгалаа");
        router.refresh();
      } else toast(res.error, "error");
    });

  return (
    <section className={category ? "card p-5" : "rounded-2xl border-2 border-dashed border-blush p-5"}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{category ? `${category.productCount} бараа · /${category.slug}` : "Шинэ ангилал"}</p>
        {category && (
          <button type="button" onClick={() => setConfirm(true)} className="icon-btn size-9 text-muted hover:text-red-700" aria-label="Ангилал устгах">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-2 font-semibold" placeholder="Ангиллын нэр" aria-label="Ангиллын нэр" />
      <p className="label mt-4">Загварууд</p>
      <div className="flex flex-wrap gap-1.5">
        {styles.map((s) => (
          <span key={s} className="badge bg-blush-soft py-1.5 pl-3 pr-1.5 text-xs text-plum">
            {s}
            <button type="button" onClick={() => setStyles(styles.filter((x) => x !== s))} className="grid size-5 place-items-center rounded-full hover:bg-white" aria-label={`${s} хасах`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {styles.length === 0 && <span className="text-xs text-muted">Загвар алга</span>}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStyle())} className="input min-h-10 text-sm" placeholder="ж: Bralette" aria-label="Шинэ загвар" />
        <button type="button" onClick={addStyle} className="btn btn-outline btn-sm shrink-0"><Plus className="size-4" /> Нэмэх</button>
      </div>
      <button type="button" onClick={save} disabled={pending || name.trim().length < 2} className="btn btn-primary btn-sm mt-4">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} {category ? "Хадгалах" : "Ангилал нэмэх"}
      </button>
      {category && (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={remove}
          pending={pending}
          danger
          title="Ангилал устгах уу?"
          confirmLabel="Устгах"
          description={category.productCount > 0 ? `Энэ ангилалд ${category.productCount} бараа байгаа тул устгах боломжгүй.` : "Хоосон ангиллыг устгана."}
        />
      )}
    </section>
  );
}
