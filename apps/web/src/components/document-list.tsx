import Image from "next/image";
import Link from "next/link";
import {
  getPublicSettings,
  type DocumentListItem,
  type Locale,
} from "@/lib/api";
import { EmptyState } from "@/components/ui";
import { documentCoverSrc, isUploadedImage } from "@/lib/image-variants";
import { t } from "@/lib/i18n";

function accessLabel(locale: Locale, access: string) {
  if (access === "vip") return t(locale, "badgeVip");
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
}

export async function DocumentList({
  locale,
  items,
  emptyText,
  variant = "cards",
}: {
  locale: Locale;
  items: DocumentListItem[];
  emptyText: string;
  variant?: "cards" | "list";
}) {
  if (!items.length) {
    return <EmptyState title={emptyText} />;
  }
  // Same settings request as the page (deduplicated per request).
  const defaultCover = (await getPublicSettings().catch(() => null))
    ?.default_cover_url;

  if (variant === "list") {
    return (
      <ul className="doc-list">
        {items.map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/${locale}/documents/${doc.slug}`}
              className="doc-card"
            >
              <span className="doc-card-thumb" aria-hidden>
                <Image
                  src={documentCoverSrc(doc, doc.id, defaultCover, 160)}
                  unoptimized={isUploadedImage(
                    doc.cover_image_url || defaultCover,
                  )}
                  alt=""
                  fill
                  sizes="72px"
                  className="doc-card-thumb-img"
                />
              </span>
              <span className="doc-card-body">
                <span className="doc-card-title">{doc.title}</span>
                <span className="doc-card-meta">
                  {doc.category_name ? (
                    <span className="doc-card-cat">{doc.category_name}</span>
                  ) : null}
                  {doc.year ? <span>· {doc.year}</span> : null}
                  {doc.document_number ? (
                    <span>· {doc.document_number}</span>
                  ) : null}
                </span>
              </span>
              <span className="doc-card-badges">
                <span className={`doc-badge doc-badge--${doc.read_access}`}>
                  {accessLabel(locale, doc.read_access)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // Same card design as the category cards: cover with navy overlay and the title on it, then a
  // white area with the summary and a blue "Read →" line.
  return (
    <ul className="category-card-grid">
      {items.map((doc, index) => {
        const coverSource = doc.cover_image_url || defaultCover;
        const uploaded = isUploadedImage(coverSource);
        const src = documentCoverSrc(doc, doc.id, defaultCover, 640);
        return (
          <li key={doc.id}>
            <Link
              href={`/${locale}/documents/${doc.slug}`}
              className="category-card category-card--image doc-card--tile"
              title={doc.title}
            >
              <span className="category-card-media">
                {uploaded ? (
                  // Uploaded covers are shown whole over a blurred copy of themselves (never cropped);
                  // the built-in category photos fill the frame exactly like the category cards.
                  <Image
                    src={src}
                    unoptimized
                    alt=""
                    aria-hidden
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                    className="doc-card-media-backdrop"
                  />
                ) : null}
                <Image
                  src={src}
                  unoptimized={uploaded}
                  alt={doc.title}
                  fill
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
                  className={
                    uploaded
                      ? "category-card-img category-card-img--whole"
                      : "category-card-img"
                  }
                  priority={index < 4}
                />
                <span className="category-card-media-shade" aria-hidden />
                <span className="doc-card-media-badge">
                  <span className={`doc-badge doc-badge--${doc.read_access}`}>
                    {accessLabel(locale, doc.read_access)}
                  </span>
                </span>
                <span className="category-card-title-on-image">
                  {doc.category_name ? (
                    <span className="doc-card-eyebrow">
                      {doc.category_name}
                    </span>
                  ) : null}
                  <span className="doc-card-title-text">{doc.title}</span>
                </span>
              </span>
              <span className="category-card-body">
                {/* Always present (empty without a summary) so card heights match. */}
                <span className="category-card-desc">{doc.summary || ""}</span>
                <span className="category-card-meta doc-card-action">
                  <span>
                    {locale === "lo" ? "ອ່ານ" : "Read"}
                    <span className="category-card-arrow" aria-hidden>
                      {" "}
                      →
                    </span>
                  </span>
                  <span className="doc-card-ref">
                    {[doc.document_number, doc.year]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
