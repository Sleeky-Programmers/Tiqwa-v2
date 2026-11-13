import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { getAbout } from "@/lib/api/site";

export const metadata: Metadata = { title: "About TBILS" };

export default async function Page() {
  const about = await getAbout();
  return (
    <PageShell title="About TBILS" intro="Nigeria's trusted flight booking agency.">
      {about ? (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="max-w-2xl space-y-4 text-[15px] leading-[1.75] text-[#374151]">
            {about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {about.image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <Image src={about.image} alt="" fill unoptimized sizes="380px" className="object-cover" />
            </div>
          )}
        </div>
      ) : (
        <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
      )}
    </PageShell>
  );
}
