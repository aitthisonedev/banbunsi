import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { EmptyState, ErrorState } from "@/components/ui";
import {
  getCategories,
  getDocuments,
  type CategoryNode,
  type Locale,
} from "@/lib/api";
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
  const otherLocale: Locale = locale === "lo" ? "en" : "lo";
  const [cats, otherCats] = await Promise.all([
    getCategories(locale).catch(() => null),
    getCategories(otherLocale).catch(() => null),
  ]);
  const category = cats ? findCategory(cats.items, slug) : undefined;
  const translatedCategory =
    category && otherCats
      ? findCategoryById(otherCats.items, category.id)
      : undefined;
  const alternatePaths: Partial<Record<Locale, string>> = {
    [locale]: `/categories/${encodeURIComponent(slug)}`,
  };
  if (translatedCategory) {
    alternatePaths[otherLocale] = `/categories/${encodeURIComponent(
      translatedCategory.slug,
    )}`;
  }
  return pageMetadata(
    locale,
    `/categories/${encodeURIComponent(slug)}`,
    category?.name || t(locale, "categories"),
    category?.description || undefined,
    { alternatePaths },
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
      <div className="page-listing page-category-detail">
        <div className="page-listing-inner">
          <ErrorState
            title={t(raw, "loadError")}
            description={t(raw, "tryAgain")}
          />
        </div>
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

  const lead =
    cat.description &&
    cat.description.trim() &&
    cat.description.trim() !== cat.name.trim()
      ? cat.description.trim()
      : null;
  const docCount = docs?.total ?? docs?.items.length ?? 0;

  return (
    <div className="page-listing page-category-detail">
      <div className="page-listing-inner">
        <header className="cat-detail-head">
          <h1 className="cat-detail-title">{cat.name}</h1>
          <div className="cat-detail-row">
            <Link href={`/${raw}/categories`} className="cat-detail-eyebrow">
              {t(raw, "categories")}
            </Link>
            <p className="cat-detail-meta">
              {raw === "lo"
                ? `${docCount} ເອກະສານ`
                : `${docCount} document${docCount === 1 ? "" : "s"}`}
            </p>
          </div>
          {lead ? <p className="cat-detail-lead">{lead}</p> : null}
        </header>

        <div className="page-listing-body">
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
    </div>
  );
}
