import { notFound } from "next/navigation";
import { getPublicSettings, whatsappLink } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

type ContactItem = { label: string; value: string; href?: string; external?: boolean };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/contact", t(locale, "contact"), t(locale, "contactLead"));
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getPublicSettings().catch(() => null);

  // Only list the channels an admin has filled in under Settings → Contact.
  const items: ContactItem[] = settings
    ? ([
        settings.contact_email && { label: t(raw, "email"), value: settings.contact_email, href: `mailto:${settings.contact_email}` },
        settings.contact_phone && { label: t(raw, "phone"), value: settings.contact_phone, href: `tel:${settings.contact_phone.replace(/[^\d+]/g, "")}` },
        settings.whatsapp_number && { label: t(raw, "whatsapp"), value: settings.whatsapp_number, href: whatsappLink(settings.whatsapp_number), external: true },
        settings.address && { label: t(raw, "address"), value: settings.address },
        settings.website && { label: t(raw, "website"), value: settings.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: settings.website, external: true },
        settings.facebook_url && { label: t(raw, "facebook"), value: settings.organization_name || "Facebook", href: settings.facebook_url, external: true },
        settings.tiktok_url && { label: t(raw, "tiktok"), value: settings.tiktok_url.match(/@[\w.]+/)?.[0] || "TikTok", href: settings.tiktok_url, external: true },
      ] as Array<ContactItem | "" | undefined>).filter((item): item is ContactItem => Boolean(item))
    : [];

  return (
    <div className="page-static">
      <h1>{t(raw, "contact")}</h1>
      <p className="lead">{t(raw, "contactLead")}</p>
      {settings ? (
        <ul className="contact-list">
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <a href={item.href} {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                  {item.label} — {item.value}
                </a>
              ) : (
                <span className="whitespace-pre-line">{item.label} — {item.value}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="lead">{t(raw, "loadError")}</p>
      )}
    </div>
  );
}
