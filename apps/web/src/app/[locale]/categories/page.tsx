import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryCards } from "@/components/category-cards";
import { EmptyState, ErrorState } from "@/components/ui";
import { getCategories, getDocuments } from "@/lib/api";
import { categoriesOrDemo } from "@/lib/demo-categories";
import { isLocale, t } from "@/lib/i18n";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const [catResult, docs] = await Promise.all([
    getCategories(raw)
      .then((data) => ({ ok: true as const, data }))
      .catch(() => ({ ok: false as const })),
    getDocuments(raw, { per_page: 100 }).catch(() => null),
  ]);

  const apiItems = catResult.ok ? catResult.data.items : [];
  const { items } = categoriesOrDemo(raw, apiItems);
  const counts: Record<string, number> = {};
  for (const doc of docs?.items || []) {
    if (!doc.category_slug) continue;
    counts[doc.category_slug] = (counts[doc.category_slug] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">{t(raw, "categories")}</h1>
        <Link href={`/${raw}/documents`} className="section-link">
          {t(raw, "viewAllDocuments")}
        </Link>
      </div>
      {!catResult.ok && items.length === 0 ? (
        <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
      ) : items.length === 0 ? (
        <EmptyState title={t(raw, "noCategories")} />
      ) : (
        <CategoryCards locale={raw} items={items} counts={counts} />
      )}
    </div>
  );
}
