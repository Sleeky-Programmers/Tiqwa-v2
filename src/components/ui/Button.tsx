import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-orange text-white hover:bg-orange-600",
  secondary: "bg-blue text-white hover:bg-blue-600",
  outline: "border-[1.5px] border-blue bg-white text-blue hover:bg-sky-50",
  ghost: "text-ink-500 hover:text-ink-900",
} as const;

type Props = {
  variant?: keyof typeof variants;
  className?: string;
} & ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className"> | ({ href?: undefined } & ComponentProps<"button">));

export function Button({ variant = "primary", className, ...props }: Props) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98]",
    variants[variant],
    className,
  );
  if (props.href !== undefined) {
    return <Link {...props} className={cls} />;
  }
  return <button type="button" {...(props as ComponentProps<"button">)} className={cls} />;
}
