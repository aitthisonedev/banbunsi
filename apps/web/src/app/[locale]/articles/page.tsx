import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { getDocuments } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { articlesContent } from "@/lib/static-pages";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const c = articlesContent(raw);

  const docsResult = await getDocuments(raw, { page: 1, per_page: 8 })
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  return (
    <div className="page-static">
      <h1>{t(raw, "latestArticles")}</h1>
      <p className="lead">{c.lead}</p>

      <section className="static-section">
        <h2>{c.editorialTitle}</h2>
        <div className="editorial-grid">
          {c.items.map((item) => (
            <article key={item.slug} id={item.slug} className="editorial-card">
              <span className="editorial-tag">{item.tag}</span>
              <h3>{item.title}</h3>
              <p className="editorial-summary">{item.summary}</p>
              <p className="editorial-body">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="static-section">
        <div className="static-section-head">
          <h2>{c.libraryTitle}</h2>
          <Link className="static-section-link" href={`/${raw}/documents`}>
            {c.viewAll}
          </Link>
        </div>
        {docsResult.ok ? (
          <DocumentList
            locale={raw}
            items={docsResult.data.items}
            emptyText={t(raw, "noDocuments")}
          />
        ) : (
          <p className="lead">{t(raw, "loadError")}</p>
        )}
      </section>
    </div>
  );
}
