"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Select } from "./select";

const DEFAULT_SIZES = [8, 12, 16, 24, 50, 100];

function buildHref(
  pathname: string,
  query: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...query, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "") continue;
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Pagination({
  page,
  perPage,
  total,
  pathname,
  query = {},
  prevLabel,
  nextLabel,
  perPageLabel,
  navLabel,
  perPageSizes = DEFAULT_SIZES,
  defaultPerPage = 8,
}: {
  page: number;
  perPage: number;
  total: number;
  pathname: string;
  /** Current query keys to preserve (serializable). */
  query?: Record<string, string | undefined>;
  prevLabel: string;
  nextLabel: string;
  perPageLabel: string;
  /** Accessible name of the page links, in the page language. */
  navLabel: string;
  perPageSizes?: number[];
  defaultPerPage?: number;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  const sizes = perPageSizes.includes(perPage)
    ? perPageSizes
    : [...perPageSizes, perPage].sort((a, b) => a - b);

  if (total <= 0) return null;

  const baseQuery: Record<string, string | undefined> = {
    ...query,
    per_page: perPage !== defaultPerPage ? String(perPage) : undefined,
    page: undefined,
  };

  function pageHref(nextPage: number) {
    return buildHref(pathname, baseQuery, {
      page: nextPage > 1 ? String(nextPage) : undefined,
    });
  }

  function onPerPageChange(next: number) {
    router.push(
      buildHref(pathname, query, {
        per_page: next !== defaultPerPage ? String(next) : undefined,
        page: undefined,
      }),
    );
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-cluster">
        <div className="pagination-size">
          <span className="pagination-size-label">{perPageLabel}</span>
          <Select
            className="pagination-size-select"
            value={String(perPage)}
            options={sizes.map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            onChange={(value) => onPerPageChange(Number(value))}
            aria-label={perPageLabel}
            searchable={false}
          />
        </div>

        <nav className="pagination" aria-label={navLabel}>
          {totalPages > 1 && page > 1 ? (
            <Link className="pagination-btn" href={pageHref(page - 1)}>
              {prevLabel}
            </Link>
          ) : (
            <span className="pagination-btn is-disabled" aria-disabled="true">
              {prevLabel}
            </span>
          )}
          <span className="pagination-meta" aria-current="page">
            {page}
            <span className="pagination-meta-sep" aria-hidden>
              /
            </span>
            {totalPages}
          </span>
          {totalPages > 1 && page < totalPages ? (
            <Link className="pagination-btn" href={pageHref(page + 1)}>
              {nextLabel}
            </Link>
          ) : (
            <span className="pagination-btn is-disabled" aria-disabled="true">
              {nextLabel}
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}
