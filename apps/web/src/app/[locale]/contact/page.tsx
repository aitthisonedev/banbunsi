import { notFound } from "next/navigation";
import { getPublicSettings, whatsappLink } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getPublicSettings().catch(() => null);

  return (
    <div className="page-static">
      <h1>{t(raw, "contact")}</h1>
      <p className="lead">{t(raw, "contactLead")}</p>
      {settings ? (
        <ul className="contact-list">
          <li>
            <a href={`mailto:${settings.contact_email}`}>
              {t(raw, "email")} — {settings.contact_email}
            </a>
          </li>
          <li>
            <a
              href={whatsappLink(settings.whatsapp_number)}
              target="_blank"
              rel="noreferrer"
            >
              {t(raw, "whatsapp")} — {settings.whatsapp_number}
            </a>
          </li>
          <li>
            <a href={settings.facebook_url} target="_blank" rel="noreferrer">
              {t(raw, "facebook")} — BAN BUNSI
            </a>
          </li>
          <li>
            <a href={settings.tiktok_url} target="_blank" rel="noreferrer">
              {t(raw, "tiktok")} — @banaccounting
            </a>
          </li>
        </ul>
      ) : (
        <p className="lead">{t(raw, "loadError")}</p>
      )}
    </div>
  );
}
