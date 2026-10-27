import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement> & { "data-reveal"?: boolean | string }) {
  return (
    <div {...rest} className={cn("mx-auto w-full max-w-page px-4", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("mb-1 block text-xs font-bold uppercase tracking-wider text-primary", className)}>
      {children}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-blue/30 bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
