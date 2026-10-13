"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui";
import {
  clientDeleteAdminDocument,
  clientListAdminDocuments,
  clientMe,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

type Row = {
  id: string;
  title?: string;
  document_number?: string;
  status?: string;
  read_access?: string;
  category_name?: string;
  files?: Array<{ id: string; label?: string }>;
};

export default function AdminDocumentsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [accessFilter, setAccessFilter] = useState<
    "all" | "public" | "member" | "vip"
  >("all");
  const [canDelete, setCanDelete] = useState(false);

  async function load(query = q) {
    const data = await clientListAdminDocuments(locale, query);
    setItems(data.items as Row[]);
  }

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        setCanDelete(u.staff_role === "admin" || u.staff_role === "owner");
        await load("");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function onDelete(id: string) {
    if (!confirm(t(locale, "deleteConfirm"))) return;
    try {
      await clientDeleteAdminDocument(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    }
  }

  if (error) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  // Filter items by access if needed
  const filteredItems = items.filter((item) => {
    if (accessFilter === "all") return true;
    return (item.read_access || "public") === accessFilter;
  });

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t(locale, "adminDocuments")}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              {items.length} {locale === "lo" ? "ລາຍການ" : "items"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {locale === "lo"
              ? "ລາຍການເອກະສານ, ແບບຟອມ ແລະ ລະບຽບການທັງໝົດໃນລະບົບ"
              : "Manage, edit and publish legal, accounting and tax documents."}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/documents/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{t(locale, "newDocument")}</span>
        </Link>
      </div>

      {/* 2. Main Card with Search, Filter & Table */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <form
            className="relative flex items-center w-full sm:w-80"
            onSubmit={(e) => {
              e.preventDefault();
              load(q).catch((err) =>
                setError(
                  err instanceof Error ? err.message : t(locale, "loadError"),
                ),
              );
            }}
          >
            <svg
              className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5l4 4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                locale === "lo"
                  ? "ຄົ້ນຫາຊື່, ເລກທີເອກະສານ..."
                  : "Search title or number..."
              }
            />
            {q ? (
              <button
                type="button"
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                onClick={() => {
                  setQ("");
                  load("");
                }}
              >
                ✕
              </button>
            ) : null}
          </form>

          {/* Filter Pills (All / Public / Member / VIP) */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setAccessFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                accessFilter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {locale === "lo" ? "ທັງໝົດ" : "All"} ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setAccessFilter("public")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                accessFilter === "public"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setAccessFilter("member")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                accessFilter === "member"
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setAccessFilter("vip")}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                accessFilter === "vip"
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              👑 VIP
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-3xl block mb-2">📄</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t(locale, "noDocuments")}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {locale === "lo"
                  ? "ບໍ່ພົບຂໍ້ມູນເອກະສານທີ່ຕົງກັບເງື່ອນໄຂຄົ້ນຫາ"
                  : "No documents found matching the filter."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3">
                    {locale === "lo" ? "ເອກະສານ" : "Document"}
                  </th>
                  <th className="px-4 sm:px-5 py-3">
                    {t(locale, "categories")}
                  </th>
                  <th className="px-4 sm:px-5 py-3">
                    {locale === "lo" ? "ການເຂົ້າເຖິງ" : "Access"}
                  </th>
                  <th className="px-4 sm:px-5 py-3">{t(locale, "status")}</th>
                  <th className="px-4 sm:px-5 py-3 text-right">
                    {locale === "lo" ? "ຈັດການ" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredItems.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    {/* Document Info */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-sm font-bold shadow-xs">
                          📄
                        </span>
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/${locale}/admin/documents/${row.id}`}
                            className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate max-w-md"
                          >
                            {row.title || "—"}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {row.document_number ? (
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                {row.document_number}
                              </span>
                            ) : null}
                            {row.files && row.files.length > 0 ? (
                              <span className="text-[10px] text-slate-400">
                                📎 {row.files.length}{" "}
                                {locale === "lo" ? "ໄຟລ໌" : "file(s)"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {row.category_name || "—"}
                      </span>
                    </td>

                    {/* Access Tier */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                          row.read_access === "vip"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : row.read_access === "member"
                              ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {row.read_access === "vip" && "👑 "}
                        {row.read_access || "public"}
                      </span>
                    </td>

                    {/* Status Dot */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          row.status === "published"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-500"
                        }`}
                      >
                        ● {row.status || "draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${locale}/admin/documents/${row.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                          title={t(locale, "edit")}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            width="13"
                            height="13"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          <span>{t(locale, "edit")}</span>
                        </Link>

                        {canDelete ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            onClick={() => onDelete(row.id)}
                            title={t(locale, "delete")}
                          >
                            <svg
                              viewBox="0 0 20 20"
                              width="13"
                              height="13"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
