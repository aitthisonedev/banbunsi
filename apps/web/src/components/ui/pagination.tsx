import Link from "next/link";

export function Pagination({
  page,
  perPage,
  total,
  hrefFor,
  prevLabel,
  nextLabel,
}: {
  page: number;
  perPage: number;
  total: number;
  hrefFor: (page: number) => string;
  prevLabel: string;
  nextLabel: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link className="btn-secondary" href={hrefFor(page - 1)}>
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
        <Link className="btn-secondary" href={hrefFor(page + 1)}>
          {nextLabel}
        </Link>
      ) : (
        <span className="btn-secondary opacity-40" aria-disabled>
          {nextLabel}
        </span>
      )}
    </nav>
  );
}
