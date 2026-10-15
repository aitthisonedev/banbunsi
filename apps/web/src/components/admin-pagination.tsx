"use client";

import { useState, type RefObject } from "react";
import type { Locale } from "@/lib/api";
import { btn } from "@/components/admin-documents-ui";
import { t } from "@/lib/i18n";

/** Items per page on the admin management lists (documents, categories, quizzes, members). */
export const ADMIN_PAGE_SIZE = 8;

/**
 * Splits an already loaded (and filtered) list into pages. The page is clamped, so removing the
 * last item on the final page shows the page before it; call `setPage(1)` when filters change.
 */
export function usePagination<T>(items: T[], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  return {
    rows: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    /** Items before this page; row number = offset + index + 1 (counts on across pages). */
    offset: (currentPage - 1) * pageSize,
    pageCount,
    total: items.length,
    pageSize,
    setPage,
  };
}

/** [Previous] 1/2 [Next], shown only when there is more than one page. */
export function AdminPagination({
  locale,
  page,
  pageCount,
  total,
  pageSize = ADMIN_PAGE_SIZE,
  onPageChange,
  scrollTarget,
  className = "",
}: {
  locale: Locale;
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** Brought back into view on page change when its top has scrolled out of sight. */
  scrollTarget?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  if (total <= pageSize) return null;

  function go(next: number) {
    onPageChange(next);
    const top = scrollTarget?.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) scrollTarget?.current?.scrollIntoView({ block: "start" });
  }

  return (
    <nav
      aria-label={t(locale, "pagination")}
      className={`flex items-center justify-center gap-3 px-4 py-3 ${className}`}
    >
      <button
        type="button"
        className={btn.secondarySm}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        {t(locale, "previous")}
      </button>
      <span
        className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
      >
        {page}/{pageCount}
      </span>
      <button
        type="button"
        className={btn.secondarySm}
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
      >
        {t(locale, "next")}
      </button>
    </nav>
  );
}
