import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { getDocument } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize-html";

function accessLabel(locale: "lo" | "en", access: string) {
  if (access === "vip") return t(locale, "badgeVip");
  if (access === "member") return t(locale, "badgeMember");
  return t(locale, "badgePublic");
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
  const safeBody = doc.body_html ? sanitizeHtml(doc.body_html) : "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-5">
      <p className="text-sm text-bb-text-muted">
        <Link href={`/${raw}/documents`} className="section-link">
          {t(raw, "documents")}
        </Link>
        {doc.category_name ? ` · ${doc.category_name}` : ""}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{doc.title}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-bb-text-muted">
        <span>{doc.document_number}</span>
        {doc.year ? <span>· {doc.year}</span> : null}
        <Badge>{accessLabel(raw, doc.read_access)}</Badge>
      </p>
      {doc.summary ? <p className="mt-5 text-lg text-bb-text-muted">{doc.summary}</p> : null}

      {safeBody ? (
        <div className="doc-body mt-8" dangerouslySetInnerHTML={{ __html: safeBody }} />
      ) : (
        <div className="mt-8 surface-panel">
          <p className="text-bb-text-muted">{t(raw, "bodyGated")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
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

      <section className="mt-10">
        <h2 className="section-title">{t(raw, "files")}</h2>
        <ul className="mt-4 space-y-3">
          {(doc.files || []).map((file) => (
            <li key={file.id} className="doc-file-row">
              <div>
                <p className="font-semibold">{file.label || file.file_name}</p>
                <p className="text-sm text-bb-text-muted">
                  {file.file_name} · {file.version || "—"} ·{" "}
                  {accessLabel(raw, file.download_access)}
                </p>
              </div>
              <Link href={loginHref} className="btn-primary">
                {t(raw, "downloadLogin")}
              </Link>
            </li>
          ))}
          {!doc.files?.length ? (
            <li className="text-muted">{t(raw, "noFiles")}</li>
          ) : null}
        </ul>
      </section>
    </article>
  );
}
