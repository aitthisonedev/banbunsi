import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  canDownloadFile,
  getDocument,
  getPublicSettings,
  me,
  type DocumentFileMeta,
  type Locale,
} from "@/lib/api";
import { formatDate, formatShortDate } from "@/lib/dashboard-stats";
import { formatBytes } from "@/lib/format";
import {
  documentCoverOriginal,
  documentCoverSrc,
  isUploadedImage,
} from "@/lib/image-variants";
import { isLocale, t } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";
import { DocumentPreview } from "@/components/document-preview";
import { DownloadButton } from "@/components/download-button";
import { FavoriteButton } from "@/components/favorite-button";
import { CoverViewer } from "@/components/cover-viewer";

function accessLabel(locale: "lo" | "en", access: string) {
  if (access === "vip") return t(locale, "badgeVip");
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
}

/** "PDF", "DOCX"… from the file name; the tile in the file list shows it instead of a generic icon. */
function fileExtension(file: DocumentFileMeta) {
  const dot = file.file_name.lastIndexOf(".");
  return dot > 0 ? file.file_name.slice(dot + 1, dot + 5).toUpperCase() : "";
}

function fileLanguage(locale: Locale, language: string) {
  if (language === "lo") return t(locale, "fileLangLo");
  if (language === "en") return t(locale, "fileLangEn");
  return "";
}

