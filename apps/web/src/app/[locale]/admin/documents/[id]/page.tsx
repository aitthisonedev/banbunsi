"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AccessBadge,
  btn,
  DocumentCover,
  formatBytes,
  PageHeader,
  PageSkeleton,
  panelClass,
  StatePanel,
  StatusBadge,
} from "@/components/admin-documents-ui";
import type { DocumentFileMeta } from "@/lib/api";
import { clientDeleteAdminDocumentFile, clientGetAdminDocument, clientGetPublicSettings, clientMe } from "@/lib/client-api";
import { categoryCover } from "@/lib/category-covers";
import { isLocale, t } from "@/lib/i18n";

type AdminDocument = {
  id: string;
  title?: string;
  slug?: string;
  summary?: string;
  document_number?: string;
  category_name?: string;
  category_slug?: string;
  cover_image_url?: string;
  read_access?: string;
  status?: string;
  year?: number;
  tags?: string;
  effective_date?: string;
  created_at?: string;
  updated_at?: string;
  files?: DocumentFileMeta[];
};

export default function AdminDocumentDetailsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const id = String(params.id || "");
  const router = useRouter();
  const [document, setDocument] = useState<AdminDocument | null>(null);
  const [defaultCover, setDefaultCover] = useState("");
  const [loadError, setLoadError] = useState("");
  const [fileError, setFileError] = useState("");
  const [removingFileId, setRemovingFileId] = useState("");

  useEffect(() => {
    clientMe()
      .then(async (user) => {
        if (!["editor", "admin", "owner"].includes(user.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        const [details, settings] = await Promise.all([
          clientGetAdminDocument(id, locale),
          clientGetPublicSettings().catch(() => null),
        ]);
        setDocument(details as AdminDocument);
        setDefaultCover(settings?.default_cover_url || "");
      })
      .catch((reason) => setLoadError(reason instanceof Error ? reason.message : t(locale, "loadError")));
  }, [id, locale, router]);

  const backLink = (
    <Link href={`/${locale}/admin/documents`} className="inline-flex items-center gap-1 text-sm text-bb-text-muted hover:text-[var(--bb-text)]">
      ← {t(locale, "adminDocuments")}
    </Link>
  );

  if (loadError) {
    return (
      <div className="w-full max-w-7xl space-y-4">
        {backLink}
        <section className={panelClass}>
          <StatePanel
            tone="error"
            title="This document could not be loaded"
            description={loadError}
            action={
              <>
                <button type="button" className={btn.secondary} onClick={() => window.location.reload()}>Try again</button>
                <Link href={`/${locale}/admin/documents`} className={btn.primary}>Back to documents</Link>
              </>
            }
          />
        </section>
      </div>
    );
  }
  if (!document) return <PageSkeleton />;

  const files = document.files || [];
  const title = document.title || "Untitled document";
  const dateLabel = (value?: string) => value
    ? new Date(value).toLocaleDateString(locale === "lo" ? "lo-LA" : "en", { year: "numeric", month: "short", day: "numeric" })
    : "";
  const tags = (document.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);

  async function onDeleteFile(file: DocumentFileMeta) {
    if (!confirm(`Remove "${file.label || file.file_name}" from this document?`)) return;
    setFileError("");
    setRemovingFileId(file.id);
    try {
      await clientDeleteAdminDocumentFile(id, file.id);
      setDocument((current) => current
        ? { ...current, files: current.files?.filter((item) => item.id !== file.id) }
        : current);
    } catch (reason) {
      setFileError(reason instanceof Error ? reason.message : "Could not remove the file.");
    } finally {
      setRemovingFileId("");
    }
  }

  const details: Array<[string, string | number | undefined]> = [
    ["Document number", document.document_number],
    ["Category", document.category_name],
    [t(locale, "year"), document.year],
    ["Effective date", dateLabel(document.effective_date)],
    ["Created", dateLabel(document.created_at)],
    ["Last updated", dateLabel(document.updated_at)],
  ];

  return (
    <div className="w-full max-w-7xl space-y-6">
      <PageHeader
        back={backLink}
        eyebrow={document.document_number}
        title={title}
        badges={<><StatusBadge status={document.status} /><AccessBadge access={document.read_access} /></>}
        actions={
          <>
            {document.status === "published" && document.slug ? (
              <Link href={`/${locale}/documents/${document.slug}`} target="_blank" rel="noreferrer" className={btn.secondary}>
                View on site ↗
              </Link>
            ) : null}
            <Link href={`/${locale}/admin/documents/${id}/edit`} className={btn.primary}>Edit document</Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="mx-auto w-full max-w-[220px] lg:max-w-none">
            <DocumentCover src={document.cover_image_url || defaultCover} fallbackSrc={categoryCover(document, document.id)} title={title} size="lg" />
          </div>
          {!document.cover_image_url ? (
            <p className="text-center text-xs text-bb-text-muted lg:text-left">
              {defaultCover ? "Showing the default cover. " : "Showing the category image. "}
              <Link href={`/${locale}/admin/documents/${id}/edit`} className="font-semibold text-bb-blue hover:underline">Upload a cover</Link>
            </p>
          ) : null}
        </aside>

        <div className="space-y-6">
          <section className={`${panelClass} p-5`}>
            <h2 className="font-semibold">Details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-bb-text-muted">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-bb-border pt-4">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-bb-muted px-2.5 py-0.5 text-xs text-bb-text-muted">{tag}</span>
                ))}
              </div>
            ) : null}
            {document.summary ? (
              <div className="mt-4 border-t border-bb-border pt-4">
                <h3 className="text-xs font-medium text-bb-text-muted">Summary</h3>
                <p className="mt-1 text-sm leading-relaxed">{document.summary}</p>
              </div>
            ) : null}
          </section>

          <section className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Files <span className="font-normal text-bb-text-muted">({files.length})</span></h2>
              <Link href={`/${locale}/admin/documents/${id}/edit`} className="text-sm font-semibold text-bb-blue hover:underline">Manage files</Link>
            </div>
            {fileError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{fileError}</p> : null}
            {files.length ? (
              <ul className="mt-3 divide-y divide-[var(--bb-border)]">
                {files.map((file) => (
                  <li key={file.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bb-tint text-[10px] font-bold uppercase text-bb-blue">
                        {(file.file_name.split(".").pop() || "file").slice(0, 4)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.label || file.file_name}</p>
                        <p className="text-xs text-bb-text-muted">
                          {[formatBytes(file.size_bytes), `v${file.version || "1.0"}`, file.download_access === "vip" ? "VIP download" : "Members download"].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.file_url ? <a href={file.file_url} className={btn.secondarySm} rel="noreferrer">Download</a> : null}
                      <button type="button" className={btn.dangerSm} disabled={removingFileId === file.id} onClick={() => onDeleteFile(file)}>
                        {removingFileId === file.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-bb-border px-4 py-6 text-center text-sm text-bb-text-muted">
                No files attached yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
