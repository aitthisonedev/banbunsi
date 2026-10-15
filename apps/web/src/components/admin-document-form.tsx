"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { CategoryNode, Locale, PublicSettings } from "@/lib/api";
import { Select } from "@/components/ui";
import { btn, panelClass } from "@/components/admin-documents-ui";
import { categoryCover } from "@/lib/category-covers";
import { suggestDocumentNumber } from "@/lib/form-defaults";

/** Guidance at the top of each form section, in the admin's language. */
const SECTION_GUIDE = {
  lo: {
    basic: "ເລກທີ, ໝວດ ແລະ ປີ ຖືກຕື່ມໃຫ້ແລ້ວ. ກວດສອບ ແລະ ປ່ຽນຖ້າຈຳເປັນ.",
    number: "ແນະນຳເລກທີຖັດໄປ ຕາມເອກະສານໃນໝວດທີ່ເລືອກ. ພິມເອງເພື່ອປ່ຽນ.",
    publishing: "ເລີ່ມເປັນສະບັບຮ່າງ; ເຜີຍແຜ່ເມື່ອເນື້ອຫາພ້ອມ. ສິດອ່ານກຳນົດວ່າໃຜອ່ານເນື້ອຫາເຕັມໄດ້.",
    content: "ໃສ່ຊື່ ແລະ ສະຫຼຸບໃນທັງສອງພາສາ ເພື່ອໃຫ້ເອກະສານສະແດງຖືກຕ້ອງໃນແຕ່ລະພາສາ.",
  },
  en: {
    basic: "Number, category and year are filled in for you. Check them and change if needed.",
    number: "Suggested next number, following documents in the selected category. Type to change it.",
    publishing: "Start as a draft and publish when the content is ready. Read access controls who can read the full text.",
    content: "Add a title and summary in both languages so the document shows correctly in each.",
  },
} as const;
import { RichTextField } from "@/components/rich-text-field";

