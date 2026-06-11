// DIZRUPT brand mark — SVG recreation of the supplied logo: a deep harbor-navy
// "D" struck through by a volt-green lightning bolt. The mark scales from
// 16px favicons to hero lockups; `glow` adds the product's signature halo.

import { cn } from "@/lib/utils";

export function DizruptMark({
  size = 28,
  glow,
  className,
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn(glow && "drop-shadow-[0_0_14px_rgba(0,237,130,0.45)]", className)}
    >
      {/* Navy D */}
      <path
        d="M14 6h22c14.36 0 26 11.64 26 26S50.36 58 36 58H14l6-20h-9L14 6Z"
        fill="#0E3A4C"
      />
      {/* Volt bolt striking through */}
      <path
        d="M47 0 12 34h14L8 64l38-30H31L47 0Z"
        fill="#00ED82"
      />
    </svg>
  );
}

export function DizruptWordmark({
  markSize = 28,
  className,
  sub,
}: {
  markSize?: number;
  className?: string;
  sub?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <DizruptMark size={markSize} glow />
      <span className="leading-none">
        <span className="block font-display text-[15px] font-bold tracking-tight text-fg">
          DIZRUPT
        </span>
        {sub && <span className="mt-0.5 block text-2xs text-fg-muted">{sub}</span>}
      </span>
    </span>
  );
}
