"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/api";
import { Flag } from "@/components/flag";
import { t } from "@/lib/i18n";

function swapLocalePath(pathname: string, next: Locale) {
  const parts = pathname.split("/");
  if (parts.length > 1 && (parts[1] === "lo" || parts[1] === "en")) {
    parts[1] = next;
    return parts.join("/") || `/${next}`;
  }
  return `/${next}`;
}

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "lo", label: "ລາວ" },
  { code: "en", label: "English" },
];

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.code === locale) ?? OPTIONS[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="lang-switch" ref={rootRef}>
      <button
        type="button"
        className="lang-switch-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t(locale, "language")}
        onClick={() => setOpen((v) => !v)}
      >
        <Flag code={current.code} />
        <span>{current.label}</span>
        <svg className="lang-switch-caret" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M5 7.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="lang-switch-menu" role="listbox" aria-label={t(locale, "language")}>
          {OPTIONS.map((opt) => {
            const active = opt.code === locale;
            return (
              <Link
                key={opt.code}
                href={swapLocalePath(pathname, opt.code)}
                role="option"
                aria-selected={active}
                aria-current={active ? "true" : undefined}
                onClick={() => setOpen(false)}
              >
                <Flag code={opt.code} />
                <span>{opt.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
