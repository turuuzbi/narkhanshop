import Image from "next/image";
import { cn } from "@/lib/format";

/** next/image wrapper: SVG placeholders and runtime uploads are served as-is. */
export function ProductImage({
  src,
  alt,
  sizes,
  preload,
  className,
  categorySlug,
}: {
  src: string | undefined;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
  categorySlug?: string;
}) {
  const url = src || `/placeholders/${categorySlug ?? "tops"}.svg`;
  const unoptimized = url.endsWith(".svg") || url.startsWith("/api/uploads/");
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      fetchPriority={preload ? "high" : undefined}
      loading={preload ? "eager" : undefined}
      unoptimized={unoptimized}
      className={cn("object-cover", className)}
    />
  );
}
