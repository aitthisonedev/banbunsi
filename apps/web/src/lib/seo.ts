import type { Metadata } from "next";
import { headers } from "next/headers";
import type { Locale } from "@/lib/api";

/** Public origin of the current request (behind nginx: X-Forwarded-Proto / Host). */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ||
    (host.startsWith("localhost") || host.startsWith("127.")
      ? "http"
      : "https");
  return `${proto.split(",")[0].trim()}://${host}`;
}

/**
 * Standard metadata for a localized page: a descriptive title, description, canonical URL and
 * hreflang alternates for both languages. `path` is the part after the locale, e.g. "/documents".
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  title?: string,
  description?: string,
  options: {
    noindex?: boolean;
    alternatePaths?: Partial<Record<Locale, string>>;
  } = {},
): Metadata {
  const languages: Record<string, string> = options.alternatePaths
    ? Object.fromEntries(
        Object.entries(options.alternatePaths)
          .filter((entry): entry is [Locale, string] => Boolean(entry[1]))
          .map(([language, alternatePath]) => [
            language,
            `/${language}${alternatePath}`,
          ]),
      )
    : {
        lo: `/lo${path}`,
        en: `/en${path}`,
        "x-default": `/lo${path}`,
      };
  if (options.alternatePaths?.lo) {
    languages["x-default"] = `/lo${options.alternatePaths.lo}`;
  }
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${locale}${path}`,
      languages,
    },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: `/${locale}${path}`,
      locale: locale === "en" ? "en_US" : "lo_LA",
      type: "website",
    },
    ...(options.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
