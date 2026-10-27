import type { ReactNode } from "react";

/** Re-mounts on every navigation, giving each page a short fade-in. Opacity only: a transform here would break the fixed top bar. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-[fade-in_0.35s_ease-out] motion-reduce:animate-none">{children}</div>;
}
