import Link from "next/link";
import type { DocumentListItem, Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

function accessLabel(locale: Locale, access: string) {
  if (access === "vip") return "VIP";
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
}

export function DocumentList({
  locale,
  items,
  emptyText,
}: {
  locale: Locale;
  items: DocumentListItem[];
  emptyText: string;
}) {
  if (!items.length) {
    return <p className="text-muted">{emptyText}</p>;
  }

  return (
    <ul className="doc-list">
      {items.map((doc) => (
        <li key={doc.id}>
          <Link href={`/${locale}/documents/${doc.slug}`} className="doc-row">
            <div className="doc-row-main">
              <h3 className="doc-row-title">{doc.title}</h3>
              <p className="doc-row-meta">
                <span>{doc.category_name}</span>
                {doc.year ? <span>· {doc.year}</span> : null}
                {doc.document_number ? <span>· {doc.document_number}</span> : null}
              </p>
              {doc.summary ? <p className="doc-row-summary">{doc.summary}</p> : null}
            </div>
            <div className="doc-row-badges">
              <span className="doc-badge">{accessLabel(locale, doc.read_access)}</span>
              {doc.files?.[0] ? (
                <span className="doc-badge doc-badge-muted">
                  {doc.files[0].download_access === "vip" ? "VIP" : t(locale, "badgeMember")}
                </span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
