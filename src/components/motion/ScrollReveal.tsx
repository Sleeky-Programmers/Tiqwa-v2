"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not(.is-revealed), [data-reveal-stagger]:not(.is-revealed)";

/**
 * Watches every [data-reveal] / [data-reveal-stagger] element and adds `.is-revealed`
 * the first time it scrolls into view. Re-scans on navigation and when content mounts
 * later (client-loaded lists), so any page can opt in with just the attribute.
 */
export function ScrollReveal() {
  const path = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    // A fast scroll or anchor jump can skip an element without it ever intersecting;
    // reveal anything already above the fold so nothing is left blank.
    let frame = 0;
    const catchUp = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll(SELECTOR).forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("is-revealed");
            io.unobserve(el);
          }
        });
      });
    };
    window.addEventListener("scroll", catchUp, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", catchUp);
      cancelAnimationFrame(frame);
    };
  }, [path]);

  return null;
}
