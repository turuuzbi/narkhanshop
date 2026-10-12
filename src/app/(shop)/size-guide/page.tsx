import type { Metadata } from "next";
import { SizeFinderForm } from "@/components/shop/size-finder";

export const metadata: Metadata = { title: "Хэмжээ олох" };

const TIPS = [
  { title: "Жингээрээ эхэл", text: "Нарханы хүснэгт жин дээр суурилсан тул эхлээд жингээ оруулаарай." },
  { title: "Өндрөө нэм", text: "Өндөр бол унтлагын хувцасны өмд, ханцуй урт байх тул нэг том хэмжээг санал болгоно." },
  { title: "Загвараа бод", text: "Thong, brazilian биед наалдана — эргэлзвэл жижгийг; пижамад томыг сонгоход тухтай." },
];

export default function SizeGuidePage() {
  return (
    <div className="container-shop max-w-3xl pt-8">
      <p className="eyebrow">Хэмжээний заавар</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Өөрт тохирох хэмжээгээ ол</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">Жин, өндрөө оруулахад Нарханы хэмжээний хүснэгтээр тохирох хэмжээг шууд санал болгоно.</p>
      <div className="card mt-6 p-5 sm:p-7">
        <SizeFinderForm />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {TIPS.map((t, i) => (
          <div key={t.title} className="rounded-2xl bg-blush-soft p-4">
            <p className="font-serif text-3xl text-plum">0{i + 1}</p>
            <p className="mt-1 text-sm font-semibold">{t.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
