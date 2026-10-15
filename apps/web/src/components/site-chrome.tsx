"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Locale, PublicSettings } from "@/lib/api";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicSettingsProvider } from "@/components/public-settings-context";

export function SiteChrome({
  locale,
  settings,
  children,
}: {
  locale: Locale;
  settings: PublicSettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isAdmin = /\/admin(\/|$)/.test(pathname);

  // The root layout sets <html lang> on the first load only; switching language navigates on
  // the client, so keep it in step with the URL for screen readers and Lao/English fonts.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  if (isAdmin) {
    return (
      <PublicSettingsProvider initial={settings}>
        {children}
      </PublicSettingsProvider>
    );
  }

  return (
    <PublicSettingsProvider initial={settings}>
      <SiteHeader locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter locale={locale} settings={settings} />
    </PublicSettingsProvider>
  );
}
