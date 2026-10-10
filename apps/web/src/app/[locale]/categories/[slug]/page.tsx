import { notFound } from "next/navigation";
import { getCategories } from "@/lib/api";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <p className="text-sm text-bb-text-muted">{t(raw, "categories")}</p>
      <h1 className="mt-2 text-3xl font-bold">{cat.name}</h1>
      <p className="mt-4 text-bb-text-muted">{cat.description}</p>
      <p className="mt-8 text-sm text-bb-text-muted">{t(raw, "comingSoon")}</p>
    </div>
  );
}
