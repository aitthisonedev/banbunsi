"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

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
      <label className="pagination-size">
        <span>{perPageLabel}</span>
        <select
          className="pagination-size-select"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          aria-label={perPageLabel}
        >
          {sizes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <nav className="pagination" aria-label="Pagination">
        {page > 1 ? (
          <Link className="btn-secondary" href={pageHref(page - 1)}>
            {prevLabel}
          </Link>
        ) : (
          <span className="btn-secondary opacity-40" aria-disabled>
            {prevLabel}
          </span>
        )}
        <span className="pagination-meta">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link className="btn-secondary" href={pageHref(page + 1)}>
            {nextLabel}
          </Link>
        ) : (
          <span className="btn-secondary opacity-40" aria-disabled>
            {nextLabel}
          </span>
        )}
      </nav>
    </div>
  );
}
