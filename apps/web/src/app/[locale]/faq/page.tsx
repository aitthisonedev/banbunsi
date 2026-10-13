import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/faq-accordion";
import { getPublicSettings, whatsappLink } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { faqContent } from "@/lib/static-pages";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const c = faqContent(raw);
  const settings = await getPublicSettings().catch(() => null);

  return (
    <div className="page-static">
      <h1>{t(raw, "faq")}</h1>
      <p className="lead">{c.lead}</p>

      <div className="static-section">
        <FaqAccordion items={[...c.items]} />
      </div>

      <section className="static-cta-band">
        <h2>{c.contactTitle}</h2>
        <p>{c.contactLead}</p>
        <div className="static-cta-row">
          <Link className="btn-primary" href={`/${raw}/contact`}>
            {t(raw, "contact")}
          </Link>
          {settings ? (
            <a
              className="btn-secondary"
              href={whatsappLink(settings.whatsapp_number)}
              target="_blank"
              rel="noreferrer"
            >
              {t(raw, "whatsapp")}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
