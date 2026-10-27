import type { ReactNode } from "react";

/** Dashboard page transition: only the content area re-mounts, so the sidebar and top bar stay put. */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none">{children}</div>;
}
