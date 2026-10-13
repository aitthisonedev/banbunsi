import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";
import { aboutContent } from "@/lib/static-pages";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const c = aboutContent(raw);

  return (
    <div className="page-static">
      <h1>{t(raw, "about")}</h1>
      <p className="lead">{c.lead}</p>

      <section className="static-section">
        <h2>{c.missionTitle}</h2>
        <p>{c.mission}</p>
      </section>

      <section className="static-section">
        <h2>{c.forTitle}</h2>
        <ul className="static-checklist">
          {c.forItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="static-section">
        <h2>{c.doTitle}</h2>
        <ul className="static-checklist">
          {c.doItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="static-cta-row">
        <Link className="btn-primary" href={`/${raw}/documents`}>
          {c.ctaDocs}
        </Link>
        <Link className="btn-secondary" href={`/${raw}/contact`}>
          {c.ctaContact}
        </Link>
      </div>
    </div>
  );
}
