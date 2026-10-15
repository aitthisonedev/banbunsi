"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

/** How far down (px) the page must be scrolled before the button appears. */
const SHOW_AFTER = 400;

/** Floating "back to top" button for long admin pages; hidden near the top of the page. */
export function ScrollToTop({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="dash-scroll-top"
      aria-label={t(locale, "backToTop")}
      title={t(locale, "backToTop")}
      onClick={() => {
        const reduce = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
