import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState, Pagination, Select } from "@/components/ui";
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

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    year?: string;
    page?: string;
    per_page?: string;
  }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();

  const year = sp.year ? Number(sp.year) : undefined;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const perPage = parsePerPage(sp.per_page);

  const [docsResult, catsResult] = await Promise.all([
    getDocuments(raw, {
      q: sp.q,
      category: sp.category,
      year: Number.isFinite(year) ? year : undefined,
      page,
      per_page: perPage,
    })
      .then((data) => ({ ok: true as const, data }))
      .catch(() => ({ ok: false as const })),
    getCategories(raw)
      .then((data) => ({ ok: true as const, data }))
      .catch(() => ({ ok: false as const })),
  ]);

  const apiCats = catsResult.ok ? catsResult.data.items : [];
  const { items: categories } = categoriesOrDemo(raw, apiCats);

  const total = docsResult.ok ? docsResult.data.total : 0;
  const hasFilters = Boolean(sp.q || sp.category || sp.year);
  const clearHref =
    perPage !== DEFAULT_PER_PAGE
      ? `/${raw}/documents?per_page=${perPage}`
      : `/${raw}/documents`;

  return (
    <div className="page-listing page-documents">
      <div className="page-listing-inner">
        <div className="page-listing-head">
          <h1 className="page-listing-title">{t(raw, "documents")}</h1>
          <Link href={`/${raw}/categories`} className="section-link">
            {t(raw, "viewAllCategories")}
          </Link>
        </div>

        <form className="doc-toolbar" method="get" role="search">
          {perPage !== DEFAULT_PER_PAGE ? (
            <input type="hidden" name="per_page" value={perPage} />
          ) : null}

          <div className="doc-toolbar-line">
            <label className="sr-only" htmlFor="doc-q">
              {t(raw, "search")}
            </label>
            <input
              id="doc-q"
              className="doc-toolbar-input"
              name="q"
              defaultValue={sp.q || ""}
              placeholder={t(raw, "searchPlaceholder")}
            />
            <Select
              name="category"
              aria-label={t(raw, "categories")}
              defaultValue={sp.category || ""}
              className="doc-toolbar-select"
              options={[
                { value: "", label: t(raw, "allCategories") },
                ...categories.map((c) => ({ value: c.slug, label: c.name })),
              ]}
            />
            <label className="doc-toolbar-year">
              <span className="sr-only">{t(raw, "year")}</span>
              <input
                className="doc-toolbar-year-input"
                name="year"
                type="number"
                defaultValue={sp.year || ""}
                placeholder={t(raw, "year")}
                inputMode="numeric"
              />
            </label>
            <button className="doc-toolbar-submit" type="submit">
              {t(raw, "search")}
            </button>
            {hasFilters ? (
              <Link href={clearHref} className="doc-filter-reset">
                {t(raw, "clearFilters")}
              </Link>
            ) : null}
          </div>
        </form>

        {docsResult.ok ? (
          <div className="page-listing-meta-row">
            <p className="page-listing-meta">
              {total} {t(raw, "documents")}
            </p>
          </div>
        ) : null}

        <div className="page-listing-body">
          {!docsResult.ok ? (
            <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
          ) : docsResult.data.items.length === 0 ? (
            <EmptyState title={t(raw, "noDocuments")} />
          ) : (
            <DocumentList
              locale={raw}
              items={docsResult.data.items}
              emptyText={t(raw, "noDocuments")}
              variant="cards"
            />
          )}
        </div>

        {docsResult.ok ? (
          <Pagination
            page={docsResult.data.page}
            perPage={perPage}
            total={docsResult.data.total}
            pathname={`/${raw}/documents`}
            query={{
              q: sp.q,
              category: sp.category,
              year: sp.year,
            }}
            prevLabel={t(raw, "previous")}
            nextLabel={t(raw, "next")}
            perPageLabel={t(raw, "perPage")}
            perPageSizes={PER_PAGE_OPTIONS}
            defaultPerPage={DEFAULT_PER_PAGE}
          />
        ) : null}
      </div>
    </div>
  );
}
