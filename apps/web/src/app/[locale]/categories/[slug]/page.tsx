import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { getCategories, getDocuments } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const { items } = await getCategories(raw);
  const cat = items.find((c) => c.slug === slug);
  if (!cat) notFound();

  const { items: docs } = await getDocuments(raw, {
    category: cat.slug,
    per_page: 40,
  }).catch(() => ({ items: [], total: 0, page: 1, per_page: 40 }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-5">
      <p className="text-sm text-bb-text-muted">{t(raw, "categories")}</p>
      <h1 className="mt-2 text-3xl font-bold">{cat.name}</h1>
      <p className="mt-4 text-bb-text-muted">{cat.description}</p>
      <div className="mt-8 surface-panel">
        <DocumentList locale={raw} items={docs} emptyText={t(raw, "noDocuments")} />
      </div>
    </div>
  );
}
