"use client";

import { usePathname } from "next/navigation";
import type { Locale, PublicSettings } from "@/lib/api";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter locale={locale} settings={settings} />
    </>
  );
}
