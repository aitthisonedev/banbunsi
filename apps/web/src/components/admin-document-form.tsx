"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { CategoryNode, Locale } from "@/lib/api";
import { Select } from "@/components/ui";
import {
  clientCreateAdminDocument,
  clientUpdateAdminDocument,
  type AdminDocumentPayload,
} from "@/lib/client-api";
import { t } from "@/lib/i18n";

type Props = {
  locale: Locale;
  categories: CategoryNode[];
  isAdminPlus: boolean;
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const loTitle = String(fd.get("lo_title") || "");
    const enTitle = String(fd.get("en_title") || "");
    const loSlug = String(fd.get("lo_slug") || slugify(loTitle));
    const enSlug = String(fd.get("en_slug") || slugify(enTitle));
    const fileName = String(fd.get("file_name") || "").trim();

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
          label: String(fd.get("file_label") || fileName),
          file_name: fileName,
          mime: String(fd.get("file_mime") || "application/pdf"),
          size_bytes: Number(fd.get("file_size") || 0),
          language: "lo",
          version: String(fd.get("file_version") || "1.0"),
          download_access: String(fd.get("download_access") || "member"),
          sort_order: 0,
        },
      ];
    } else if (!initial?.id) {
      body.files = [];
    }

    try {
      if (initial?.id) {
        await clientUpdateAdminDocument(initial.id, body);
      } else {
        await clientCreateAdminDocument(body);
      }
      router.push(`/${locale}/admin/documents`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "documentNumber")}</span>
          <input
            className="input"
            name="document_number"
            required
            defaultValue={initial?.document_number || ""}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "categories")}</span>
          <Select
            name="category_id"
            required
            defaultValue={initial?.category_id || flatCats[0]?.id || ""}
            options={flatCats.map((c) => ({ value: c.id, label: c.name }))}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "readAccess")}</span>
          <Select
            name="read_access"
            defaultValue={initial?.read_access || "public"}
            options={[
              { value: "public", label: t(locale, "badgePublic") },
              { value: "member", label: t(locale, "badgeMember") },
              { value: "vip", label: t(locale, "badgeVip") },
            ]}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "status")}</span>
          {!isAdminPlus ? (
            <input type="hidden" name="status" value={initial?.status || "draft"} />
          ) : null}
          <Select
            name={isAdminPlus ? "status" : undefined}
            defaultValue={initial?.status || "draft"}
            disabled={!isAdminPlus}
            options={[
              { value: "draft", label: "draft" },
              { value: "published", label: "published" },
              { value: "archived", label: "archived" },
            ]}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "year")}</span>
          <input
            className="input"
            name="year"
            type="number"
            defaultValue={initial?.year || new Date().getFullYear()}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "effectiveDate")}</span>
          <input
            className="input"
            name="effective_date"
            type="date"
            defaultValue={(initial?.effective_date || "").toString().slice(0, 10)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "tags")}</span>
          <input className="input" name="tags" defaultValue={initial?.tags || ""} />
        </label>
      </div>

      <fieldset className="surface-panel space-y-3">
        <legend className="font-bold">Lao</legend>
        <input className="input" name="lo_title" required placeholder="Title" defaultValue={lo?.title || ""} />
        <input className="input" name="lo_slug" placeholder="slug" defaultValue={lo?.slug || ""} />
        <textarea className="input min-h-20" name="lo_summary" placeholder="Summary" defaultValue={lo?.summary || ""} />
        <textarea className="input min-h-40" name="lo_body" placeholder="Body HTML" defaultValue={lo?.body_html || ""} />
      </fieldset>

      <fieldset className="surface-panel space-y-3">
        <legend className="font-bold">English</legend>
        <input className="input" name="en_title" required placeholder="Title" defaultValue={en?.title || ""} />
        <input className="input" name="en_slug" placeholder="slug" defaultValue={en?.slug || ""} />
        <textarea className="input min-h-20" name="en_summary" placeholder="Summary" defaultValue={en?.summary || ""} />
        <textarea className="input min-h-40" name="en_body" placeholder="Body HTML" defaultValue={en?.body_html || ""} />
      </fieldset>

      <fieldset className="surface-panel space-y-3">
        <legend className="font-bold">{t(locale, "files")} (metadata)</legend>
        <input className="input" name="file_label" placeholder="Label" defaultValue={file0?.label || ""} />
        <input className="input" name="file_name" placeholder="file.pdf" defaultValue={file0?.file_name || ""} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" name="file_mime" placeholder="mime" defaultValue={file0?.mime || "application/pdf"} />
          <input className="input" name="file_size" type="number" placeholder="bytes" defaultValue={file0?.size_bytes || 0} />
          <input className="input" name="file_version" placeholder="1.0" defaultValue={file0?.version || "1.0"} />
        </div>
        <Select
          name="download_access"
          defaultValue={file0?.download_access || "member"}
          options={[
            { value: "member", label: t(locale, "badgeMember") },
            { value: "vip", label: t(locale, "badgeVip") },
          ]}
        />
      </fieldset>

      {error ? <p className="form-field-error">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? t(locale, "loading") : t(locale, "save")}
        </button>
        <Link href={`/${locale}/admin/documents`} className="btn-secondary">
          {t(locale, "cancel")}
        </Link>
      </div>
    </form>
  );
}
