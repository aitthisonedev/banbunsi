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
        {items.map((doc, index) => (
          <li key={doc.id}>
            <Link
              href={`/${locale}/documents/${doc.slug}`}
              className="doc-card"
            >
              <span className="doc-card-thumb" aria-hidden>
                <Image
                  src={documentCoverSrc(doc, index, defaultCover, 160)}
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

  return (
    <ul className="doc-card-grid">
      {items.map((doc, index) => (
        <li key={doc.id}>
          <Link
            href={`/${locale}/documents/${doc.slug}`}
            className="doc-card doc-card--tile"
            title={doc.title}
          >
            <span className="doc-card-media">
              <Image
                src={documentCoverSrc(doc, index, defaultCover, 640)}
                unoptimized={isUploadedImage(
                  doc.cover_image_url || defaultCover,
                )}
                alt={doc.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="doc-card-media-img"
              />
              <span className="doc-card-media-shade" aria-hidden />
              <span className="doc-card-media-badge">
                <span className={`doc-badge doc-badge--${doc.read_access}`}>
                  {accessLabel(locale, doc.read_access)}
                </span>
              </span>
            </span>

            <span className="doc-card-body">
              <span className="doc-card-meta">
                {doc.category_name ? (
                  <span className="doc-card-cat">{doc.category_name}</span>
                ) : null}
                {doc.year ? (
                  <span className="doc-card-year">· {doc.year}</span>
                ) : null}
              </span>

              <h3 className="doc-card-title">{doc.title}</h3>

              <span className="doc-card-footer">
                {doc.document_number ? (
                  <span className="doc-card-docnum">{doc.document_number}</span>
                ) : (
                  <span />
                )}
                <span className="doc-card-read-more" aria-hidden>
                  {locale === "lo" ? "ອ່ານ" : "Read"} →
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
