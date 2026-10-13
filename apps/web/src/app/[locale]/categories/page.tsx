import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryCards } from "@/components/category-cards";
import { EmptyState, ErrorState, Pagination } from "@/components/ui";
import { getCategories, getDocuments } from "@/lib/api";
import { categoriesOrDemo } from "@/lib/demo-categories";
import { isLocale, t } from "@/lib/i18n";

const PER_PAGE_OPTIONS = [8, 12, 16, 24, 50, 100];
const DEFAULT_PER_PAGE = 8;

function parsePerPage(raw: string | undefined) {
  const n = Number(raw || DEFAULT_PER_PAGE);
  if (PER_PAGE_OPTIONS.includes(n)) return n;
  if (Number.isFinite(n) && n >= 4 && n <= 100) return Math.floor(n);
  return DEFAULT_PER_PAGE;
}

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; per_page?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const perPage = parsePerPage(sp.per_page);

  const [catResult, docs] = await Promise.all([
    getCategories(raw)
      .then((data) => ({ ok: true as const, data }))
      .catch(() => ({ ok: false as const })),
    getDocuments(raw, { per_page: 100 }).catch(() => null),
  ]);

  const apiItems = catResult.ok ? catResult.data.items : [];
  const { items } = categoriesOrDemo(raw, apiItems);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * perPage, safePage * perPage);

  const counts: Record<string, number> = {};
  for (const doc of docs?.items || []) {
    if (!doc.category_slug) continue;
    counts[doc.category_slug] = (counts[doc.category_slug] || 0) + 1;
  }

  return (
    <div className="page-listing page-categories">
      <div className="page-listing-inner">
        <div className="page-listing-head">
          <h1 className="page-listing-title">{t(raw, "categories")}</h1>
          <Link href={`/${raw}/documents`} className="section-link">
            {t(raw, "viewAllDocuments")}
          </Link>
        </div>
        {!catResult.ok && items.length === 0 ? (
          <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
        ) : items.length === 0 ? (
          <EmptyState title={t(raw, "noCategories")} />
        ) : (
          <>
            <CategoryCards locale={raw} items={pageItems} counts={counts} />
            <Pagination
              page={safePage}
              perPage={perPage}
              total={total}
              pathname={`/${raw}/categories`}
              query={{}}
              prevLabel={t(raw, "previous")}
              nextLabel={t(raw, "next")}
              perPageLabel={t(raw, "perPage")}
              perPageSizes={PER_PAGE_OPTIONS}
              defaultPerPage={DEFAULT_PER_PAGE}
            />
          </>
        )}
      </div>
    </div>
  );
}
