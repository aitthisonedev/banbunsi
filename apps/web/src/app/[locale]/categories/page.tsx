import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui";
import { getCategories } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const result = await getCategories(raw)
    .then((data) => ({ ok: true as const, data }))
    .catch(() => ({ ok: false as const }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "categories")}</h1>
      {!result.ok ? (
        <div className="mt-8">
          <ErrorState title={t(raw, "loadError")} description={t(raw, "tryAgain")} />
        </div>
      ) : result.data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t(raw, "noCategories")} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {result.data.items.map((cat) => (
            <li key={cat.id} className="card-soft">
              <Link
                href={`/${raw}/categories/${cat.slug}`}
                className="font-semibold text-bb-blue hover:underline"
              >
                {cat.name}
              </Link>
              {cat.description ? (
                <p className="mt-1 text-sm text-bb-text-muted">{cat.description}</p>
              ) : null}
              {cat.children?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/${raw}/categories/${child.slug}`} className="chip">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
