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
    <div className="page-static">
      <h1>{t(raw, "privacy")}</h1>
      <p className="lead">{t(raw, "privacyBody")}</p>
    </div>
  );
}
