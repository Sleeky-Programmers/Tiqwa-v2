import Link from "next/link";
import { cn } from "@/lib/utils";

/** TBiLS wordmark with the orange paper-plane mark (ported from tbils.com). */
export function Logo({
  className,
  tone = "light",
  width = 138,
}: {
  className?: string;
  tone?: "light" | "dark";
  width?: number;
}) {
  return (
    <Link href="/" aria-label="TBiLS home" className={cn("inline-flex shrink-0", className)}>
      <svg width={width} height={(width * 56) / 184} viewBox="0 0 184 56" fill="none" role="img" aria-hidden>
        <path d="M5 39 C 16 34.5, 31 33.5, 45 37" stroke="#F58634" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
        <path d="M11 26 L47 11 L31 30 L28.5 42 L23 32 Z" fill="#F58634" />
        <path d="M31 30 L47 11 L28.5 42 Z" fill="#0098DA" fillOpacity="0.22" />
        <text
          x="57"
          y="39"
          fontFamily="var(--font-quicksand), Quicksand, 'Segoe UI', system-ui, sans-serif"
          fontSize="31"
          fontWeight="700"
          letterSpacing="0.3"
          fill={tone === "light" ? "#ffffff" : "#0F1B2D"}
        >
          TB<tspan fill="#F58634">i</tspan>LS
        </text>
      </svg>
    </Link>
  );
}
