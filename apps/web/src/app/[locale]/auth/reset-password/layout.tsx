import type { Metadata } from "next";
import { isLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

// Gives this client-rendered page a descriptive title (WCAG 2.4.2); not indexed by search engines.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(
    locale,
    "/auth/reset-password",
    t(locale, "resetPassword"),
    undefined,
    { noindex: true },
  );
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
