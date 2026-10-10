import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSettings } from "@/lib/api";
import { isLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const settings = await getPublicSettings().catch(() => ({
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
    <div lang={raw} className={raw === "lo" ? "font-lao flex min-h-screen flex-col" : "flex min-h-screen flex-col"}>
      <SiteHeader locale={raw} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={raw} settings={settings} />
    </div>
  );
}
