import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { Reveal } from "@/components/reveal";
import { EmptyState, ErrorState } from "@/components/ui";
import { getCategories, getDocuments, type CategoryNode } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

function findCategory(
  items: CategoryNode[],
  slug: string,
): CategoryNode | undefined {
  for (const c of items) {
    if (c.slug === slug) return c;
    const child = findCategory(c.children || [], slug);
    if (child) return child;
  }
  return undefined;
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();

  const cats = await getCategories(raw).catch(() => null);
  if (!cats) {
    return (
      <div className="detail-page">
        <div className="detail-shell">
          <ErrorState
            title={t(raw, "loadError")}
            description={t(raw, "tryAgain")}
          />
        </div>
      </div>
    );
  }

  const cat = findCategory(cats.items, slug);
  if (!cat) notFound();

  const docs = await getDocuments(raw, {
    category: cat.slug,
    per_page: 40,
  }).catch(() => null);

  const count = docs?.total ?? docs?.items.length ?? 0;

  return (
    <div className="detail-page">
      <div className="detail-shell">
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${raw}`} className="detail-breadcrumb-link">
            {t(raw, "home")}
          </Link>
          <span className="detail-breadcrumb-sep" aria-hidden>
            /
          </span>
          <Link href={`/${raw}/categories`} className="detail-breadcrumb-link">
            {t(raw, "categories")}
          </Link>
          <span className="detail-breadcrumb-sep" aria-hidden>
            /
          </span>
          <span className="detail-breadcrumb-current">{cat.name}</span>
        </nav>

        <Reveal as="section" className="detail-hero detail-hero--compact">
          <div className="detail-hero-meta">
            <div className="detail-hero-meta-main">
              <span className="detail-hero-cat">{t(raw, "categories")}</span>
              <span className="detail-hero-docnum">
                · {count} {t(raw, "documents")}
              </span>
            </div>
            <Link href={`/${raw}/categories`} className="detail-back-link">
              {t(raw, "viewAllCategories")} →
            </Link>
          </div>

          <h1 className="detail-hero-title">{cat.name}</h1>

          {cat.description &&
          cat.description.trim().toLowerCase() !==
            cat.name.trim().toLowerCase() ? (
            <p className="detail-hero-lead">{cat.description}</p>
          ) : null}
        </Reveal>

        <Reveal as="section" className="detail-panel" delay={40} stagger>
          <div className="detail-panel-head">
            <h2 className="detail-panel-title">{t(raw, "documents")}</h2>
          </div>
          {!docs ? (
            <ErrorState title={t(raw, "loadError")} />
          ) : docs.items.length === 0 ? (
            <EmptyState title={t(raw, "noDocuments")} />
          ) : (
            <DocumentList
              locale={raw}
              items={docs.items}
              emptyText={t(raw, "noDocuments")}
              variant="cards"
            />
          )}
        </Reveal>
      </div>
    </div>
  );
}
