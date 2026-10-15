import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getPublicSettings } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getPublicSettings().catch(() => null);
  const siteName =
    (locale === "en" ? settings?.site_name_en : settings?.site_name_lo) ||
    "BAN BUNSI";
  return {
    ...pageMetadata(locale, "/admin", undefined, undefined, { noindex: true }),
    // Admin pages set their own title ("Settings") and keep the site-name suffix.
    title: {
      absolute: `${t(locale, "dashboard")} | ${siteName}`,
      template: `%s | ${siteName}`,
    },
  };
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return <AdminShell locale={raw}>{children}</AdminShell>;
}
