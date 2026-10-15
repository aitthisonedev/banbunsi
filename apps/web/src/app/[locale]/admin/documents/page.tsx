"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessBadge,
  btn,
  DocumentCover,
  DocumentRowsSkeleton,
  fieldClass,
  PageHeader,
  panelClass,
  StatePanel,
  StatusBadge,
} from "@/components/admin-documents-ui";
import {
  clientDeleteAdminDocument,
  clientListAdminCategories,
  clientListAdminDocuments,
  clientGetPublicSettings,
  clientMe,
  type AdminDocumentFilters,
} from "@/lib/client-api";
import { categoryCover } from "@/lib/category-covers";
import { isLocale, t } from "@/lib/i18n";

type Row = {
  id: string;
  title?: string;
  document_number?: string;
  status?: string;
  read_access?: string;
  category_name?: string;
  category_slug?: string;
  cover_image_url?: string;
  year?: number;
  updated_at?: string;
  files?: Array<{ id: string; label?: string }>;
};

type Access = "all" | "public" | "member" | "vip";

const ACCESS_TABS: Array<{ value: Access; label: string }> = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "member", label: "Members" },
  { value: "vip", label: "VIP" },
];

const EMPTY_FILTERS: Required<Pick<AdminDocumentFilters, "q" | "status" | "category" | "year" | "updated_after" | "updated_before">> = {
  q: "",
  status: "",
  category: "",
  year: "",
  updated_after: "",
  updated_before: "",
};

