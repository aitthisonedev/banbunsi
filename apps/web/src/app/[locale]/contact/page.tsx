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
  const settings = await getPublicSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(raw, "contact")}</h1>
      <p className="mt-3 text-bb-text-muted">BAN BUNSI</p>
      <ul className="mt-8 space-y-4 text-base">
        <li>
          <a className="text-bb-blue hover:underline" href={`mailto:${settings.contact_email}`}>
            Email — {settings.contact_email}
          </a>
        </li>
        <li>
          <a
            className="text-bb-blue hover:underline"
            href={whatsappLink(settings.whatsapp_number)}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp — {settings.whatsapp_number}
          </a>
        </li>
        <li>
          <a className="text-bb-blue hover:underline" href={settings.facebook_url} target="_blank" rel="noreferrer">
            Facebook — BAN BUNSI
          </a>
        </li>
        <li>
          <a className="text-bb-blue hover:underline" href={settings.tiktok_url} target="_blank" rel="noreferrer">
            TikTok — @banaccounting
          </a>
        </li>
      </ul>
    </div>
  );
}
