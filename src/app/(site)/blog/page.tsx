import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell";
import { getBlogs, getBlogUrl } from "@/lib/api/site";

export const metadata: Metadata = { title: "Blog" };

const dateLabel = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(iso)) : "";

export default async function Page() {
  const [posts, blogUrl] = await Promise.all([getBlogs(), getBlogUrl()]);
  return (
    <PageShell title="Blog" intro="Travel tips, visa guides and flight deals.">
      {posts ? (
        <ul data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const href = p.href ?? blogUrl ?? undefined;
            const card = (
              <>
                {p.image && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#eef3f8]">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 400px, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  {dateLabel(p.date) && <p className="text-xs font-bold uppercase tracking-wider text-outline">{dateLabel(p.date)}</p>}
                  <h2 className="mt-1 font-display text-lg font-extrabold leading-snug text-ink-900">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-sm leading-[1.6] text-ink-500">{p.excerpt}</p>}
                </div>
              </>
            );
            return (
              <li key={p.id} className="hover-lift group overflow-hidden rounded-2xl border border-[#e3ebf3] bg-white">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="max-w-2xl text-on-surface-variant">
          No posts yet. For help now, call or WhatsApp our Lagos team
          {blogUrl && (
            <>
              , or visit our{" "}
              <a href={blogUrl} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold text-blue">
                blog
              </a>
            </>
          )}
          .
        </p>
      )}
    </PageShell>
  );
}
