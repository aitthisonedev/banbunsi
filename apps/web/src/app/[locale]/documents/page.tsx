import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { getCategories, getDocuments } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; year?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();

  const year = sp.year ? Number(sp.year) : undefined;
  const [{ items }, { items: categories }] = await Promise.all([
    getDocuments(raw, {
      q: sp.q,
      category: sp.category,
      year: Number.isFinite(year) ? year : undefined,
      per_page: 40,
    }).catch(() => ({ items: [], total: 0, page: 1, per_page: 40 })),
    getCategories(raw).catch(() => ({ items: [] })),
  ]);

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
          <input className="input" name="q" defaultValue={sp.q || ""} placeholder={t(raw, "searchPlaceholder")} />
        </label>
        <label className="doc-filter-field">
          <span>{t(raw, "categories")}</span>
          <select className="input" name="category" defaultValue={sp.category || ""}>
            <option value="">{t(raw, "allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="doc-filter-field">
          <span>{t(raw, "year")}</span>
          <input className="input" name="year" type="number" defaultValue={sp.year || ""} placeholder="2026" />
        </label>
        <button className="btn-primary" type="submit">
          {t(raw, "filter")}
        </button>
      </form>

      <div className="mt-8 surface-panel">
        <DocumentList locale={raw} items={items} emptyText={t(raw, "noDocuments")} />
      </div>
    </div>
  );
}
