import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticPage, staticPageMetadata } from "@/components/static-page";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? staticPageMetadata(locale, "faq") : {};
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <StaticPage locale={locale} id="faq" />;
}
