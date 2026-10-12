"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { CategoryNode, Locale } from "@/lib/api";
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

  const [activeLang, setActiveLang] = useState<"lo" | "en">("lo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Controlled slug states for auto-generation helper
  const [loTitle, setLoTitle] = useState(lo?.title || "");
  const [loSlug, setLoSlug] = useState(lo?.slug || "");
  const [enTitle, setEnTitle] = useState(en?.title || "");
  const [enSlug, setEnSlug] = useState(en?.slug || "");

  function generateLoSlug() {
    setLoSlug(slugify(loTitle));
  }

  function generateEnSlug() {
    setEnSlug(slugify(enTitle));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const resolvedLoTitle = String(fd.get("lo_title") || loTitle || "");
    const resolvedEnTitle = String(fd.get("en_title") || enTitle || "");
    const resolvedLoSlug = String(
      fd.get("lo_slug") || loSlug || slugify(resolvedLoTitle),
    );
    const resolvedEnSlug = String(
      fd.get("en_slug") || enSlug || slugify(resolvedEnTitle),
    );
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
          title: resolvedLoTitle,
          slug: resolvedLoSlug,
          summary: String(fd.get("lo_summary") || ""),
          body_html: String(fd.get("lo_body") || ""),
          seo_title: resolvedLoTitle,
        },
        {
          locale: "en",
          title: resolvedEnTitle,
          slug: resolvedEnSlug,
          summary: String(fd.get("en_summary") || ""),
          body_html: String(fd.get("en_body") || ""),
          seo_title: resolvedEnTitle,
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
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
          <span className="text-base shrink-0">⚠️</span>
          <div className="flex-1">
            <span className="font-semibold block">
              {locale === "lo" ? "ເກີດຂໍ້ຜິດພາດ" : "Error saving document"}
            </span>
            <span className="mt-0.5 block">{error}</span>
          </div>
        </div>
      )}

      {/* 1. General Information Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shadow-xs">
              01
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo" ? "ຂໍ້ມູນພື້ນຖານເອກະສານ" : "General Information"}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {locale === "lo"
              ? "ຂໍ້ມູນຫຼັກຂອງເອກະສານ"
              : "Core document metadata"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Document Number */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "documentNumber")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs font-mono"
                name="document_number"
                required
                placeholder="e.g. DOC-2024-001"
                defaultValue={initial?.document_number || ""}
              />
            </div>

            {/* Category */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "categories")}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                name="category_id"
                required
                defaultValue={initial?.category_id || flatCats[0]?.id || ""}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs cursor-pointer"
              >
                {flatCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Read Access Tier */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "readAccess")}
              </label>
              <select
                name="read_access"
                defaultValue={initial?.read_access || "public"}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs cursor-pointer"
              >
                <option value="public">
                  🌐 Public ({locale === "lo" ? "ທຸກຄົນອ່ານໄດ້" : "Everyone"})
                </option>
                <option value="member">
                  👤 Member (
                  {locale === "lo" ? "ສະເພາະສະມາຊິກ" : "Members only"})
                </option>
                <option value="vip">
                  👑 VIP ({locale === "lo" ? "ສະເພາະ VIP" : "VIP tier only"})
                </option>
              </select>
            </div>

            {/* Status */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "status")}
              </label>
              {!isAdminPlus && (
                <input
                  type="hidden"
                  name="status"
                  value={initial?.status || "draft"}
                />
              )}
              <select
                name={isAdminPlus ? "status" : undefined}
                defaultValue={initial?.status || "draft"}
                disabled={!isAdminPlus}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                <option value="draft">
                  ● {locale === "lo" ? "ສະບັບຮ່າງ (draft)" : "Draft"}
                </option>
                <option value="published">
                  ● {locale === "lo" ? "ເຜີຍແຜ່ແລ້ວ (published)" : "Published"}
                </option>
                <option value="archived">
                  ● {locale === "lo" ? "ເກັບໄວ້ (archived)" : "Archived"}
                </option>
              </select>
            </div>

            {/* Year */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ປີເອກະສານ" : "Year"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="year"
                type="number"
                placeholder="2024"
                defaultValue={initial?.year || new Date().getFullYear()}
              />
            </div>

            {/* Effective Date */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "effectiveDate")}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="effective_date"
                type="date"
                defaultValue={(initial?.effective_date || "")
                  .toString()
                  .slice(0, 10)}
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(locale, "tags")}
                <span className="ml-1 text-[11px] font-normal text-slate-400">
                  {locale === "lo"
                    ? "(ແຍກດ້ວຍຈຸດ , ເຊັ່ນ: ພາສີ, ອາກອນ, ບັນຊີ)"
                    : "(Comma separated tags)"}
                </span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="tags"
                placeholder={
                  locale === "lo"
                    ? "ພາສີ, ບັນຊີ, ກົດໝາຍ"
                    : "tax, accounting, legal"
                }
                defaultValue={initial?.tags || ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Translations & Content Card with Language Tabs */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        {/* Card Header with Language Tabs */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shadow-xs">
              02
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo"
                ? "ເນື້ອໃນ ແລະ ບົດຄວາມເອກະສານ"
                : "Content & Translations"}
            </h2>
          </div>

          {/* Language Switcher Tabs */}
          <div className="inline-flex items-center rounded-lg border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveLang("lo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                activeLang === "lo"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>🇱🇦</span>
              <span>ພາສາລາວ (Lao)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLang("en")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                activeLang === "en"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Lao Content */}
        <div
          className={`p-5 sm:p-6 space-y-4 ${activeLang === "lo" ? "block" : "hidden"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>🇱🇦</span>{" "}
              <span>
                {locale === "lo"
                  ? "ເນື້ອໃນພາສາລາວ (ບັງຄັບ)"
                  : "Lao Translation (Required)"}
              </span>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຫົວຂໍ້ເອກະສານ (ລາວ)" : "Lao Title"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="lo_title"
                required
                placeholder="ປ້ອນຫົວຂໍ້ເອກະສານ..."
                value={loTitle}
                onChange={(e) => setLoTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Slug (URL Path)
                </label>
                <button
                  type="button"
                  onClick={generateLoSlug}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {locale === "lo"
                    ? "⚡ ສ້າງ Slug ອັດຕະໂນມັດ"
                    : "⚡ Generate from Title"}
                </button>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 overflow-hidden">
                <span className="px-3 py-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shrink-0 font-mono">
                  /documents/
                </span>
                <input
                  className="w-full px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                  name="lo_slug"
                  placeholder="lao-document-slug"
                  value={loSlug}
                  onChange={(e) => setLoSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ບົດສະຫຼຸບຫຍໍ້ (Summary)" : "Summary"}
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs min-h-[75px]"
                name="lo_summary"
                placeholder={
                  locale === "lo"
                    ? "ບົດສະຫຼຸບເນື້ອໃນຫຍໍ້ຂອງເອກະສານ..."
                    : "Brief summary..."
                }
                defaultValue={lo?.summary || ""}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {locale === "lo"
                    ? "ເນື້ອໃນລະອຽດ (Body HTML)"
                    : "Body HTML Content"}
                </label>
                <span className="text-[10px] text-slate-400">
                  {locale === "lo"
                    ? "ຮອງຮັບ HTML tags (<p>, <h3>, <ul>, <table>...)"
                    : "Supports HTML"}
                </span>
              </div>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs min-h-[160px]"
                name="lo_body"
                placeholder="<p>ເນື້ອໃນເອກະສານ...</p>"
                defaultValue={lo?.body_html || ""}
              />
            </div>
          </div>
        </div>

        {/* Tab 2: English Content */}
        <div
          className={`p-5 sm:p-6 space-y-4 ${activeLang === "en" ? "block" : "hidden"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <span>🇬🇧</span> <span>English Translation</span>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                English Title <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="en_title"
                placeholder="Enter English title..."
                value={enTitle}
                onChange={(e) => setEnTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Slug (URL Path)
                </label>
                <button
                  type="button"
                  onClick={generateEnSlug}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  ⚡ Generate from Title
                </button>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 overflow-hidden">
                <span className="px-3 py-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shrink-0 font-mono">
                  /documents/
                </span>
                <input
                  className="w-full px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                  name="en_slug"
                  placeholder="english-document-slug"
                  value={enSlug}
                  onChange={(e) => setEnSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Summary (English)
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs min-h-[75px]"
                name="en_summary"
                placeholder="Brief summary in English..."
                defaultValue={en?.summary || ""}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Body HTML Content (English)
                </label>
                <span className="text-[10px] text-slate-400">
                  Supports HTML
                </span>
              </div>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs min-h-[160px]"
                name="en_body"
                placeholder="<p>English document body...</p>"
                defaultValue={en?.body_html || ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. File Attachment & Download Metadata Card */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shadow-xs">
              03
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo"
                ? "ໄຟລ໌ດາວໂຫຼດ (File Attachment)"
                : "Attached File Metadata"}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {locale === "lo" ? "PDF, Word, Excel" : "Optional attachment"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* File Label */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຊື່ສະແດງຂອງໄຟລ໌" : "File Label"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="file_label"
                placeholder={
                  locale === "lo"
                    ? "ດາວໂຫຼດເອກະສານ PDF"
                    : "Download PDF Document"
                }
                defaultValue={file0?.label || ""}
              />
            </div>

            {/* File Name */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຊື່ໄຟລ໌ ຫຼື Path" : "File Name / Key"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="file_name"
                placeholder="document-2024.pdf"
                defaultValue={file0?.file_name || ""}
              />
            </div>

            {/* Download Access */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ສິດດາວໂຫຼດໄຟລ໌" : "Download Access"}
              </label>
              <select
                name="download_access"
                defaultValue={file0?.download_access || "member"}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs cursor-pointer"
              >
                <option value="member">
                  👤 Member ({locale === "lo" ? "ສະມາຊິກດາວໂຫຼດໄດ້" : "Member"})
                </option>
                <option value="vip">
                  👑 VIP ({locale === "lo" ? "ສະເພາະ VIP" : "VIP only"})
                </option>
              </select>
            </div>

            {/* File MIME */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                MIME Type
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="file_mime"
                placeholder="application/pdf"
                defaultValue={file0?.mime || "application/pdf"}
              />
            </div>

            {/* File Size */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຂະໜາດ (Bytes)" : "Size in Bytes"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="file_size"
                type="number"
                placeholder="0"
                defaultValue={file0?.size_bytes || 0}
              />
            </div>

            {/* Version */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ເວີຊັນ" : "Version"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                name="file_version"
                placeholder="1.0"
                defaultValue={file0?.version || "1.0"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons Toolbar */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400">
          {locale === "lo"
            ? "* ກະລຸນາກວດສອບຂໍ້ມູນໃຫ້ຄົບຖ້ວນກ່ອນບັນທຶກ"
            : "* Please review all details before saving"}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/${locale}/admin/documents`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            {t(locale, "cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>{t(locale, "loading")}</span>
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 20 20"
                  width="14"
                  height="14"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t(locale, "save")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
