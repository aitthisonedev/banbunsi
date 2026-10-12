"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import { LoadingState } from "@/components/ui";
import type { CategoryNode } from "@/lib/api";
import { clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AdminNewDocumentPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [isAdminPlus, setIsAdminPlus] = useState(false);

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setIsAdminPlus(u.staff_role === "admin" || u.staff_role === "owner");
        const res = await fetch(
          `${API_URL}/api/v1/admin/categories?locale=${locale}`,
          { credentials: "include" },
        );
        const data = await res.json();
        setCategories(data.items || []);
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [locale, router]);

  if (!categories) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Breadcrumb & Back button */}
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
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {t(locale, "newDocument")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-bold shadow-xs border border-indigo-100 dark:border-indigo-900/40">
              📄
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t(locale, "newDocument")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {locale === "lo"
                  ? "ເພີ່ມເອກະສານ, ແບບຟອມ, ຫຼື ລະບຽບການໃໝ່ເຂົ້າໃນລະບົບ"
                  : "Create and publish a new document, form, or regulation."}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/admin/documents`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start sm:self-auto shadow-xs"
          >
            ← {locale === "lo" ? "ກັບຄືນ" : "Back to list"}
          </Link>
        </div>
      </div>

      {/* 2. Form Component */}
      <AdminDocumentForm
        locale={locale}
        categories={categories}
        isAdminPlus={isAdminPlus}
      />
    </div>
  );
}
