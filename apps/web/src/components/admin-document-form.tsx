"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryNode, Locale } from "@/lib/api";
import {
  clientAdminLibrary,
  clientAdminUpload,
  clientCreateAdminDocument,
  clientUpdateAdminDocument,
  mediaSrc,
  type AdminDocumentPayload,
  type AdminLibraryItem,
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Controlled slug states for auto-generation helper
  const [loTitle, setLoTitle] = useState(lo?.title || "");
  const [loSlug, setLoSlug] = useState(lo?.slug || "");
  const [enTitle, setEnTitle] = useState(en?.title || "");
  const [enSlug, setEnSlug] = useState(en?.slug || "");

  const [coverImage, setCoverImage] = useState(initial?.cover_image || "");
  const [showCoverLibrary, setShowCoverLibrary] = useState(false);
  const [showDocLibrary, setShowDocLibrary] = useState(false);
  const [coverLibrary, setCoverLibrary] = useState<AdminLibraryItem[]>([]);
  const [docLibrary, setDocLibrary] = useState<AdminLibraryItem[]>([]);

  const [fileLabel, setFileLabel] = useState(file0?.label || "");
  const [fileName, setFileName] = useState(file0?.file_name || "");
  const [fileMime, setFileMime] = useState(file0?.mime || "application/pdf");
  const [fileSize, setFileSize] = useState(Number(file0?.size_bytes || 0));
  const [fileVersion, setFileVersion] = useState(file0?.version || "1.0");
  const [downloadAccess, setDownloadAccess] = useState(
    file0?.download_access || "member",
  );

  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showCoverLibrary) return;
    clientAdminLibrary("cover")
      .then((res) => setCoverLibrary(res.items || []))
      .catch(() => setCoverLibrary([]));
  }, [showCoverLibrary]);

  useEffect(() => {
    if (!showDocLibrary) return;
    clientAdminLibrary("document")
      .then((res) => setDocLibrary(res.items || []))
      .catch(() => setDocLibrary([]));
  }, [showDocLibrary]);

  function generateLoSlug() {
    setLoSlug(slugify(loTitle));
  }

  function generateEnSlug() {
    setEnSlug(slugify(enTitle));
  }

  async function onCoverDevice(file: File | null) {
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const res = await clientAdminUpload("cover", file);
      setCoverImage(res.path || res.url);
      setShowCoverLibrary(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function onDocDevice(file: File | null) {
    if (!file) return;
    setUploadingFile(true);
    setError("");
    try {
      const res = await clientAdminUpload("document", file);
      setFileName(res.path || res.file_name);
      setFileMime(res.mime || file.type || "application/pdf");
      setFileSize(res.size_bytes || file.size || 0);
      if (!fileLabel) setFileLabel(res.file_name || file.name);
      setShowDocLibrary(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setUploadingFile(false);
    }
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
    const resolvedFileName = fileName.trim();

    const body: AdminDocumentPayload = {
      document_number: String(fd.get("document_number") || ""),
      category_id: String(fd.get("category_id") || ""),
      read_access: String(fd.get("read_access") || "public"),
      status: String(fd.get("status") || "draft"),
      effective_date: String(fd.get("effective_date") || "") || null,
      year: Number(fd.get("year") || new Date().getFullYear()),
      tags: String(fd.get("tags") || ""),
      cover_image: coverImage.trim(),
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
    if (resolvedFileName) {
      body.files = [
        {
          label: fileLabel || resolvedFileName,
          file_name: resolvedFileName,
          mime: fileMime || "application/pdf",
          size_bytes: Number(fileSize || 0),
          language: "lo",
          version: fileVersion || "1.0",
          download_access: downloadAccess || "member",
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

      {/* 3. Cover image */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shadow-xs">
              03
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo" ? "ຮູບໜ້າປົກ (Cover Image)" : "Cover Image"}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            {locale === "lo"
              ? "Upload or pick from library"
              : "Upload or pick from library"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              e.target.value = "";
              void onCoverDevice(f);
            }}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-44 shrink-0">
              <div className="aspect-[4/3] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaSrc(coverImage)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 px-3 text-center">
                    {locale === "lo" ? "No cover yet" : "No cover yet"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {uploadingCover
                    ? t(locale, "loading")
                    : locale === "lo"
                      ? "Upload from device"
                      : "Upload from device"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCoverLibrary((v) => !v);
                    setShowDocLibrary(false);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  {locale === "lo"
                    ? "Choose from library"
                    : "Choose from library"}
                </button>
                {coverImage ? (
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    {locale === "lo" ? "Remove" : "Remove"}
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
                {coverImage ||
                  (locale === "lo"
                    ? "JPEG, PNG, WebP · max 5MB"
                    : "JPEG, PNG, WebP · max 5MB")}
              </p>
            </div>
          </div>

          {showCoverLibrary ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {locale === "lo" ? "Image library" : "Image library"}
              </div>
              {coverLibrary.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  {locale === "lo" ? "No images yet" : "No images yet"}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {coverLibrary.map((item) => {
                    const selected =
                      coverImage === item.path || coverImage === item.url;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          setCoverImage(item.path);
                          setShowCoverLibrary(false);
                        }}
                        className={`relative aspect-[4/3] rounded-md overflow-hidden border-2 transition cursor-pointer ${
                          selected
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaSrc(item.url || item.path)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. File Attachment */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shadow-xs">
              04
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo"
                ? "ໄຟລ໌ດາວໂຫຼດ (File Attachment)"
                : "Attached File"}
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            {locale === "lo" ? "PDF, Word, Excel" : "Upload or reuse a file"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              e.target.value = "";
              void onDocDevice(f);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploadingFile}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              {uploadingFile
                ? t(locale, "loading")
                : locale === "lo"
                  ? "Upload from device"
                  : "Upload from device"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDocLibrary((v) => !v);
                setShowCoverLibrary(false);
              }}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              {locale === "lo"
                ? "Choose from uploaded files"
                : "Choose from uploaded files"}
            </button>
            {fileName ? (
              <button
                type="button"
                onClick={() => {
                  setFileName("");
                  setFileLabel("");
                  setFileMime("application/pdf");
                  setFileSize(0);
                }}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                {locale === "lo" ? "Clear file" : "Clear file"}
              </button>
            ) : null}
          </div>

          {showDocLibrary ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 max-h-56 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {locale === "lo"
                  ? "Previously uploaded files"
                  : "Previously uploaded files"}
              </div>
              {docLibrary.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  {locale === "lo"
                    ? "No uploads yet — upload from device first"
                    : "No uploads yet — upload from device first"}
                </p>
              ) : (
                <ul className="space-y-1">
                  {docLibrary.map((item) => {
                    const selected = fileName === item.path;
                    return (
                      <li key={item.path}>
                        <button
                          type="button"
                          onClick={() => {
                            setFileName(item.path);
                            setFileMime(item.mime || "application/pdf");
                            setFileSize(Number(item.size_bytes || 0));
                            if (!fileLabel) {
                              setFileLabel(item.file_name || item.path);
                            }
                            setShowDocLibrary(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs transition cursor-pointer ${
                            selected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="font-medium block truncate">
                            {item.file_name || item.path}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.mime || "file"}
                            {item.size_bytes
                              ? ` · ${(Number(item.size_bytes) / 1024).toFixed(0)} KB`
                              : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຊື່ສະແດງຂອງໄຟລ໌" : "File Label"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                value={fileLabel}
                onChange={(e) => setFileLabel(e.target.value)}
                placeholder={
                  locale === "lo"
                    ? "Download PDF Document"
                    : "Download PDF Document"
                }
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຊື່ໄຟລ໌ ຫຼື Path" : "File Name / Path"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="documents/file.pdf"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ສິດດາວໂຫຼດໄຟລ໌" : "Download Access"}
              </label>
              <select
                value={downloadAccess}
                onChange={(e) => setDownloadAccess(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs cursor-pointer"
              >
                <option value="member">Member</option>
                <option value="vip">VIP only</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                MIME Type
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                value={fileMime}
                onChange={(e) => setFileMime(e.target.value)}
                placeholder="application/pdf"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ຂະໜາດ (Bytes)" : "Size in Bytes"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(Number(e.target.value || 0))}
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {locale === "lo" ? "ເວີຊັນ" : "Version"}
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-xs"
                value={fileVersion}
                onChange={(e) => setFileVersion(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Action Buttons Toolbar */}
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
