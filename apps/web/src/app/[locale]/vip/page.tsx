import { notFound } from "next/navigation";
import { getPublicSettings, whatsappLink } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function VipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getPublicSettings().catch(() => null);

  return (
    <div className="page-static">
      <h1>{t(raw, "vip")}</h1>
      <p className="lead">{t(raw, "vipBody")}</p>
      {settings ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn-primary" href={`mailto:${settings.contact_email}`}>
            {t(raw, "email")}
          </a>
          <a
            className="btn-secondary"
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noreferrer"
          >
            {t(raw, "whatsapp")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
