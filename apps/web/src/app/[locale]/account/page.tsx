import { AccountHub } from "./account-hub";
import type { Metadata } from "next";
import { isLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/account", t(locale, "account"), undefined, {
    noindex: true,
  });
}

export default function AccountPage() {
  return <AccountHub />;
}
