import type { MetadataRoute } from "next";
import {
  getCategories,
  getDocuments,
  getQuizzes,
  type CategoryNode,
  type Locale,
  type QuizListItem,
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
  const slugs: Array<{
    updated?: string;
    translations: Array<{ locale: string; slug: string }>;
  }> = [];
  for (let page = 1; page <= 50; page++) {
    const result = await getDocuments(locale, { page, per_page: 100 }).catch(
      () => null,
    );
    if (!result) break;
    slugs.push(
      ...result.items.map((doc) => ({
        updated: doc.updated_at,
        translations: (doc.translations || []).map(({ locale, slug }) => ({
          locale,
          slug,
        })),
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
  const categoryLists = new Map<Locale, CategoryNode[]>();
  const quizLists = new Map<Locale, QuizListItem[]>();

  await Promise.all(
    locales.map(async (locale) => {
      const [categories, quizzes] = await Promise.all([
        getCategories(locale).catch(() => null),
        getQuizzes(locale).catch(() => null),
      ]);
      categoryLists.set(locale, categories?.items || []);
      quizLists.set(locale, quizzes?.items || []);
    }),
  );
  const flattenedCategories = new Map(
    locales.map((locale) => [locale, flatten(categoryLists.get(locale) || [])]),
  );

  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: url(locale, path),
        changeFrequency:
          path === "" || path === "/documents" ? "daily" : "monthly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: {
            lo: url("lo", path),
            en: url("en", path),
            "x-default": url("lo", path),
          },
        },
      });
    }
  }

  for (const locale of locales) {
    for (const doc of await documentSlugs(locale)) {
      const localized = doc.translations.find(
        (translation) => translation.locale === locale,
      );
      if (!localized?.slug) continue;
      const languageUrls = Object.fromEntries(
        doc.translations
          .filter(
            (translation): translation is { locale: Locale; slug: string } =>
              (translation.locale === "lo" || translation.locale === "en") &&
              Boolean(translation.slug),
          )
          .map((translation) => [
            translation.locale,
            url(
              translation.locale,
              `/documents/${encodeURIComponent(translation.slug)}`,
            ),
          ]),
      );
      if (languageUrls.lo) languageUrls["x-default"] = languageUrls.lo;
      entries.push({
        url: url(locale, `/documents/${encodeURIComponent(localized.slug)}`),
        lastModified: doc.updated,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: languageUrls },
      });
    }
    for (const category of flattenedCategories.get(locale) || []) {
      if (category.is_active === false) continue;
      const languageUrls = Object.fromEntries(
        locales.flatMap((language) => {
          const translation = flattenedCategories
            .get(language)
            ?.find((candidate) => candidate.id === category.id);
          return translation
            ? [
                [
                  language,
                  url(
                    language,
                    `/categories/${encodeURIComponent(translation.slug)}`,
                  ),
                ],
              ]
            : [];
        }),
      );
      if (languageUrls.lo) languageUrls["x-default"] = languageUrls.lo;
      entries.push({
        url: url(locale, `/categories/${encodeURIComponent(category.slug)}`),
        changeFrequency: "weekly",
        priority: 0.5,
        alternates: { languages: languageUrls },
      });
    }
    const quizzes = new Map<string, QuizListItem | null>(
      (quizLists.get(locale) || []).map((quiz) => [quiz.slug, quiz]),
    );
    for (const quiz of listQuizzes(locale)) {
      if (!quizzes.has(quiz.slug)) quizzes.set(quiz.slug, null);
    }
    for (const [slug, quiz] of quizzes) {
      const localized = quiz?.translations?.find(
        (translation) => translation.locale === locale,
      );
      if (quiz && !localized?.slug) continue;
      const languageUrls = Object.fromEntries(
        quiz?.translations?.length
          ? quiz.translations
              .filter(
                (
                  translation,
                ): translation is { locale: Locale; slug: string } =>
                  (translation.locale === "lo" ||
                    translation.locale === "en") &&
                  Boolean(translation.slug),
              )
              .map((translation) => [
                translation.locale,
                url(
                  translation.locale,
                  `/quizzes/${encodeURIComponent(translation.slug)}`,
                ),
              ])
          : locales.map((language) => [
              language,
              url(language, `/quizzes/${encodeURIComponent(slug)}`),
            ]),
      );
      if (languageUrls.lo) languageUrls["x-default"] = languageUrls.lo;
      entries.push({
        url: url(
          locale,
          `/quizzes/${encodeURIComponent(localized?.slug || slug)}`,
        ),
        changeFrequency: "monthly",
        priority: 0.4,
        alternates: { languages: languageUrls },
      });
    }
  }
  return entries;
}
