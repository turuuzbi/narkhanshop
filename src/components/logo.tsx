import { useId } from "react";
import { cn } from "@/lib/format";

/** Circular badge logo: thin blush/white stripes, serif "Нархан", small "ONLINE SHOP". */
export function Logo({ size = 56, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Нархан online shop"
    >
      <defs>
        <pattern id={`s${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#fff" />
          <rect width="3" height="6" fill="#F4C7CF" />
        </pattern>
      </defs>
      <circle cx="60" cy="60" r="59" fill={`url(#s${id})`} />
      <circle cx="60" cy="60" r="46" fill="#FBF6F1" />
      <circle cx="60" cy="60" r="43" fill="none" stroke="#6B1E3A" strokeWidth="0.8" opacity="0.5" />
      <text
        x="60"
        y="63"
        textAnchor="middle"
        fill="#6B1E3A"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
        fontSize="27"
      >
        Нархан
      </text>
      <text
        x="60"
        y="79"
        textAnchor="middle"
        fill="#2A2024"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 600, letterSpacing: "2.2px" }}
        fontSize="6.6"
      >
        ONLINE SHOP
      </text>
      <path d="M60 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#6B1E3A" opacity="0.7" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-3", className)} fill="currentColor" aria-hidden>
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
    </svg>
  );
}
