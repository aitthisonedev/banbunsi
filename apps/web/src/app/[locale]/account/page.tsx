import { Suspense } from "react";
import { AccountHub } from "./account-hub";
import { LoadingState } from "@/components/ui";
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

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "lo";
  return (
    <Suspense
      fallback={
        <div className="account-shell">
          <div className="account-inner bb-content">
            <LoadingState label={t(locale, "loading")} />
          </div>
        </div>
      }
    >
      <AccountHub />
    </Suspense>
  );
}
