import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { getPublicSettings, type PublicSettings } from "@/lib/api";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings().catch(() => null);
  const siteName = locale === "en"
    ? settings?.site_name_en || "BAN BUNSI"
    : settings?.site_name_lo || "BAN BUNSI";
  return {
    title: settings?.application_title || siteName,
    description: locale === "en"
      ? settings?.default_meta_description_en
      : settings?.default_meta_description_lo,
    icons: settings?.favicon_url ? { icon: settings.favicon_url } : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getPublicSettings().catch((): PublicSettings => ({
    site_name_lo: "BAN BUNSI",
    site_name_en: "BAN BUNSI",
    timezone: "Asia/Vientiane",
    contact_email: "banbunsi26@gmail.com",
    whatsapp_number: "+8562058444184",
    facebook_url: "https://www.facebook.com/profile.php?id=100080330433345",
    tiktok_url: "https://www.tiktok.com/@banaccounting",
    default_meta_description_lo: "",
    default_meta_description_en: "",
  }));

  return (
    <div
      lang={raw}
      style={{
        "--bb-blue": settings.primary_color || "#0036ad",
        "--bb-blue-hover": settings.primary_color || "#002c8e",
        "--bb-navy": settings.secondary_color || "#061644",
        "--bb-footer-bg": settings.secondary_color || "#0b1f6b",
        "--bb-green": settings.accent_color || "#27ae60",
        "--bb-green-hover": settings.accent_color || "#219150",
      } as CSSProperties}
      className={
        raw === "lo"
          ? "font-lao flex min-h-screen flex-col"
          : "flex min-h-screen flex-col"
      }
    >
      <SiteChrome locale={raw} settings={settings}>
        {children}
      </SiteChrome>
    </div>
  );
}
