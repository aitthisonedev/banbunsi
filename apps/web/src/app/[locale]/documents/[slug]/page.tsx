import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDocument, getPublicSettings } from "@/lib/api";
import { documentCoverSrc, isUploadedImage } from "@/lib/image-variants";
import { isLocale, t } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

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
  const { locale, slug } = await params;
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
  const { locale: raw, slug } = await params;
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

  const next = encodeURIComponent(`/${raw}/documents/${doc.slug}`);
  const loginHref = `/${raw}/auth/login?next=${next}`;
  const safeBody = doc.body_html ? sanitizeHtml(doc.body_html) : "";

  return (
    <div className="doc-detail-page">
      <div className="doc-detail-shell">
        <nav className="doc-breadcrumbs" aria-label="Breadcrumb">
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
            <Image
              src={documentCoverSrc(doc, doc.id, defaultCover, 480)}
              unoptimized={isUploadedImage(doc.cover_image_url || defaultCover)}
              alt={
                raw === "lo" ? `ໜ້າປົກ: ${doc.title}` : `Cover: ${doc.title}`
              }
              fill
              priority
              sizes="(min-width: 768px) 220px, 60vw"
              className="object-cover"
            />
          </figure>
        </header>

        <main className="doc-detail-content">
          {safeBody ? (
            <div
              className="doc-body"
              dangerouslySetInnerHTML={{ __html: safeBody }}
            />
          ) : (
            <div className="doc-gated-card">
              <div className="doc-gated-icon-wrap">
                <LockIcon />
              </div>
              <h2 className="doc-gated-title">
                {raw === "lo"
                  ? "ເຂົ້າສູ່ລະບົບເພື່ອອ່ານເນື້ອຫາຕົ້ນເຕັມ"
                  : "Sign in to read full document"}
              </h2>
              <p className="doc-gated-desc">{t(raw, "bodyGated")}</p>
              <div className="doc-gated-actions">
                <Link href={loginHref} className="btn-primary">
                  {t(raw, "login")}
                </Link>
                {doc.read_access === "vip" ? (
                  <Link href={`/${raw}/vip`} className="btn-secondary">
                    {t(raw, "vipBenefits")}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </main>

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

                {file.file_url ? (
                  <a
                    href={file.file_url}
                    className="doc-file-btn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <DownloadIcon />
                    <span>{t(raw, "download") || "Download"}</span>
                  </a>
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
