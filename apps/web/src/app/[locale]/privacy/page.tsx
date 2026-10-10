import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "privacy")}</h1>
      <p className="mt-4 text-bb-text-muted">
        Privacy policy content will be provided by the site owner. Placeholder for Foundation.
      </p>
    </div>
  );
}
