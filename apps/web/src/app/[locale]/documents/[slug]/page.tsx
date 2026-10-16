import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { canDownloadFile, getDocument, getPublicSettings, me } from "@/lib/api";
import { documentCoverSrc, isUploadedImage } from "@/lib/image-variants";
import { isLocale, t } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";
import { DownloadButton } from "@/components/download-button";
import { CoverViewer } from "@/components/cover-viewer";

function accessLabel(locale: "lo" | "en", access: string) {
  if (access === "vip") return t(locale, "badgeVip");
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(locale)) return {};
  const doc = await getDocument(locale, slug).catch(() => null);
  return pageMetadata(
    locale,
    `/documents/${encodeURIComponent(slug)}`,
    doc?.title || t(locale, "documents"),
    doc?.summary || undefined,
  );
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(raw)) notFound();

  const headerStore = await headers();
  const cookie = headerStore.get("cookie") || undefined;

  let doc;
  let defaultCover: string | undefined;
  try {
    doc = await getDocument(raw, slug, { cookie });
    defaultCover = (await getPublicSettings().catch(() => null))
      ?.default_cover_url;
  } catch {
    notFound();
  }

  // Who is viewing decides which download button each file gets (the API enforces the same rules).
  const viewer = cookie ? await me({ cookie }).catch(() => null) : null;

  const next = encodeURIComponent(`/${raw}/documents/${doc.slug}`);
  const loginHref = `/${raw}/auth/login?next=${next}`;
  const safeBody = doc.body_html ? sanitizeHtml(doc.body_html) : "";

  return (
    <div className="doc-detail-page">
      <div className="doc-detail-shell">
        <nav className="doc-breadcrumbs" aria-label={t(raw, "breadcrumb")}>
          <Link href={`/${raw}`} className="doc-breadcrumb-link">
            {t(raw, "home")}
          </Link>
          <span className="doc-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <Link href={`/${raw}/documents`} className="doc-breadcrumb-link">
            {t(raw, "documents")}
          </Link>
          {doc.category_name ? (
            <>
              <span className="doc-breadcrumb-sep" aria-hidden="true">
                /
              </span>
              <span className="doc-breadcrumb-current">
                {doc.category_name}
              </span>
            </>
          ) : null}
        </nav>

        <header className="doc-detail-header doc-detail-header--with-cover">
          <div className="doc-detail-header-main">
            <div className="doc-detail-meta-pills">
              <span className={`doc-badge doc-badge--${doc.read_access}`}>
                {accessLabel(raw, doc.read_access)}
              </span>
              {doc.document_number ? (
                <span className="doc-meta-pill">
                  <span>{t(raw, "documentNumber")}:</span>
                  <strong>{doc.document_number}</strong>
                </span>
              ) : null}
              {doc.year ? (
                <span className="doc-meta-pill">
                  <span>{t(raw, "year")}:</span>
                  <strong>{doc.year}</strong>
                </span>
              ) : null}
            </div>

            <h1 className="doc-detail-title">{doc.title}</h1>

            {doc.summary ? (
              <div className="doc-detail-summary-card">
                <span className="doc-summary-label">
                  {raw === "lo" ? "ເນື້ອໃນຫຍໍ້:" : "Summary:"}
                </span>
                <p className="doc-summary-text">{doc.summary}</p>
              </div>
            ) : null}
          </div>
          <figure className="doc-detail-cover">
            <CoverViewer
              src={documentCoverSrc(doc, doc.id, defaultCover, 480)}
              fullSrc={documentCoverSrc(doc, doc.id, defaultCover, 1280)}
              unoptimized={isUploadedImage(doc.cover_image_url || defaultCover)}
              alt={t(raw, "coverOf", { title: doc.title })}
              openLabel={t(raw, "viewCoverFull")}
              closeLabel={t(raw, "close")}
            />
          </figure>
        </header>

        {/* Body text, or why it is hidden: sign in (visitors) or VIP (signed-in members). A readable
            document without body text simply shows no box. */}
        {safeBody ? (
          <main className="doc-detail-content">
            <div
              className="doc-body"
              dangerouslySetInnerHTML={{ __html: safeBody }}
            />
          </main>
        ) : doc.body_available === false ? (
          <main className="doc-detail-content">
            <div className="doc-gated-card">
              <div className="doc-gated-icon-wrap">
                <LockIcon />
              </div>
              {viewer ? (
                <>
                  <h2 className="doc-gated-title">
                    {t(raw, "vipContentTitle")}
                  </h2>
                  <p className="doc-gated-desc">{t(raw, "homePromoLead")}</p>
                  <div className="doc-gated-actions">
                    <Link href={`/${raw}/vip`} className="btn-primary">
                      {t(raw, "vipBenefits")}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="doc-gated-title">{t(raw, "signInToRead")}</h2>
                  <p className="doc-gated-desc">{t(raw, "bodyGated")}</p>
                  <div className="doc-gated-actions">
                    <Link href={loginHref} className="btn-primary">
                      {t(raw, "login")}
                    </Link>
                    <Link
                      href={`/${raw}/auth/register`}
                      className="btn-secondary"
                    >
                      {t(raw, "register")}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </main>
        ) : null}

        <section className="doc-files-section">
          <div className="doc-files-head">
            <FileTextIcon className="text-bb-blue" />
            <h2 className="section-title">{t(raw, "files")}</h2>
          </div>

          <ul className="doc-files-list">
            {(doc.files || []).map((file) => (
              <li key={file.id} className="doc-file-card">
                <div className="doc-file-card-info">
                  <div className="doc-file-icon-wrap">
                    <FileTextIcon />
                  </div>
                  <div>
                    <h3 className="doc-file-name">
                      {file.label || file.file_name}
                    </h3>
                    <p className="doc-file-meta">
                      <span>{file.file_name}</span>
                      {file.version ? <span>· v{file.version}</span> : null}
                      <span>·</span>
                      <span
                        className={`doc-badge doc-badge--${file.download_access}`}
                      >
                        {accessLabel(raw, file.download_access)}
                      </span>
                    </p>
                  </div>
                </div>

                {file.available === false ? (
                  // No uploaded file behind this entry: say so instead of a download that fails.
                  <span
                    className="doc-file-btn is-disabled"
                    aria-disabled="true"
                  >
                    <DownloadIcon />
                    <span>{t(raw, "fileNotAvailable")}</span>
                  </span>
                ) : file.file_url &&
                  canDownloadFile(viewer, file.download_access) ? (
                  <DownloadButton
                    locale={raw}
                    fileUrl={file.file_url}
                    fileName={file.file_name}
                  />
                ) : viewer && viewer.account_status === "active" ? (
                  // Signed in, but this file is for VIP members only.
                  <Link href={`/${raw}/vip`} className="doc-file-btn">
                    <LockIcon width={16} height={16} />
                    <span>{t(raw, "vipDownloadOnly")}</span>
                  </Link>
                ) : (
                  <Link href={loginHref} className="doc-file-btn">
                    <DownloadIcon />
                    <span>{t(raw, "downloadLogin")}</span>
                  </Link>
                )}
              </li>
            ))}
            {!doc.files?.length ? (
              <li className="text-muted py-3">{t(raw, "noFiles")}</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
