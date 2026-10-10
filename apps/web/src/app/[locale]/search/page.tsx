import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
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
  const { items } = query
    ? await getDocuments(raw, { q: query, per_page: 40 }).catch(() => ({
        items: [],
        total: 0,
        page: 1,
        per_page: 40,
      }))
    : { items: [] };

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
          <p className="text-muted">{t(raw, "searchHint")}</p>
        ) : (
          <DocumentList locale={raw} items={items} emptyText={t(raw, "noDocuments")} />
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
