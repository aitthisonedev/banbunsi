import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { SiteChrome } from "@/components/site-chrome";
import { getPublicSettings, type PublicSettings } from "@/lib/api";
import { isLocale } from "@/lib/i18n";
import { siteOrigin } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getPublicSettings().catch(() => null);
  const siteName =
    locale === "en"
      ? settings?.site_name_en || "BAN BUNSI"
      : settings?.site_name_lo || "BAN BUNSI";
  const homeTitle =
    (locale === "en"
      ? settings?.default_seo_title_en
      : settings?.default_seo_title_lo) ||
    settings?.application_title ||
    siteName;
  return {
    metadataBase: new URL(await siteOrigin()),
    // Pages set their own title ("Documents") and get " | Site name"; pages without one use the home title.
    title: { absolute: homeTitle, template: `%s | ${siteName}` },
    description:
      (locale === "en"
        ? settings?.default_meta_description_en
        : settings?.default_meta_description_lo) || undefined,
    applicationName: siteName,
    openGraph: { siteName },
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
      data-brand=""
      style={
        {
          // Brand colors from Settings; globals.css applies them in light mode only so dark mode keeps accessible contrast.
          ...(settings.primary_color
            ? { "--brand-primary": settings.primary_color }
            : {}),
          ...(settings.secondary_color
            ? { "--brand-secondary": settings.secondary_color }
            : {}),
          ...(settings.accent_color
            ? { "--brand-accent": settings.accent_color }
            : {}),
        } as CSSProperties
      }
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
