import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  const { q } = await searchParams;
  if (!isLocale(raw)) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "search")}</h1>
      <p className="mt-4 text-bb-text-muted">
        Query: {q || "—"} — {t(raw, "comingSoon")}
      </p>
    </div>
  );
}
