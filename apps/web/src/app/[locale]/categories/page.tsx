import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const { items } = await getCategories(raw);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "categories")}</h1>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((cat) => (
          <li key={cat.id} className="card-soft p-4">
            <Link
              href={`/${raw}/categories/${cat.slug}`}
              className="font-semibold text-bb-blue hover:underline"
            >
              {cat.name}
            </Link>
            {cat.description && (
              <p className="mt-1 text-sm text-bb-text-muted">{cat.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
