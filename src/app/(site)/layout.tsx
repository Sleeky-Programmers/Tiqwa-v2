import { ChatPill } from "@/components/layout/ChatPill";
import { Footer } from "@/components/layout/Footer";

/** Public website chrome: marketing footer and the floating live-chat pill. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatPill />
    </>
  );
}
