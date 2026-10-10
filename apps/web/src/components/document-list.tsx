import Image from "next/image";
import Link from "next/link";
import type { DocumentListItem, Locale } from "@/lib/api";
import { EmptyState } from "@/components/ui";
import { t } from "@/lib/i18n";

const COVER_BY_CATEGORY: Record<string, string> = {
  accounting: "/brand/categories/cat-accounting.jpg",
  finance: "/brand/categories/cat-finance.jpg",
  tax: "/brand/categories/cat-tax.jpg",
  duties: "/brand/categories/cat-duties.jpg",
  audit: "/brand/categories/cat-audit.jpg",
  law: "/brand/categories/cat-law.jpg",
  knowledge: "/images/hero-default.jpeg",
  sme: "/brand/categories/cat-finance.jpg",
};

const COVER_FALLBACKS = [
  "/brand/categories/cat-accounting.jpg",
  "/brand/categories/cat-finance.jpg",
  "/brand/categories/cat-tax.jpg",
  "/brand/categories/cat-duties.jpg",
  "/brand/categories/cat-audit.jpg",
  "/brand/categories/cat-law.jpg",
];

function coverFor(doc: DocumentListItem, index: number) {
  const slug = (doc.category_slug || "").toLowerCase();
  const name = (doc.category_name || "").toLowerCase();
  for (const [code, src] of Object.entries(COVER_BY_CATEGORY)) {
    if (slug.includes(code) || name.includes(code)) return src;
  }
  // Lao slug heuristics from seed
  if (slug.includes("phasi") || slug.includes("tax")) return COVER_BY_CATEGORY.tax;
  if (slug.includes("banchi") || slug.includes("account")) return COVER_BY_CATEGORY.accounting;
  if (slug.includes("ngen") || slug.includes("financ")) return COVER_BY_CATEGORY.finance;
  if (slug.includes("kotmai") || slug.includes("law")) return COVER_BY_CATEGORY.law;
  if (slug.includes("kuat") || slug.includes("audit")) return COVER_BY_CATEGORY.audit;
  if (slug.includes("akon") || slug.includes("dut")) return COVER_BY_CATEGORY.duties;
  return COVER_FALLBACKS[index % COVER_FALLBACKS.length];
}

function accessLabel(locale: Locale, access: string) {
  if (access === "vip") return t(locale, "badgeVip");
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
}

export function DocumentList({
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

  if (variant === "list") {
    return (
      <ul className="doc-list">
        {items.map((doc, index) => (
          <li key={doc.id}>
            <Link href={`/${locale}/documents/${doc.slug}`} className="doc-card">
              <span className="doc-card-thumb" aria-hidden>
                <Image
                  src={coverFor(doc, index)}
                  alt=""
                  fill
                  sizes="72px"
                  className="doc-card-thumb-img"
                />
              </span>
              <span className="doc-card-body">
                <span className="doc-card-title">{doc.title}</span>
                <span className="doc-card-meta">
                  {doc.category_name ? <span className="doc-card-cat">{doc.category_name}</span> : null}
                  {doc.year ? <span>· {doc.year}</span> : null}
                  {doc.document_number ? <span>· {doc.document_number}</span> : null}
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
                src={coverFor(doc, index)}
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
