import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { DocumentFileDownload } from "@/components/document-file-download";
import { getDocument } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize-html";

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
  try {
    doc = await getDocument(raw, slug, { cookie });
  } catch {
    notFound();
  }

  const next = encodeURIComponent(`/${raw}/documents/${doc.slug}`);
  const loginHref = `/${raw}/auth/login?next=${next}`;
  const vipHref = `/${raw}/vip`;
  const safeBody = doc.body_html ? sanitizeHtml(doc.body_html) : "";
  const categoryHref = doc.category_slug
    ? `/${raw}/categories/${doc.category_slug}`
    : `/${raw}/categories`;

  return (
    <div className="detail-page">
      <div className="detail-shell">
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${raw}`} className="detail-breadcrumb-link">
            {t(raw, "home")}
          </Link>
          <span className="detail-breadcrumb-sep" aria-hidden>
            /
          </span>
          <Link href={`/${raw}/documents`} className="detail-breadcrumb-link">
            {t(raw, "documents")}
          </Link>
          {doc.category_name ? (
            <>
              <span className="detail-breadcrumb-sep" aria-hidden>
                /
              </span>
              <Link href={categoryHref} className="detail-breadcrumb-link">
                {doc.category_name}
              </Link>
            </>
          ) : null}
        </nav>

        <Reveal as="section" className="detail-hero">
          <div className="detail-hero-meta">
            <div className="detail-hero-meta-main">
              {doc.category_name ? (
                <Link href={categoryHref} className="detail-hero-cat">
                  {doc.category_name}
                </Link>
              ) : null}
              {doc.year ? (
                <span className="detail-hero-year">· {doc.year}</span>
              ) : null}
              {doc.document_number ? (
                <span className="detail-hero-docnum">
                  · {doc.document_number}
                </span>
              ) : null}
            </div>
            <span
              className={`doc-card-access doc-card-access--${doc.read_access}`}
            >
              {accessLabel(raw, doc.read_access)}
            </span>
          </div>

          <h1 className="detail-hero-title">{doc.title}</h1>

          {doc.summary ? (
            <p className="detail-hero-lead">{doc.summary}</p>
          ) : null}
        </Reveal>

        <Reveal as="section" className="detail-panel" delay={40}>
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
        </Reveal>

        <Reveal as="section" className="detail-panel detail-files" delay={80}>
          <div className="detail-panel-head">
            <span className="detail-panel-icon" aria-hidden>
              <FileTextIcon />
            </span>
            <h2 className="detail-panel-title">{t(raw, "files")}</h2>
          </div>

          {(doc.files || []).length ? (
            <ul className="doc-files-list">
              {(doc.files || []).map((file) => (
                <li key={file.id} className="doc-file-card">
                  <div className="doc-file-card-info">
                    <div className="doc-file-icon-wrap" aria-hidden>
                      <FileTextIcon />
                    </div>
                    <div className="doc-file-copy">
                      <h3 className="doc-file-name">
                        {file.label || file.file_name}
                      </h3>
                      <p className="doc-file-meta">
                        <span>{file.file_name}</span>
                        {file.version ? <span>· v{file.version}</span> : null}
                        <span
                          className={`doc-card-access doc-card-access--${file.download_access}`}
                        >
                          · {accessLabel(raw, file.download_access)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <DocumentFileDownload
                    locale={raw}
                    slug={doc.slug}
                    file={file}
                    loginHref={loginHref}
                    vipHref={vipHref}
                    initialCanDownload={Boolean(file.can_download)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-empty">{t(raw, "noFiles")}</p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
