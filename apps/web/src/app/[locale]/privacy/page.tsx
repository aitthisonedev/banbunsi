import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { privacyContent } from "@/lib/static-pages";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const c = privacyContent(raw);

  return (
    <div className="page-static">
      <h1>{t(raw, "privacy")}</h1>
      <p className="lead">{c.lead}</p>

      {c.sections.map((section) => (
        <section key={section.title} className="static-section">
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}
