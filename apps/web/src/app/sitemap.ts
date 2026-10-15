import type { MetadataRoute } from "next";
import {
  getCategories,
  getDocuments,
  getQuizzes,
  type CategoryNode,
  type Locale,
} from "@/lib/api";
import { locales } from "@/lib/i18n";
import { listQuizzes } from "@/lib/quizzes";
import { siteOrigin } from "@/lib/seo";

/** Public pages that exist in both languages under the same path. */
const STATIC_PATHS = [
  "",
  "/documents",
  "/categories",
  "/quizzes",
  "/vip",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];

function flatten(items: CategoryNode[]): CategoryNode[] {
  return items.flatMap((item) => [item, ...flatten(item.children || [])]);
}

async function documentSlugs(locale: Locale) {
  const slugs: Array<{ slug: string; updated?: string }> = [];
  for (let page = 1; page <= 50; page++) {
    const result = await getDocuments(locale, { page, per_page: 100 }).catch(
      () => null,
    );
    if (!result) break;
    slugs.push(
      ...result.items.map((doc) => ({
        slug: doc.slug,
        updated: doc.updated_at,
      })),
    );
    if (result.items.length < 100) break;
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const url = (locale: Locale, path: string) => `${origin}/${locale}${path}`;
  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: url(locale, path),
        changeFrequency:
          path === "" || path === "/documents" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.7,
        alternates: { languages: { lo: url("lo", path), en: url("en", path) } },
      });
    }
  }

  for (const locale of locales) {
    for (const doc of await documentSlugs(locale)) {
      if (!doc.slug) continue;
      entries.push({
        url: url(locale, `/documents/${encodeURIComponent(doc.slug)}`),
        lastModified: doc.updated,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    const categories = await getCategories(locale).catch(() => null);
    for (const category of flatten(categories?.items || [])) {
      if (category.is_active === false) continue;
      entries.push({
        url: url(locale, `/categories/${encodeURIComponent(category.slug)}`),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    const quizzes = await getQuizzes(locale).catch(() => null);
    const quizSlugs = new Set([
      ...(quizzes?.items || []).map((quiz) => quiz.slug),
      ...listQuizzes(locale).map((quiz) => quiz.slug),
    ]);
    for (const slug of quizSlugs) {
      entries.push({
        url: url(locale, `/quizzes/${encodeURIComponent(slug)}`),
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  }
  return entries;
}
