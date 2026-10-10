import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState, Pagination, Select } from "@/components/ui";
import { getCategories, getDocuments } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

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
  }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();

  const year = sp.year ? Number(sp.year) : undefined;
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const perPage = 20;

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

  const categories = catsResult.ok ? catsResult.data.items : [];

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.category) params.set("category", sp.category);
    if (sp.year) params.set("year", sp.year);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return `/${raw}/documents${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(raw, "documents")}</h1>
          <p className="mt-2 text-bb-text-muted">{t(raw, "documentsLead")}</p>
        </div>
        <Link href={`/${raw}/search`} className="section-link">
          {t(raw, "search")}
        </Link>
      </div>

      <form className="doc-filters" method="get">
        <label className="doc-filter-field">
          <span>{t(raw, "search")}</span>
          <input
            className="input"
            name="q"
            defaultValue={sp.q || ""}
            placeholder={t(raw, "searchPlaceholder")}
          />
        </label>
        <label className="doc-filter-field">
          <span>{t(raw, "categories")}</span>
          <Select
            name="category"
            aria-label={t(raw, "categories")}
            defaultValue={sp.category || ""}
            options={[
              { value: "", label: t(raw, "allCategories") },
              ...categories.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
        </label>
        <label className="doc-filter-field doc-filter-field--year">
          <span>{t(raw, "year")}</span>
          <input
            className="input"
            name="year"
            type="number"
            defaultValue={sp.year || ""}
            placeholder="2026"
          />
        </label>
        <button className="btn-primary" type="submit">
          {t(raw, "filter")}
        </button>
      </form>

      <div className="mt-8">
        {!docsResult.ok ? (
          <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
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
          perPage={docsResult.data.per_page}
          total={docsResult.data.total}
          hrefFor={hrefFor}
          prevLabel={t(raw, "previous")}
          nextLabel={t(raw, "next")}
        />
      ) : null}
    </div>
  );
}
