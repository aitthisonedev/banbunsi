"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import { LoadingState } from "@/components/ui";
import type { CategoryNode } from "@/lib/api";
import { clientGetAdminDocument, clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminEditDocumentPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const id = String(params.id || "");
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);
  const [isAdminPlus, setIsAdminPlus] = useState(false);

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setIsAdminPlus(u.staff_role === "admin" || u.staff_role === "owner");
        const [doc, catRes] = await Promise.all([
          clientGetAdminDocument(id, locale),
          fetch(`${API_URL}/api/v1/admin/categories?locale=${locale}`, {
            credentials: "include",
          }).then((r) => r.json()),
        ]);
        setInitial(doc);
        setCategories(catRes.items || []);
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [id, locale, router]);

  if (!categories || !initial) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  const translations = (initial.translations || []) as Array<{
    locale: string;
    title: string;
    slug: string;
    summary: string;
    body_html: string;
  }>;
  const files = (initial.files || []) as Array<{
    label: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    version: string;
    download_access: string;
  }>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{t(locale, "editDocument")}</h1>
      <AdminDocumentForm
        locale={locale}
        categories={categories}
        isAdminPlus={isAdminPlus}
        initial={{
          id,
          document_number: String(initial.document_number || ""),
          category_id: String(initial.category_id || ""),
          read_access: String(initial.read_access || "public"),
          status: String(initial.status || "draft"),
          year: Number(initial.year || new Date().getFullYear()),
          tags: String(initial.tags || ""),
          effective_date: initial.effective_date
            ? String(initial.effective_date).slice(0, 10)
            : "",
          translations,
          files: files.map((f, i) => ({
            label: f.label,
            file_name: f.file_name,
            mime: f.mime,
            size_bytes: f.size_bytes,
            language: "lo",
            version: f.version,
            download_access: f.download_access,
            sort_order: i,
          })),
        }}
      />
    </div>
  );
}
