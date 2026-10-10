import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState } from "@/components/ui";
import { getCategories, getDocuments, type CategoryNode } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

function findCategory(items: CategoryNode[], slug: string): CategoryNode | undefined {
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
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-5">
        <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
      </div>
    );
  }

  const cat = findCategory(cats.items, slug);
  if (!cat) notFound();

  const docs = await getDocuments(raw, {
    category: cat.slug,
    per_page: 40,
  }).catch(() => null);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-5">
      <p className="text-sm text-bb-text-muted">
        <Link href={`/${raw}/categories`} className="section-link">
          {t(raw, "categories")}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold">{cat.name}</h1>
      {cat.description ? <p className="mt-4 text-bb-text-muted">{cat.description}</p> : null}
      <div className="mt-8 surface-panel">
        {!docs ? (
          <ErrorState title={t(raw, "loadError")} />
        ) : docs.items.length === 0 ? (
          <EmptyState title={t(raw, "noDocuments")} />
        ) : (
          <DocumentList locale={raw} items={docs.items} emptyText={t(raw, "noDocuments")} />
        )}
      </div>
    </div>
  );
}
