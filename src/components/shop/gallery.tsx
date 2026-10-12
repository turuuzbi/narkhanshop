"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/format";

export function Gallery({ images, alt, categorySlug }: { images: string[]; alt: string; categorySlug: string }) {
  const list = images.length ? images : [""];
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    setActive(i);
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="md:sticky md:top-24">
      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-3xl"
          aria-label="Зургууд"
        >
          {list.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-peach/60">
              <ProductImage src={src} alt={`${alt} — зураг ${i + 1}`} categorySlug={categorySlug} sizes="(max-width: 768px) 100vw, 50vw" preload={i === 0} />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Зураг ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-plum" : "w-1.5 bg-white/90")}
              />
            ))}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Зураг ${i + 1}`}
              className={cn("relative aspect-[3/4] w-20 overflow-hidden rounded-xl border-2 transition", i === active ? "border-plum" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <ProductImage src={src} alt="" categorySlug={categorySlug} sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