function SignInActions({
  locale,
  loginHref,
}: {
  locale: Locale;
  loginHref: string;
}) {
  return (
    <div className="doc-gated-actions">
      <Link href={loginHref} className="btn-primary">
        {t(locale, "login")}
      </Link>
      <Link href={`/${locale}/auth/register`} className="btn-secondary">
        {t(locale, "register")}
      </Link>
    </div>
  );
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
  const canonicalTranslation =
    doc?.translations?.find((translation) => translation.locale === locale) ||
    doc?.translations?.find((translation) => isLocale(translation.locale));
  const canonicalLocale = canonicalTranslation
    ? (canonicalTranslation.locale as Locale)
    : locale;
  const canonicalSlug = canonicalTranslation?.slug || doc?.slug || slug;
  const alternatePaths: Partial<Record<Locale, string>> = {};
  for (const translation of doc?.translations || []) {
    if (isLocale(translation.locale) && translation.slug) {
      alternatePaths[translation.locale] =
        `/documents/${encodeURIComponent(translation.slug)}`;
    }
  }
  alternatePaths[canonicalLocale] = `/documents/${encodeURIComponent(
    canonicalSlug,
  )}`;
  return pageMetadata(
    canonicalLocale,
    `/documents/${encodeURIComponent(canonicalSlug)}`,
    doc?.seo_title || doc?.title || t(locale, "documents"),
    doc?.seo_description || doc?.summary || undefined,
    { alternatePaths },
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

  const localized = doc.translations?.find(
    (translation) => translation.locale === raw,
  );
  if (localized && localized.slug !== slug) {
    redirect(`/${raw}/documents/${encodeURIComponent(localized.slug)}`);
  }
  if (doc.translations && !localized) {
    const fallback = doc.translations.find((translation) =>
      isLocale(translation.locale),
    );
    if (fallback) {
      redirect(
        `/${fallback.locale}/documents/${encodeURIComponent(fallback.slug)}`,
      );
    }
  }

  // Who is viewing decides which download button each file gets (the API enforces the same rules).
  const viewer = cookie ? await me({ cookie }).catch(() => null) : null;

  const next = encodeURIComponent(`/${raw}/documents/${doc.slug}`);
  const loginHref = `/${raw}/auth/login?next=${next}`;
  const safeBody = doc.body_html ? sanitizeHtml(doc.body_html) : "";
  const files = doc.files || [];
  const hasDownloadableFile = files.some((file) => file.available !== false);
  const signedIn = Boolean(viewer && viewer.account_status === "active");
  const tags = (doc.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  // Public documents get an in-page PDF preview; the page's own language comes first.
  const previewable =
    doc.read_access === "public"
      ? files
          .filter(
            (file) =>
              file.available !== false &&
              file.file_url &&
              fileExtension(file) === "PDF",
          )
          .sort(
            (a, b) =>
              Number(b.language === raw) - Number(a.language === raw) ||
              a.sort_order - b.sort_order,
          )
      : [];
  const previewFiles = previewable.flatMap((file) =>
    file.file_url && canDownloadFile(viewer, file.download_access)
      ? [
          {
            id: file.id,
            label: file.label || file.file_name,
            url: file.file_url,
          },
        ]
      : [],
  );

  return (
    <div className="doc-detail-page">
      <div className="doc-detail-shell">
        <div className="doc-detail-layout">
          <header className="doc-detail-header">
            <div className="doc-detail-topbar">
              <nav
                className="doc-breadcrumbs"
                aria-label={t(raw, "breadcrumb")}
              >
                <Link href={`/${raw}`} className="doc-breadcrumb-link">
                  {t(raw, "home")}
                </Link>
                <span className="doc-breadcrumb-sep" aria-hidden="true">
                  /
                </span>
                <Link
                  href={`/${raw}/documents`}
                  className="doc-breadcrumb-link"
                >
                  {t(raw, "documents")}
                </Link>
                {doc.category_name ? (
                  <>
                    <span className="doc-breadcrumb-sep" aria-hidden="true">
                      /
                    </span>
                    {doc.category_slug ? (
                      <Link
                        href={`/${raw}/categories/${doc.category_slug}`}
                        className="doc-breadcrumb-link"
                      >
                        {doc.category_name}
                      </Link>
                    ) : (
                      <span className="doc-breadcrumb-current">
                        {doc.category_name}
                      </span>
                    )}
                  </>
                ) : null}
              </nav>
              <div className="doc-detail-meta-pills">
                {doc.category_name ? (
                  doc.category_slug ? (
                    <Link
                      href={`/${raw}/categories/${doc.category_slug}`}
                      className="doc-category-chip"
                    >
                      {doc.category_name}
                    </Link>
                  ) : (
                    <span className="doc-category-chip">
                      {doc.category_name}
                    </span>
                  )
                ) : null}
                <span className={`doc-badge doc-badge--${doc.read_access}`}>
                  {accessLabel(raw, doc.read_access)}
                </span>
              </div>
            </div>
            <div className="doc-detail-intro">
              <h1 className="doc-detail-title">{doc.title}</h1>
              {doc.summary ? (
                <p className="doc-detail-lead">{doc.summary}</p>
              ) : null}
              {safeBody ? (
                <section
                  className="doc-detail-body"
                  aria-labelledby="doc-content-title"
                >
                  <h2 id="doc-content-title" className="doc-section-title">
                    {t(raw, "documentContent")}
                  </h2>
                  <div
                    className="doc-body"
                    dangerouslySetInnerHTML={{ __html: safeBody }}
                  />
                </section>
              ) : null}
            </div>
          </header>

          <aside
            className="doc-detail-aside"
            aria-label={t(raw, "documentInfo")}
          >
            <figure className="doc-detail-cover">
              <CoverViewer
                src={documentCoverSrc(doc, doc.id, defaultCover, 640)}
                fullSrc={documentCoverOriginal(doc, doc.id, defaultCover)}
                unoptimized={isUploadedImage(
                  doc.cover_image_url || defaultCover,
                )}
                alt={t(raw, "coverOf", { title: doc.title })}
                openLabel={t(raw, "viewCoverFull")}
                closeLabel={t(raw, "close")}
              />
            </figure>

            <div className="doc-aside-body">
              <div className="doc-aside-actions">
                {hasDownloadableFile ? (
                  signedIn ? (
                    <a
                      href="#doc-files"
                      className="doc-aside-cta"
                      aria-label={t(raw, "viewFiles")}
                      title={t(raw, "viewFiles")}
                    >
                      <DownloadIcon />
                      <span>{t(raw, "download")}</span>
                    </a>
                  ) : (
                    <Link
                      href={loginHref}
                      className="doc-aside-cta"
                      aria-label={t(raw, "downloadLogin")}
                      title={t(raw, "downloadLogin")}
                    >
                      <LockIcon width={16} height={16} />
                      <span>{t(raw, "download")}</span>
                    </Link>
                  )
                ) : null}
                <FavoriteButton
                  locale={raw}
                  documentId={doc.id}
                  initialFavorited={Boolean(doc.favorited)}
                  loginHref={loginHref}
                  signedIn={signedIn}
                />
              </div>

              <dl className="doc-facts">
                {doc.document_number ? (
                  <div className="doc-fact">
                    <dt>{t(raw, "documentNumber")}</dt>
                    <dd className="doc-fact-mono">{doc.document_number}</dd>
                  </div>
                ) : null}
                {doc.category_name ? (
                  <div className="doc-fact">
                    <dt>{t(raw, "category")}</dt>
                    <dd>
                      {doc.category_slug ? (
                        <Link href={`/${raw}/categories/${doc.category_slug}`}>
                          {doc.category_name}
                        </Link>
                      ) : (
                        doc.category_name
                      )}
                    </dd>
                  </div>
                ) : null}
                {doc.year ? (
                  <div className="doc-fact">
                    <dt>{t(raw, "year")}</dt>
                    <dd>{doc.year}</dd>
                  </div>
                ) : null}
                {doc.effective_date ? (
                  <div className="doc-fact">
                    <dt>{t(raw, "effectiveDate")}</dt>
                    <dd>
                      {formatShortDate(
                        raw,
                        doc.effective_date.slice(0, 10),
                        true,
                      )}
                    </dd>
                  </div>
                ) : null}
                <div className="doc-fact">
                  <dt>{t(raw, "readAccess")}</dt>
                  <dd>
                    <span className={`doc-badge doc-badge--${doc.read_access}`}>
                      {accessLabel(raw, doc.read_access)}
                    </span>
                  </dd>
                </div>
                {doc.updated_at ? (
                  <div className="doc-fact">
                    <dt>{t(raw, "lastUpdated")}</dt>
                    <dd>{formatDate(raw, doc.updated_at)}</dd>
                  </div>
                ) : null}
                <div className="doc-fact">
                  <dt>{t(raw, "files")}</dt>
                  <dd>
                    {t(raw, files.length === 1 ? "fileCountOne" : "fileCount", {
                      count: files.length,
                    })}
                  </dd>
                </div>
              </dl>

              {tags.length ? (
                <ul className="doc-tags" aria-label={t(raw, "tags")}>
                  {tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        href={`/${raw}/search?q=${encodeURIComponent(tag)}`}
                        className="doc-tag"
                      >
                        #{tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </aside>

          <div className="doc-detail-main">
            {/* Readable body text sits in the title card; otherwise say why it is hidden: sign in
              (visitors) or VIP (signed-in members). */}
            {!safeBody && doc.body_available === false ? (
              <section className="doc-detail-content">
                <div className="doc-gated-card">
                  <div className="doc-gated-icon-wrap">
                    <LockIcon />
                  </div>
                  {viewer ? (
                    <>
                      <h2 className="doc-gated-title">
                        {t(raw, "vipContentTitle")}
                      </h2>
                      <p className="doc-gated-desc">
                        {t(raw, "homePromoLead")}
                      </p>
                      <div className="doc-gated-actions">
                        <Link href={`/${raw}/vip`} className="btn-primary">
                          {t(raw, "vipBenefits")}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="doc-gated-title">
                        {t(raw, "signInToRead")}
                      </h2>
                      <p className="doc-gated-desc">{t(raw, "bodyGated")}</p>
                      <SignInActions locale={raw} loginHref={loginHref} />
                    </>
                  )}
                </div>
              </section>
            ) : null}

            {previewable.length ? (
              <section
                className="doc-preview-section"
                aria-labelledby="doc-preview-title"
              >
                <h2 id="doc-preview-title" className="doc-section-title">
                  {t(raw, "filePreview")}
                </h2>
                {previewFiles.length ? (
                  <DocumentPreview locale={raw} files={previewFiles} />
                ) : (
                  <div className="doc-preview-gate">
                    <div className="doc-gated-icon-wrap">
                      <LockIcon />
                    </div>
                    {signedIn ? (
                      <>
                        <p className="doc-gated-title">
                          {t(raw, "vipDownloadOnly")}
                        </p>
                        <p className="doc-gated-desc">
                          {t(raw, "previewVipHint")}
                        </p>
                        <Link href={`/${raw}/vip`} className="btn-primary">
                          {t(raw, "vipBenefits")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="doc-gated-title">
                          {t(raw, "previewSignIn")}
                        </p>
                        <p className="doc-gated-desc">
                          {t(raw, "previewSignInHint")}
                        </p>
                        <SignInActions locale={raw} loginHref={loginHref} />
                      </>
                    )}
                  </div>
                )}
              </section>
            ) : null}

            <section
              id="doc-files"
              className="doc-files-section"
              aria-labelledby="doc-files-title"
            >
              <div className="doc-files-head">
                <h2 id="doc-files-title" className="doc-section-title">
                  {t(raw, "files")}
                </h2>
                {files.length ? (
                  <span className="doc-files-count">{files.length}</span>
                ) : null}
              </div>

              <ul className="doc-files-list">
                {files.map((file) => {
                  const extension = fileExtension(file);
                  const language = fileLanguage(raw, file.language);
                  const size = formatBytes(file.size_bytes);
                  return (
                    <li key={file.id} className="doc-file-card">
                      <div className="doc-file-card-info">
                        <div className="doc-file-type" aria-hidden="true">
                          {extension || <FileTextIcon />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="doc-file-name">
                            {file.label || file.file_name}
                          </h3>
                          <p className="doc-file-meta">
                            {language ? <span>{language}</span> : null}
                            {size ? <span>{size}</span> : null}
                            {file.version ? <span>v{file.version}</span> : null}
                            <span
                              className={`doc-badge doc-badge--${file.download_access}`}
                            >
                              {accessLabel(raw, file.download_access)}
                            </span>
                          </p>
                          {file.label && file.label !== file.file_name ? (
                            <p className="doc-file-filename">
                              {file.file_name}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {file.available === false ? (
                        // No uploaded file behind this entry: say so instead of a download that fails.
                        <span
                          className="doc-file-btn is-disabled"
                          aria-disabled="true"
                        >
                          <span>{t(raw, "fileNotAvailable")}</span>
                        </span>
                      ) : file.file_url &&
                        canDownloadFile(viewer, file.download_access) ? (
                        <DownloadButton
                          locale={raw}
                          fileUrl={file.file_url}
                          fileName={file.file_name}
                        />
                      ) : signedIn ? (
                        // Signed in, but this file is for VIP members only.
                        <Link
                          href={`/${raw}/vip`}
                          className="doc-file-btn doc-file-btn--outline"
                        >
                          <LockIcon width={16} height={16} />
                          <span>{t(raw, "vipDownloadOnly")}</span>
                        </Link>
                      ) : (
                        <Link
                          href={loginHref}
                          className="doc-file-btn doc-file-btn--outline"
                        >
                          <LockIcon width={16} height={16} />
                          <span>{t(raw, "downloadLogin")}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
                {!files.length ? (
                  <li className="doc-files-empty">{t(raw, "noFiles")}</li>
                ) : null}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