export default function AdminDocumentsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [access, setAccess] = useState<Access>("all");
  const [showMore, setShowMore] = useState(false);
  const [categories, setCategories] = useState<Array<{ slug: string; name: string }>>([]);
  const [defaultCover, setDefaultCover] = useState("");
  const [canDelete, setCanDelete] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async (values: typeof EMPTY_FILTERS) => {
    const current = ++requestId.current;
    setItems(null);
    setLoadError("");
    try {
      const data = await clientListAdminDocuments(locale, values);
      if (current === requestId.current) setItems(data.items as Row[]);
    } catch (err) {
      if (current === requestId.current) setLoadError(err instanceof Error ? err.message : t(locale, "loadError"));
    }
  }, [locale]);

  useEffect(() => {
    clientMe()
      .then(async (user) => {
        setCanDelete(user.staff_role === "admin" || user.staff_role === "owner");
        await Promise.all([
          clientListAdminCategories(locale).then(({ items: values }) => setCategories(values)).catch(() => undefined),
          clientGetPublicSettings().then((settings) => setDefaultCover(settings.default_cover_url || "")).catch(() => undefined),
        ]);
        setReady(true);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : t(locale, "loadError")));
  }, [locale]);

  // Filters apply automatically; typing is debounced so each keystroke does not hit the API.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => load(filters), 300);
    return () => window.clearTimeout(timer);
  }, [ready, filters, load]);

  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function setFilter(key: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAccess("all");
  }

  async function onDelete(row: Row) {
    if (!confirm(`${t(locale, "deleteConfirm")}\n\n${row.title || row.document_number || ""}`)) return;
    setDeletingId(row.id);
    try {
      await clientDeleteAdminDocument(row.id);
      setItems((current) => current?.filter((item) => item.id !== row.id) || current);
      setNotice({ tone: "success", text: "Document deleted." });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Could not delete the document." });
    } finally {
      setDeletingId("");
    }
  }

  const advancedCount = [filters.year, filters.updated_after, filters.updated_before].filter(Boolean).length;
  const filtersActive = Object.values(filters).some(Boolean) || access !== "all";
  const visible = items?.filter((item) => access === "all" || (item.read_access || "public") === access) || [];
  const dateFormat = (value: string) => new Date(value).toLocaleDateString(locale === "lo" ? "lo-LA" : "en", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={t(locale, "adminDocuments")}
        description={items ? `${visible.length} ${visible.length === 1 ? "document" : "documents"}${filtersActive ? " match your filters" : ""}` : "Create, edit and publish documents."}
        actions={
          <Link href={`/${locale}/admin/documents/new`} className={btn.primary}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
            </svg>
            {t(locale, "newDocument")}
          </Link>
        }
      />

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${notice.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}
        >
          <span>{notice.text}</span>
          <button type="button" aria-label="Dismiss" className="font-semibold" onClick={() => setNotice(null)}>×</button>
        </div>
      ) : null}

      <section className={`${panelClass} overflow-hidden`}>
        {/* Search and filters */}
        <div className="space-y-3 border-b border-bb-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bb-text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5l4 4" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                aria-label="Search documents"
                className={`${fieldClass} pl-9 pr-9`}
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
                placeholder={locale === "lo" ? "ຄົ້ນຫາຊື່ ຫຼື ເລກທີເອກະສານ..." : "Search by title or document number"}
              />
              {filters.q ? (
                <button type="button" aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-bb-text-muted hover:text-[var(--bb-text)]" onClick={() => setFilter("q", "")}>
                  ×
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <select aria-label="Status" className={`${fieldClass} sm:w-40`} value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <select aria-label="Category" className={`${fieldClass} sm:w-48`} value={filters.category} onChange={(event) => setFilter("category", event.target.value)}>
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
              <button type="button" className={`${btn.secondary} col-span-2 sm:col-span-1`} aria-expanded={showMore} onClick={() => setShowMore((open) => !open)}>
                More filters{advancedCount ? ` (${advancedCount})` : ""}
              </button>
            </div>
          </div>

          {showMore ? (
            <div className="grid gap-3 rounded-lg bg-bb-muted p-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                {t(locale, "year")}
                <input className={fieldClass} inputMode="numeric" placeholder="e.g. 2026" value={filters.year} onChange={(event) => setFilter("year", event.target.value.replace(/\D/g, "").slice(0, 4))} />
              </label>
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                Updated from
                <input className={fieldClass} type="date" value={filters.updated_after} onChange={(event) => setFilter("updated_after", event.target.value)} />
              </label>
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                Updated until
                <input className={fieldClass} type="date" value={filters.updated_before} onChange={(event) => setFilter("updated_before", event.target.value)} />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-bb-muted p-1" role="group" aria-label="Filter by access">
              {ACCESS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={access === tab.value}
                  onClick={() => setAccess(tab.value)}
                  className={`min-h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition ${access === tab.value ? "bg-[var(--bb-surface)] text-[var(--bb-text)] shadow-sm" : "text-bb-text-muted hover:text-[var(--bb-text)]"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {filtersActive ? (
              <button type="button" className="text-sm font-semibold text-bb-blue hover:underline" onClick={clearFilters}>
                {t(locale, "clearFilters")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Column headings (desktop) */}
        <div className={`${visible.length && !loadError ? "md:grid" : ""} hidden grid-cols-[minmax(0,1fr)_160px_110px_120px_150px] gap-4 border-b border-bb-border bg-bb-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bb-text-muted`}>
          <span>Document</span>
          <span>Category</span>
          <span>Status</span>
          <span>Updated</span>
          <span className="text-right">Actions</span>
        </div>

        {loadError ? (
          <StatePanel
            tone="error"
            title="Documents could not be loaded"
            description={loadError}
            action={<button type="button" className={btn.secondary} onClick={() => (ready ? load(filters) : window.location.reload())}>Try again</button>}
          />
        ) : !items ? (
          <DocumentRowsSkeleton />
        ) : visible.length === 0 ? (
          filtersActive ? (
            <StatePanel
              title="No documents match your filters"
              description="Try a different search term or clear the filters."
              action={<button type="button" className={btn.secondary} onClick={clearFilters}>{t(locale, "clearFilters")}</button>}
            />
          ) : (
            <StatePanel
              title="No documents yet"
              description="Create your first document to get started."
              action={<Link href={`/${locale}/admin/documents/new`} className={btn.primary}>{t(locale, "newDocument")}</Link>}
            />
          )
        ) : (
          <ul className="divide-y divide-[var(--bb-border)]">
            {visible.map((row) => {
              const href = `/${locale}/admin/documents/${row.id}`;
              const title = row.title || "Untitled document";
              const fileCount = row.files?.length || 0;
              return (
                <li key={row.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 transition hover:bg-bb-muted/60 md:grid-cols-[minmax(0,1fr)_160px_110px_120px_150px] md:items-center">
                  {/* Cover + title */}
                  <div className="contents md:flex md:min-w-0 md:items-center md:gap-4">
                    <Link href={href} aria-label={`Open ${title}`} className="row-span-2 md:row-span-1">
                      <DocumentCover src={row.cover_image_url || defaultCover} fallbackSrc={categoryCover(row, row.id)} title={title} />
                    </Link>
                    <div className="min-w-0">
                      <Link href={href} className="line-clamp-2 break-words font-semibold leading-snug hover:text-bb-blue">
                        {title}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-xs text-bb-text-muted">{row.document_number || "—"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-bb-text-muted">
                        <AccessBadge access={row.read_access} />
                        <span className="md:hidden"><StatusBadge status={row.status} /></span>
                        {row.year ? <span>· {row.year}</span> : null}
                        <span>· {fileCount} {fileCount === 1 ? "file" : "files"}</span>
                      </div>
                      <p className="mt-1 text-xs text-bb-text-muted md:hidden">
                        {[row.category_name, row.updated_at ? `Updated ${dateFormat(row.updated_at)}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <span className="hidden truncate text-sm md:block">{row.category_name || "—"}</span>
                  <span className="hidden md:block"><StatusBadge status={row.status} /></span>
                  <span className="hidden text-sm text-bb-text-muted md:block">{row.updated_at ? dateFormat(row.updated_at) : "—"}</span>
                  <div className="col-start-2 flex flex-wrap gap-2 md:col-start-auto md:justify-end">
                    <Link href={`${href}/edit`} className={btn.secondarySm}>{t(locale, "edit")}</Link>
                    {canDelete ? (
                      <button type="button" className={btn.dangerSm} disabled={deletingId === row.id} onClick={() => onDelete(row)}>
                        {deletingId === row.id ? "Deleting…" : t(locale, "delete")}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
