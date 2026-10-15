"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { CategoryNode, Locale, PublicSettings } from "@/lib/api";
import { Select } from "@/components/ui";
import { btn, panelClass } from "@/components/admin-documents-ui";
import {
  clientCreateAdminDocument,
  clientDeleteAdminDocumentCover,
  clientUploadAdminDocumentCover,
  clientUpdateAdminDocument,
  type AdminDocumentPayload,
} from "@/lib/client-api";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
  categories: CategoryNode[];
  isAdminPlus: boolean;
  defaults?: Pick<PublicSettings, "default_document_category" | "default_document_status" | "allowed_file_types" | "max_file_size_bytes" | "document_number_format">;
  initial?: Partial<AdminDocumentPayload> & { id?: string };
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0e80-\u0eff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function AdminDocumentForm({
  locale,
  categories,
  isAdminPlus,
  defaults,
  initial,
}: Props) {
  const router = useRouter();
  const flatCats = useMemo(() => {
    const out: CategoryNode[] = [];
    for (const c of categories) {
      out.push(c);
      for (const child of c.children || []) out.push(child);
    }
    return out;
  }, [categories]);

  const lo = initial?.translations?.find((x) => x.locale === "lo");
  const en = initial?.translations?.find((x) => x.locale === "en");
  const file0 = initial?.files?.[0];

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  // Set once a new document is created, so a retry after a failed cover upload updates instead of duplicating.
  const [createdId, setCreatedId] = useState("");

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function onCoverChange(file: File | undefined) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = /\.(jpe?g|png|webp)$/i;
    if (
      (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image up to 2 MiB.");
      return;
    }
    setError("");
    setCoverFailed(false);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const loTitle = String(fd.get("lo_title") || "");
    const enTitle = String(fd.get("en_title") || "");
    const loSlug = String(fd.get("lo_slug") || slugify(loTitle));
    const enSlug = String(fd.get("en_slug") || slugify(enTitle));
    const uploadedFile = fd.get("file_upload");
    const fileNameInput = String(fd.get("file_name") || "").trim();
    let fileName = fileNameInput;
    let fileData = "";
    let fileMime = String(fd.get("file_mime") || "application/pdf");
    let fileSize = Number(fd.get("file_size") || 0);

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      const maximumBytes = defaults?.max_file_size_bytes || 2 * 1024 * 1024;
      const allowedExtensions = (defaults?.allowed_file_types || "pdf,doc,docx,xls,xlsx,csv,txt,zip")
        .split(",")
        .map((extension) => extension.trim().replace(/^\./, "").toLowerCase());
      const extension = uploadedFile.name.split(".").pop()?.toLowerCase() || "";
      if (!allowedExtensions.includes(extension)) {
        setError(`File type .${extension || "?"} is not allowed.`);
        setLoading(false);
        return;
      }
      if (uploadedFile.size > maximumBytes) {
        setError(`File exceeds the configured ${Math.ceil(maximumBytes / (1024 * 1024))} MiB limit.`);
        setLoading(false);
        return;
      }
      fileName = uploadedFile.name.trim() || fileName;
      fileMime = uploadedFile.type || fileMime;
      fileSize = uploadedFile.size;
      const buffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      fileData = `data:${fileMime};base64,${btoa(binary)}`;
    }

    const body: AdminDocumentPayload = {
      document_number: String(fd.get("document_number") || ""),
      category_id: String(fd.get("category_id") || ""),
      read_access: String(fd.get("read_access") || "public"),
      status: String(fd.get("status") || "draft"),
      effective_date: String(fd.get("effective_date") || "") || null,
      year: Number(fd.get("year") || new Date().getFullYear()),
      tags: String(fd.get("tags") || ""),
      translations: [
        {
          locale: "lo",
          title: loTitle,
          slug: loSlug,
          summary: String(fd.get("lo_summary") || ""),
          body_html: String(fd.get("lo_body") || ""),
          seo_title: loTitle,
        },
        {
          locale: "en",
          title: enTitle,
          slug: enSlug,
          summary: String(fd.get("en_summary") || ""),
          body_html: String(fd.get("en_body") || ""),
          seo_title: enTitle,
        },
      ],
    };
    // Omit files on update when empty so API does not wipe existing rows.
    if (fileName) {
      body.files = [
        {
          ...(file0?.id ? { id: file0.id } : {}),
          label: String(fd.get("file_label") || fileName),
          file_name: fileName,
          mime: fileMime,
          size_bytes: fileSize,
          language: "lo",
          version: String(fd.get("file_version") || "1.0"),
          download_access: String(fd.get("download_access") || "member"),
          sort_order: 0,
          ...(fileData ? { file_data: fileData } : {}),
        },
      ];
    } else if (!initial?.id) {
      body.files = [];
    }

    try {
      let documentId = initial?.id || createdId;
      if (documentId) {
        await clientUpdateAdminDocument(documentId, body);
      } else {
        const created = await clientCreateAdminDocument(body);
        documentId = String(created.id || "");
        setCreatedId(documentId);
      }
      if (documentId && coverFile) {
        try {
          await clientUploadAdminDocumentCover(documentId, coverFile);
        } catch (err) {
          const reason = err instanceof Error ? err.message : "Upload failed";
          throw new Error(`Document saved, but the cover could not be uploaded: ${reason}`);
        }
      } else if (documentId && removeCover && initial?.cover_image_url) {
        await clientDeleteAdminDocumentCover(documentId);
      }
      router.push(
        documentId
          ? `/${locale}/admin/documents/${documentId}`
          : `/${locale}/admin/documents`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const cancelHref = initial?.id ? `/${locale}/admin/documents/${initial.id}` : `/${locale}/admin/documents`;
  const coverSrc = coverPreview || (!removeCover ? initial?.cover_image_url || "" : "");
  const fileAccept = (defaults?.allowed_file_types || "pdf,doc,docx,xls,xlsx,csv,txt,zip")
    .split(",")
    .map((extension) => `.${extension.trim().replace(/^\./, "")}`)
    .join(",");
  const maxFileMb = Math.ceil((defaults?.max_file_size_bytes || 2 * 1024 * 1024) / (1024 * 1024));

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <FormSection title="Basic information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t(locale, "documentNumber")} *`}>
                <input
                  className="input"
                  name="document_number"
                  required
                  placeholder={defaults?.document_number_format || "DOC-2026-0001"}
                  defaultValue={initial?.document_number || ""}
                />
              </Field>
              <Field label="Category *">
                <Select
                  name="category_id"
                  required
                  defaultValue={initial?.category_id || defaults?.default_document_category || flatCats[0]?.id || ""}
                  options={flatCats.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Field>
              <Field label={t(locale, "year")}>
                <input className="input" name="year" type="number" defaultValue={initial?.year || new Date().getFullYear()} />
              </Field>
              <Field label={t(locale, "effectiveDate")}>
                <input
                  className="input"
                  name="effective_date"
                  type="date"
                  defaultValue={(initial?.effective_date || "").toString().slice(0, 10)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t(locale, "tags")} hint="Separate tags with commas, e.g. tax, 2026, VAT">
                  <input className="input" name="tags" defaultValue={initial?.tags || ""} />
                </Field>
              </div>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <FormSection title="Publishing">
            <Field label={t(locale, "status")} hint={isAdminPlus ? undefined : "Only admins can change the status."}>
              {!isAdminPlus ? (
                <input type="hidden" name="status" value={initial?.status || defaults?.default_document_status || "draft"} />
              ) : null}
              <Select
                name={isAdminPlus ? "status" : undefined}
                defaultValue={initial?.status || defaults?.default_document_status || "draft"}
                disabled={!isAdminPlus}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </Field>
            <Field label={t(locale, "readAccess")} hint="Who can read this document on the website.">
              <Select
                name="read_access"
                defaultValue={initial?.read_access || "public"}
                options={[
                  { value: "public", label: t(locale, "badgePublic") },
                  { value: "member", label: t(locale, "badgeMember") },
                  { value: "vip", label: t(locale, "badgeVip") },
                ]}
              />
            </Field>
          </FormSection>

          <FormSection title="Cover image" description="JPG, PNG or WebP, up to 2 MB. Best size: 1200 × 1600 px.">
            <div className="flex items-start gap-4 lg:flex-col lg:items-stretch">
              <div className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-md border border-bb-border bg-bb-muted lg:mx-auto lg:w-44">
                {coverSrc && !coverFailed ? (
                  <Image
                    src={coverSrc}
                    alt="Document cover preview"
                    fill
                    sizes="(min-width: 1024px) 176px, 112px"
                    unoptimized
                    onError={() => setCoverFailed(true)}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-bb-text-muted">
                    {coverSrc ? "Preview unavailable" : "No cover"}
                  </div>
                )}
                {coverFile ? (
                  <span className="absolute left-2 top-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Not saved yet</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className={`${btn.secondarySm} cursor-pointer`}>
                  {coverSrc ? "Replace image" : "Choose image"}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      onCoverChange(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {coverFile || (initial?.cover_image_url && !removeCover) ? (
                  <button
                    className={btn.dangerSm}
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview("");
                      setCoverFailed(false);
                      setRemoveCover(true);
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            {removeCover && initial?.cover_image_url ? (
              <p className="text-xs text-bb-text-muted">The cover will be removed when you save.</p>
            ) : null}
          </FormSection>

          <FormSection title="Attachment" description={`Allowed: ${fileAccept.replaceAll(",", ", ")} · up to ${maxFileMb} MB`}>
            {file0?.file_name ? (
              <p className="rounded-lg bg-bb-muted px-3 py-2 text-sm">
                Current file: <span className="font-medium">{file0.file_name}</span>
              </p>
            ) : null}
            <Field label={file0?.file_name ? "Upload a replacement" : "Upload file"}>
              <input className="input text-sm" type="file" name="file_upload" accept={fileAccept} />
            </Field>
            <Field label="Display name">
              <input className="input" name="file_label" placeholder="e.g. Full document (PDF)" defaultValue={file0?.label || ""} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Version">
                <input className="input" name="file_version" placeholder="1.0" defaultValue={file0?.version || "1.0"} />
              </Field>
              <Field label="Who can download">
                <Select
                  name="download_access"
                  defaultValue={file0?.download_access || "member"}
                  options={[
                    { value: "member", label: t(locale, "badgeMember") },
                    { value: "vip", label: t(locale, "badgeVip") },
                  ]}
                />
              </Field>
            </div>
            <details className="rounded-lg border border-bb-border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-bb-text-muted">Advanced file details</summary>
              <p className="mt-2 text-xs text-bb-text-muted">Filled in automatically when you upload a file.</p>
              <div className="mt-3 space-y-3">
                <Field label="File name">
                  <input className="input" name="file_name" placeholder="file.pdf" defaultValue={file0?.file_name || ""} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="File type">
                    <input className="input" name="file_mime" placeholder="application/pdf" defaultValue={file0?.mime || "application/pdf"} />
                  </Field>
                  <Field label="Size (bytes)">
                    <input className="input" name="file_size" type="number" defaultValue={file0?.size_bytes || 0} />
                  </Field>
                </div>
              </div>
            </details>
          </FormSection>
        </div>
        <div className="space-y-6 lg:col-start-1 lg:row-start-2">
          {[
            { code: "lo", heading: "Content — Lao", values: lo },
            { code: "en", heading: "Content — English", values: en },
          ].map(({ code, heading, values }) => (
            <FormSection key={code} title={heading}>
              <Field label="Title *">
                <input className="input" name={`${code}_title`} required defaultValue={values?.title || ""} />
              </Field>
              <Field label="Summary" hint="A short description shown in document lists.">
                <textarea className="input min-h-20" name={`${code}_summary`} defaultValue={values?.summary || ""} />
              </Field>
              <Field label="Body">
                <textarea className="input min-h-40 font-mono text-sm" name={`${code}_body`} defaultValue={values?.body_html || ""} />
              </Field>
              <details className="group rounded-lg border border-bb-border px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium text-bb-text-muted">Web address (optional)</summary>
                <div className="mt-3">
                  <Field label="URL slug" hint="Leave blank to create it from the title.">
                    <input className="input" name={`${code}_slug`} defaultValue={values?.slug || ""} />
                  </Field>
                </div>
              </details>
            </FormSection>
          ))}
        </div>

      </div>

      <div className="sticky bottom-0 z-10 -mx-1 rounded-t-xl border-t border-bb-border bg-[var(--bb-surface)]/95 px-4 py-3 backdrop-blur">
        {error ? (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{error}</p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Link href={cancelHref} className={btn.secondary}>
            {t(locale, "cancel")}
          </Link>
          <button className={btn.primary} type="submit" disabled={loading}>
            {loading ? "Saving…" : initial?.id ? "Save changes" : "Create document"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`${panelClass} space-y-4 p-5`}>
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-bb-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-bb-text-muted">{hint}</span> : null}
    </label>
  );
}
