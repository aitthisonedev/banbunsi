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
  const settings = await getPublicSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "vip")}</h1>
      <p className="mt-4 text-bb-text-muted">
        VIP membership unlocks premium documents. Contact the owner to request access. Online payment is not available in this release.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="btn-primary" href={`mailto:${settings.contact_email}`}>
          Email
        </a>
        <a
          className="btn-secondary"
          href={whatsappLink(settings.whatsapp_number)}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