/** Instructions shown inside empty content fields, written in the language of each section. */
const CONTENT_GUIDE = {
  lo: {
    title: "ຊື່ເອກະສານທີ່ຊັດເຈນ ເຊັ່ນ: ແບບຟອມໃບລາຍງານການເງິນ ປະຈຳໄຕມາດ",
    summary: "ສະຫຼຸບ 1–2 ປະໂຫຍກ: ເອກະສານນີ້ແມ່ນຫຍັງ ແລະ ໃຊ້ເພື່ອຫຍັງ.",
    body: "ຂຽນເນື້ອຫາເຕັມຂອງເອກະສານ: ຈຸດປະສົງ, ໃຜຄວນໃຊ້, ຂັ້ນຕອນ ຫຼື ລາຍລະອຽດສຳຄັນ ແລະ ແຫຼ່ງອ້າງອີງ. ໃຊ້ຫົວຂໍ້ ແລະ ລາຍການ ເພື່ອໃຫ້ອ່ານງ່າຍ.",
  },
  en: {
    title: "A clear document title, e.g. Quarterly financial statement template",
    summary: "One or two sentences: what this document is and what it is used for.",
    body: "Write the full document content: its purpose, who should use it, the key steps or details, and any references. Use headings and lists to make it easy to read.",
  },
} as const;
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
  defaults?: Pick<PublicSettings, "default_document_category" | "default_document_status" | "allowed_file_types" | "max_file_size_bytes" | "document_number_format" | "default_cover_url">;
  initial?: Partial<AdminDocumentPayload> & { id?: string };
  /** Existing documents (number + category), used to suggest the next document number. */
  existingDocuments?: Array<{ document_number?: string; category_id?: string }>;
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
  existingDocuments = [],
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

  const initialCategoryId = initial?.category_id || defaults?.default_document_category || flatCats[0]?.id || "";
  // Tracks the category picker so the default cover preview follows the selected category.
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const guide = SECTION_GUIDE[locale];
  // New documents get a suggested number that follows the selected category, until the admin types their own.
  const [docNumber, setDocNumber] = useState(
    initial?.document_number || (initial?.id ? "" : suggestDocumentNumber(existingDocuments, initialCategoryId, defaults?.document_number_format)),
  );
  const [autoNumber, setAutoNumber] = useState(!initial?.id);

  function onCategoryChange(value: string) {
    setCategoryId(value);
    if (autoNumber) setDocNumber(suggestDocumentNumber(existingDocuments, value, defaults?.document_number_format));
  }
  const [fallbackFailed, setFallbackFailed] = useState("");

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
  // Same fallback as the document list and detail page: default cover from Settings, then the category image.
  const selectedCategory = flatCats.find((c) => c.id === categoryId);
  const fallbackCover = defaults?.default_cover_url
    || categoryCover({ category_slug: selectedCategory?.slug, category_name: selectedCategory?.name }, initial?.id || categoryId || "new");
  const showUploaded = Boolean(coverSrc) && !coverFailed;
  // New documents start without any image and ask for one; existing documents preview the default/category cover.
  const isNewDocument = !initial?.id;
  const showFallback = !isNewDocument && !showUploaded && fallbackFailed !== fallbackCover;
  const addImagePrompt = locale === "lo" ? "ກະລຸນາເພີ່ມຮູບພາບ" : "Please add an image";
  const fileAccept = (defaults?.allowed_file_types || "pdf,doc,docx,xls,xlsx,csv,txt,zip")
    .split(",")
    .map((extension) => `.${extension.trim().replace(/^\./, "")}`)
    .join(",");
  const maxFileMb = Math.ceil((defaults?.max_file_size_bytes || 2 * 1024 * 1024) / (1024 * 1024));

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <FormSection title="Basic information" description={guide.basic}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t(locale, "documentNumber")} *`} hint={autoNumber ? guide.number : undefined}>
                <input
                  className="input"
                  name="document_number"
                  required
                  placeholder={defaults?.document_number_format || "DOC-2026-0001"}
                  value={docNumber}
                  onChange={(event) => {
                    setAutoNumber(false);
                    setDocNumber(event.target.value);
                  }}
                />
              </Field>
              <Field label="Category *">
                <Select
                  name="category_id"
                  required
                  defaultValue={initialCategoryId}
                  onChange={onCategoryChange}
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
          <FormSection title="Publishing" description={guide.publishing}>
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
                {showUploaded ? (
                  <Image
                    src={coverSrc}
                    alt="Document cover preview"
                    fill
                    sizes="(min-width: 1024px) 176px, 112px"
                    unoptimized
                    onError={() => setCoverFailed(true)}
                    className="object-cover"
                  />
                ) : showFallback ? (
                  <>
                    <Image
                      src={fallbackCover}
                      alt="Default cover preview"
                      fill
                      sizes="(min-width: 1024px) 176px, 112px"
                      unoptimized
                      onError={() => setFallbackFailed(fallbackCover)}
                      className="object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-[11px] font-medium text-white">
                      Default image
                    </span>
                  </>
                ) : isNewDocument && !coverSrc ? (
                  <label
                    htmlFor="document-cover-input"
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-bb-border px-2 text-center text-xs font-medium text-bb-text-muted hover:border-[var(--bb-blue)] hover:text-bb-blue"
                  >
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                      <circle cx="9" cy="10" r="1.6" />
                      <path d="M4 17l4.5-4.5 3.5 3.5 2.5-2.5L20 18.5" strokeLinejoin="round" />
                    </svg>
                    {addImagePrompt}
                  </label>
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
                    id="document-cover-input"
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
            ) : !showUploaded ? (
              <p className="text-xs text-bb-text-muted">
                {isNewDocument
                  ? `${addImagePrompt}. ${locale === "lo" ? "ຮູບນີ້ຈະເປັນໜ້າປົກຂອງເອກະສານ." : "It will be used as the document cover."}`
                  : "No cover uploaded yet. The website shows this default image until you choose one."}
              </p>
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
            { code: "lo" as const, heading: "Content — Lao", values: lo },
            { code: "en" as const, heading: "Content — English", values: en },
          ].map(({ code, heading, values }) => (
            <FormSection key={code} title={heading} description={guide.content}>
              <Field label="Title *">
                <input className="input" name={`${code}_title`} required placeholder={CONTENT_GUIDE[code].title} defaultValue={values?.title || ""} />
              </Field>
              <Field label="Summary" hint="A short description shown in document lists.">
                <textarea className="input min-h-20" name={`${code}_summary`} placeholder={CONTENT_GUIDE[code].summary} defaultValue={values?.summary || ""} />
              </Field>
              <div className="text-sm">
                <span id={`${code}-body-label`} className="mb-1 block font-medium">Body</span>
                <RichTextField
                  name={`${code}_body`}
                  locale={locale}
                  labelId={`${code}-body-label`}
                  defaultValue={values?.body_html || ""}
                  placeholder={CONTENT_GUIDE[code].body}
                />
                <span className="mt-1 block text-xs text-bb-text-muted">The full text readers see on the document page. Use headings and lists to organize it.</span>
              </div>
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
