"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import { btn, PageHeader, PageSkeleton, panelClass, StatePanel } from "@/components/admin-documents-ui";
import type { CategoryNode, PublicSettings } from "@/lib/api";
import { clientGetAdminDocument, clientGetPublicSettings, clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AdminEditDocumentPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const id = String(params.id || "");
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);
  const [defaults, setDefaults] = useState<PublicSettings | null>(null);
  const [isAdminPlus, setIsAdminPlus] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    clientMe()
      .catch(() => {
        router.replace(`/${locale}/auth/login`);
        return null;
      })
      .then(async (user) => {
        if (!user) return;
        if (!["editor", "admin", "owner"].includes(user.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setIsAdminPlus(user.staff_role === "admin" || user.staff_role === "owner");
        const [document, categoryResponse, settings] = await Promise.all([
          clientGetAdminDocument(id, locale),
          fetch(`${API_URL}/api/v1/admin/categories?locale=${locale}`, {
            credentials: "include",
          }).then(async (response) => {
            if (!response.ok) throw new Error("Could not load categories");
            return response.json();
          }),
          clientGetPublicSettings(),
        ]);
        setInitial(document);
        setCategories(categoryResponse.items || []);
        setDefaults(settings);
      })
      .catch((reason) => setLoadError(reason instanceof Error ? reason.message : t(locale, "loadError")));
  }, [id, locale, router]);

  const backLink = (
    <Link href={`/${locale}/admin/documents/${id}`} className="inline-flex items-center gap-1 text-sm text-bb-text-muted hover:text-[var(--bb-text)]">
      ← Back to document
    </Link>
  );

  if (loadError) {
    return (
      <div className="w-full max-w-7xl space-y-4">
        {backLink}
        <section className={panelClass}>
          <StatePanel
            tone="error"
            title="This document could not be opened for editing"
            description={loadError}
            action={<button type="button" className={btn.secondary} onClick={() => window.location.reload()}>Try again</button>}
          />
        </section>
      </div>
    );
  }
  if (!categories || !initial || !defaults) return <PageSkeleton />;

  const translations = (initial.translations || []) as Array<{
    locale: string;
    title: string;
    slug: string;
    summary: string;
    body_html: string;
  }>;
  const files = (initial.files || []) as Array<{
    id: string;
    label: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    version: string;
    download_access: string;
  }>;

  return (
    <div className="w-full max-w-7xl space-y-6">
      <PageHeader
        back={backLink}
        eyebrow={String(initial.document_number || "")}
        title={t(locale, "editDocument")}
        description={String(initial.title || "")}
      />
      <AdminDocumentForm
        locale={locale}
        categories={categories}
        isAdminPlus={isAdminPlus}
        defaults={defaults}
        initial={{
          id,
          document_number: String(initial.document_number || ""),
          category_id: String(initial.category_id || ""),
          cover_image_url: String(initial.cover_image_url || ""),
          read_access: String(initial.read_access || "public"),
          status: String(initial.status || "draft"),
          year: Number(initial.year || new Date().getFullYear()),
          tags: String(initial.tags || ""),
          effective_date: initial.effective_date
            ? String(initial.effective_date).slice(0, 10)
            : "",
          translations,
          files: files.map((file, index) => ({
            id: file.id,
            label: file.label,
            file_name: file.file_name,
            mime: file.mime,
            size_bytes: file.size_bytes,
            language: "lo",
            version: file.version,
            download_access: file.download_access,
            sort_order: index,
          })),
        }}
      />
    </div>
  );
}