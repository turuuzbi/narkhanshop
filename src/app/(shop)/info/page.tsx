import type { Metadata } from "next";
import { CreditCard, Phone, RotateCcw, Truck } from "lucide-react";
import { InstagramIcon } from "@/components/logo";
import { BNPL_INSTALLMENTS } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { formatMNT, formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Хүргэлт & төлбөр" };

export default async function InfoPage() {
  const s = await getSettings();
  const blocks = [
    {
      icon: Truck,
      title: "Хүргэлт",
      rows: [
        ["Энгийн хүргэлт", `${formatMNT(s.deliveryStandard)} · 24–48 цаг`],
        ["Шуурхай хүргэлт", `${formatMNT(s.deliveryExpress)} · өнөөдөртөө`],
        ["Налайх, Багануур, Багахангай", `${formatMNT(s.deliveryExpressFar)} · шуурхай`],
      ],
    },
    {
      icon: CreditCard,
      title: "Төлбөр",
      rows: [
        [s.labelStorepay, `${BNPL_INSTALLMENTS} хувааж, хүүгүй`],
        [s.labelPocketzero, "0% хувааж төлөх"],
        [s.labelBank, s.bankAccount],
      ],
    },
    {
      icon: RotateCcw,
      title: "Солилт",
      rows: [
        ["Хэмжээ таарахгүй бол", "24 цагийн дотор солино"],
        ["Нөхцөл", "Шошготой, өмсөөгүй байх"],
        ["Дотуур өмд", "Эрүүл ахуйн үүднээс буцаахгүй"],
      ],
    },
  ];
  return (
    <div className="container-shop max-w-3xl pt-8">
      <p className="eyebrow">Мэдээлэл</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Хүргэлт & төлбөр</h1>
      <div className="mt-6 space-y-4">
        {blocks.map(({ icon: Icon, title, rows }) => (
          <section key={title} className="card p-5">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold"><Icon className="size-5 text-plum" /> {title}</h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <a href={`tel:${s.phone}`} className="btn btn-primary"><Phone className="size-4" /> {formatPhone(s.phone)}</a>
        <a href={`https://ig.me/m/${s.instagram}`} target="_blank" rel="noreferrer" className="btn btn-outline"><InstagramIcon className="size-4" /> @{s.instagram}</a>
      </div>
    </div>
  );
}
