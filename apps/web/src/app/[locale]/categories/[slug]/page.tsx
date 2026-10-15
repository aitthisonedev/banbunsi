import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState } from "@/components/ui";
import { getCategories, getDocuments, type CategoryNode } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";

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

function findCategoryByCode(
  items: CategoryNode[],
  code: string,
): CategoryNode | undefined {
  for (const c of items) {
    if (c.code === code) return c;
    const child = findCategoryByCode(c.children || [], code);
    if (child) return child;
  }
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(locale)) return {};
  const cats = await getCategories(locale).catch(() => null);
  const category = cats ? findCategory(cats.items, slug) : undefined;
  return pageMetadata(
    locale,
    `/categories/${encodeURIComponent(slug)}`,
    category?.name || t(locale, "categories"),
    category?.description || undefined,
  );
}

function findCategoryById(
  items: CategoryNode[],
  id: string,
): CategoryNode | undefined {
  for (const c of items) {
    if (c.id === id) return c;
    const child = findCategoryById(c.children || [], id);
    if (child) return child;
  }
  return undefined;
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(raw)) notFound();

  const cats = await getCategories(raw).catch(() => null);
  if (!cats) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-5">
        <ErrorState
          title={t(raw, "loadError")}
          description={t(raw, "tryAgain")}
        />
      </div>
    );
  }

  const cat = findCategory(cats.items, slug);
  if (!cat) {
    // Links that only know a category's code (e.g. the footer's "Latest articles" → "knowledge")
    // go to this language's slug for it.
    const byCode = findCategoryByCode(cats.items, slug);
    if (byCode)
      redirect(`/${raw}/categories/${encodeURIComponent(byCode.slug)}`);
    // Category slugs differ per language (e.g. "accounting" / "kan-banchi"). When the language
    // switcher keeps the other language's slug, redirect to this language's slug instead of a 404.
    const other = raw === "lo" ? "en" : "lo";
    const otherCats = await getCategories(other).catch(() => null);
    const match = otherCats ? findCategory(otherCats.items, slug) : undefined;
    const localized = match
      ? findCategoryById(cats.items, match.id)
      : undefined;
    if (localized)
      redirect(`/${raw}/categories/${encodeURIComponent(localized.slug)}`);
    notFound();
  }

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
      {cat.description ? (
        <p className="mt-4 text-bb-text-muted">{cat.description}</p>
      ) : null}
      <div className="mt-8 surface-panel">
        {!docs ? (
          <ErrorState title={t(raw, "loadError")} />
        ) : docs.items.length === 0 ? (
          <EmptyState title={t(raw, "noDocuments")} />
        ) : (
          <DocumentList
            locale={raw}
            items={docs.items}
            emptyText={t(raw, "noDocuments")}
          />
        )}
      </div>
    </div>
  );
}
