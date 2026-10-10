import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState } from "@/components/ui";
import { getDocuments } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  const { q } = await searchParams;
  if (!isLocale(raw)) notFound();

  const query = (q || "").trim();
  const result = query
    ? await getDocuments(raw, { q: query, per_page: 40 })
        .then((data) => ({ ok: true as const, data }))
        .catch(() => ({ ok: false as const }))
    : null;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "search")}</h1>
      <form className="doc-filters mt-6" method="get" action={`/${raw}/search`}>
        <label className="doc-filter-field grow">
          <span className="sr-only">{t(raw, "search")}</span>
          <input
            className="input"
            name="q"
            defaultValue={query}
            placeholder={t(raw, "searchPlaceholder")}
          />
        </label>
        <button className="btn-primary" type="submit">
          {t(raw, "search")}
        </button>
      </form>

      <div className="mt-8 surface-panel">
        {!query ? (
          <EmptyState title={t(raw, "searchHint")} />
        ) : !result?.ok ? (
          <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
        ) : result.data.items.length === 0 ? (
          <EmptyState title={t(raw, "noDocuments")} />
        ) : (
          <DocumentList
            locale={raw}
            items={result.data.items}
            emptyText={t(raw, "noDocuments")}
          />
        )}
      </div>
      <p className="mt-6">
        <Link href={`/${raw}/documents`} className="section-link">
          {t(raw, "viewAllDocuments")}
        </Link>
      </p>
    </div>
  );
}
