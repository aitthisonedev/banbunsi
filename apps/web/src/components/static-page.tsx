import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPublicSettings, type Locale } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import {
  fillPlaceholders,
  staticPageContent,
  type StaticPageId,
} from "@/lib/static-pages";

const PATHS: Record<StaticPageId, string> = {
  about: "/about",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
};

async function placeholderValues(locale: Locale) {
  const settings = await getPublicSettings().catch(() => null);
  const siteName =
    (locale === "en" ? settings?.site_name_en : settings?.site_name_lo) ||
    "BAN BUNSI";
  return {
    org: settings?.organization_name || siteName,
    email: settings?.contact_email || "banbunsi26@gmail.com",
  };
}

export async function staticPageMetadata(
  locale: Locale,
  id: StaticPageId,
): Promise<Metadata> {
  const content = staticPageContent(locale, id);
  const values = await placeholderValues(locale);
  return pageMetadata(
    locale,
    PATHS[id],
    fillPlaceholders(content.title, values),
    fillPlaceholders(content.description, values),
  );
}

/** Renders [text](/path) links and the contact email as real links. */
function richText(text: string, locale: Locale, email: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const pushText = (value: string) => {
    if (!email || !value.includes(email)) {
      if (value) parts.push(value);
      return;
    }
    value.split(email).forEach((piece, index, all) => {
      if (piece) parts.push(piece);
      if (index < all.length - 1)
        parts.push(
          <a key={`mail-${parts.length}`} href={`mailto:${email}`}>
            {email}
          </a>,
        );
    });
  };
  while ((match = pattern.exec(text))) {
    pushText(text.slice(last, match.index));
    const href = match[2].startsWith("/") ? `/${locale}${match[2]}` : match[2];
    parts.push(
      <Link key={`link-${parts.length}`} href={href}>
        {match[1]}
      </Link>,
    );
    last = match.index + match[0].length;
  }
  pushText(text.slice(last));
  return parts;
}

export async function StaticPage({
  locale,
  id,
}: {
  locale: Locale;
  id: StaticPageId;
}) {
  const content = staticPageContent(locale, id);
  const values = await placeholderValues(locale);
  const fill = (text: string) =>
    richText(fillPlaceholders(text, values), locale, values.email);
  const updated = content.updated
    ? new Date(`${content.updated}T00:00:00Z`).toLocaleDateString(
        locale === "lo" ? "lo-LA" : "en-GB",
        { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
      )
    : "";

  return (
    <article className="page-static page-static--content">
      <h1>{fill(content.title)}</h1>
      <p className="lead">{fill(content.lead)}</p>
      {updated ? (
        <p className="page-static-updated">
          {locale === "lo" ? "ປັບປຸງລ່າສຸດ: " : "Last updated: "}
          <time dateTime={content.updated}>{updated}</time>
        </p>
      ) : null}
      {content.sections.map((section, index) => (
        <section key={index}>
          {section.heading ? <h2>{fill(section.heading)}</h2> : null}
          {section.paragraphs?.map((paragraph, i) => (
            <p key={i}>{fill(paragraph)}</p>
          ))}
          {section.list ? (
            <ul>
              {section.list.map((item, i) => (
                <li key={i}>{fill(item)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
