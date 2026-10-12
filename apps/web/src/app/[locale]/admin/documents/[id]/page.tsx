"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import { LoadingState } from "@/components/ui";
import type { CategoryNode } from "@/lib/api";
import { clientGetAdminDocument, clientMe } from "@/lib/client-api";
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

  const currentTr =
    translations.find((x) => x.locale === locale) || translations[0];
  const docTitle =
    currentTr?.title ||
    String(initial.document_number || t(locale, "editDocument"));
  const docSlug = currentTr?.slug;
  const isPublished = initial.status === "published";
  const readAccess = String(initial.read_access || "public");

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Breadcrumb & Quick Actions */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <Link
            href={`/${locale}/admin/documents`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 font-medium"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t(locale, "adminDocuments")}</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs">
            {String(initial.document_number || id.slice(0, 8))}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs shrink-0 border ${
                readAccess === "vip"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/40"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40"
              }`}
            >
              📄
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {docTitle}
                </h1>
                {/* Status Dot */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPublished
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPublished ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {String(initial.status || "draft")}
                </span>

                {/* Read Access Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                    readAccess === "vip"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : readAccess === "member"
                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {readAccess === "vip" && "👑 "}
                  {readAccess}
                </span>
              </div>

              {initial.document_number ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    #{String(initial.document_number)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-400">ID: {id}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isPublished && (
              <Link
                href={`/${locale}/documents/${docSlug || id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition shadow-xs cursor-pointer"
              >
                <svg
                  viewBox="0 0 20 20"
                  width="13"
                  height="13"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {locale === "lo" ? "ເບິ່ງໜ້າສາທາລະນະ" : "View Public"}
                </span>
              </Link>
            )}

            <Link
              href={`/${locale}/admin/documents`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs"
            >
              ← {locale === "lo" ? "ກັບຄືນ" : "Back to list"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Document Form */}
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
          cover_image: String(initial.cover_image || ""),
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
