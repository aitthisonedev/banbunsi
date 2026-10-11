"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
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
  slug?: string;
  document_number?: string;
  status?: string;
  read_access?: string;
  category_name?: string;
  year?: number;
  files?: Array<{ id: string; label?: string }>;
  published_at?: string;
  updated_at?: string;
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [canDelete, setCanDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      setIsDeleting(id);
      await clientDeleteAdminDocument(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setIsDeleting(null);
    }
  }

  // Filter items based on access & status filters
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (accessFilter !== "all") {
        const itemAccess = item.read_access || "public";
        if (itemAccess !== accessFilter) return false;
      }
      if (statusFilter !== "all") {
        const itemStatus = item.status || "draft";
        if (itemStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [items, accessFilter, statusFilter]);

  if (error) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  // Metric stats
  const totalCount = items.length;
  const publishedCount = items.filter((d) => d.status === "published").length;
  const draftCount = items.filter((d) => d.status === "draft").length;
  const vipCount = items.filter((d) => d.read_access === "vip").length;

  return (
    <div className="w-full space-y-5">
      {/* 1. Header (Title & Action Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t(locale, "adminDocuments")}
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
            {totalCount} {locale === "lo" ? "ລາຍການ" : "items"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/${locale}/admin/documents/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
          >
            <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t(locale, "newDocument")}</span>
          </Link>
        </div>
      </div>

      {/* 2. DashLite Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <button
          type="button"
          onClick={() => {
            setAccessFilter("all");
            setStatusFilter("all");
          }}
          className={`flex items-center gap-3 p-4 rounded-xl border transition text-left cursor-pointer ${
            accessFilter === "all" && statusFilter === "all"
              ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {totalCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {locale === "lo" ? "ເອກະສານທັງໝົດ" : "All Documents"}
            </div>
          </div>
        </button>

        {/* Card 2: Published */}
        <button
          type="button"
          onClick={() => setStatusFilter("published")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition text-left cursor-pointer ${
            statusFilter === "published"
              ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {publishedCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {locale === "lo" ? "ເຜີຍແຜ່ແລ້ວ" : "Published"}
            </div>
          </div>
        </button>

        {/* Card 3: VIP Access */}
        <button
          type="button"
          onClick={() => setAccessFilter("vip")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition text-left cursor-pointer ${
            accessFilter === "vip"
              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-base">
            👑
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {vipCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {locale === "lo" ? "ສະເພາະ VIP" : "VIP Exclusive"}
            </div>
          </div>
        </button>

        {/* Card 4: Drafts */}
        <button
          type="button"
          onClick={() => setStatusFilter("draft")}
          className={`flex items-center gap-3 p-4 rounded-xl border transition text-left cursor-pointer ${
            statusFilter === "draft"
              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500/30"
              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {draftCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {locale === "lo" ? "ສະບັບຮ່າງ" : "Drafts"}
            </div>
          </div>
        </button>
      </div>

      {/* 3. Main Data Card with Toolbar and Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Search bar */}
          <form
            className="relative flex items-center w-full md:w-80"
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
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
                onClick={() => {
                  setQ("");
                  load("");
                }}
                title="Clear"
              >
                ✕
              </button>
            ) : null}
          </form>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Access Filter Pills */}
            <div className="inline-flex items-center rounded-lg border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
              <button
                type="button"
                onClick={() => setAccessFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  accessFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {locale === "lo" ? "ທັງໝົດ" : "All"}
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("public")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  accessFilter === "public"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("member")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  accessFilter === "member"
                    ? "bg-cyan-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("vip")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  accessFilter === "vip"
                    ? "bg-amber-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                👑 VIP
              </button>
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "published" | "draft")
              }
              aria-label="Filter status"
              className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="all">
                {locale === "lo" ? "ທຸກສະຖານະ" : "All Status"}
              </option>
              <option value="published">
                {locale === "lo" ? "● ເຜີຍແຜ່ແລ້ວ" : "● Published"}
              </option>
              <option value="draft">
                {locale === "lo" ? "● ສະບັບຮ່າງ" : "● Draft"}
              </option>
            </select>

            {/* Reset Filters button if any active */}
            {(accessFilter !== "all" || statusFilter !== "all" || q) && (
              <button
                type="button"
                onClick={() => {
                  setAccessFilter("all");
                  setStatusFilter("all");
                  setQ("");
                  load("");
                }}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Reset filters"
              >
                {locale === "lo" ? "ລ້າງຕົວກອງ" : "Reset"}
              </button>
            )}
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mb-3">
                📄
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {t(locale, "noDocuments")}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {locale === "lo"
                  ? "ບໍ່ພົບຂໍ້ມູນເອກະສານທີ່ຕົງກັບເງື່ອນໄຂຄົ້ນຫາ"
                  : "No documents found matching the filter."}
              </p>
              {(accessFilter !== "all" || statusFilter !== "all" || q) && (
                <button
                  type="button"
                  onClick={() => {
                    setAccessFilter("all");
                    setStatusFilter("all");
                    setQ("");
                    load("");
                  }}
                  className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  {locale === "lo" ? "ລ້າງການຄົ້ນຫາ" : "Clear filters"}
                </button>
              )}
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
                    {/* Document Info Column */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold shadow-xs ${
                            row.read_access === "vip"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30"
                              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30"
                          }`}
                        >
                          📄
                        </span>
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/${locale}/admin/documents/${row.id}`}
                            className="font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate max-w-sm sm:max-w-md lg:max-w-lg"
                          >
                            {row.title || "—"}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {row.document_number ? (
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                {row.document_number}
                              </span>
                            ) : null}
                            {row.year ? (
                              <span className="text-[10px] text-slate-400">
                                {row.year}
                              </span>
                            ) : null}
                            {row.files && row.files.length > 0 ? (
                              <span className="text-[10px] text-slate-400 font-medium">
                                📎 {row.files.length}{" "}
                                {locale === "lo" ? "ໄຟລ໌" : "file(s)"}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                        {row.category_name || "—"}
                      </span>
                    </td>

                    {/* Access Tier Column */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize border ${
                          row.read_access === "vip"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/40"
                            : row.read_access === "member"
                              ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/70 dark:border-cyan-800/40"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/40"
                        }`}
                      >
                        {row.read_access === "vip" && "👑 "}
                        {row.read_access || "public"}
                      </span>
                    </td>

                    {/* Status Dot Column */}
                    <td className="px-4 sm:px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          row.status === "published"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.status === "published"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {row.status === "published"
                          ? locale === "lo"
                            ? "ເຜີຍແຜ່ແລ້ວ"
                            : "Published"
                          : locale === "lo"
                            ? "ສະບັບຮ່າງ"
                            : "Draft"}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 sm:px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View public document if published */}
                        {row.status === "published" && (
                          <Link
                            href={`/${locale}/documents/${row.slug || row.id}`}
                            target="_blank"
                            className="inline-flex items-center p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={
                              locale === "lo"
                                ? "ເບິ່ງໜ້າສາທາລະນະ"
                                : "View Public"
                            }
                          >
                            <svg
                              viewBox="0 0 20 20"
                              width="14"
                              height="14"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Link>
                        )}

                        {/* Edit Button */}
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

                        {/* Delete Button */}
                        {canDelete ? (
                          <button
                            type="button"
                            disabled={isDeleting === row.id}
                            className="inline-flex items-center p-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer disabled:opacity-50"
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

        {/* Footer info */}
        {filteredItems.length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div>
              {locale === "lo" ? (
                <>
                  ສະແດງ{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {filteredItems.length}
                  </span>{" "}
                  ຈາກທັງໝົດ{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {totalCount}
                  </span>{" "}
                  ລາຍການ
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {filteredItems.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {totalCount}
                  </span>{" "}
                  documents
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {publishedCount} {locale === "lo" ? "ເຜີຍແຜ່ແລ້ວ" : "published"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
