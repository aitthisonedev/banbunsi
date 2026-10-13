import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSettings, whatsappLink } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { vipContent } from "@/lib/static-pages";

export default async function VipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const c = vipContent(raw);
  const settings = await getPublicSettings().catch(() => null);

  return (
    <div className="page-static">
      <h1>{t(raw, "vip")}</h1>
      <p className="lead">{c.lead}</p>

      <section className="static-section">
        <h2>{c.compareTitle}</h2>
        <div className="vip-compare">
          <div className="vip-compare-col">
            <h3>{c.memberLabel}</h3>
            <ul className="static-checklist">
              {c.memberPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="vip-compare-col vip-compare-col--vip">
            <h3>{c.vipLabel}</h3>
            <ul className="static-checklist">
              {c.vipPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="static-section">
        <div className="vip-benefits">
          {c.benefits.map((b) => (
            <article key={b.title} className="vip-benefit">
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="static-cta-band">
        <h2>{c.ctaTitle}</h2>
        <p>{c.ctaLead}</p>
        <div className="static-cta-row">
          {settings ? (
            <>
              <a
                className="btn-primary"
                href={whatsappLink(settings.whatsapp_number)}
                target="_blank"
                rel="noreferrer"
              >
                {t(raw, "whatsapp")}
              </a>
              <a
                className="btn-secondary"
                href={`mailto:${settings.contact_email}`}
              >
                {t(raw, "email")}
              </a>
            </>
          ) : (
            <Link className="btn-primary" href={`/${raw}/contact`}>
              {t(raw, "contact")}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
