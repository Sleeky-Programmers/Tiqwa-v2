import type { ReactNode } from "react";

/** Auth page transition: only the form side re-mounts, so the brand panel stays put between login, sign-up and reset. */
export default function AuthTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-[fade-up_0.45s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none">{children}</div>;
}
