"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
  clientMe,
  type AdminDocumentFilters,
} from "@/lib/client-api";
import { categoryCover } from "@/lib/category-covers";
import { formatDate } from "@/lib/dashboard-stats";
import { AdminPagination, usePagination } from "@/components/admin-pagination";
import { isLocale, t } from "@/lib/i18n";
import { usePublicSettings } from "@/components/public-settings-context";

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

// Labels are dictionary keys, translated when rendered.
const ACCESS_TABS: Array<{ value: Access; label: string }> = [
  { value: "all", label: "all" },
  { value: "public", label: "badgePublic" },
  { value: "member", label: "accessMembers" },
  { value: "vip", label: "badgeVip" },
];

const EMPTY_FILTERS: Required<
  Pick<
    AdminDocumentFilters,
    "q" | "status" | "category" | "year" | "updated_after" | "updated_before"
  >
> = {
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
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  // ?q= from the admin top-bar search; it fills the search box below.
  const urlQuery = useSearchParams().get("q") || "";
  const initialQuery = useRef(urlQuery);
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, q: urlQuery });
  const [access, setAccess] = useState<Access>("all");
  const [showMore, setShowMore] = useState(false);
  const listTop = useRef<HTMLElement>(null);
  const [categories, setCategories] = useState<
    Array<{ slug: string; name: string }>
  >([]);
  const defaultCover = usePublicSettings()?.default_cover_url || "";
  const [canDelete, setCanDelete] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const requestId = useRef(0);

  const load = useCallback(
    async (values: typeof EMPTY_FILTERS) => {
      const current = ++requestId.current;
      setItems(null);
      setLoadError("");
      try {
        const data = await clientListAdminDocuments(locale, values);
        if (current === requestId.current) setItems(data.items as Row[]);
      } catch (err) {
        if (current === requestId.current)
          setLoadError(
            err instanceof Error ? err.message : t(locale, "loadError"),
          );
      }
    },
    [locale],
  );

  useEffect(() => {
    clientMe()
      .then(async (user) => {
        setCanDelete(
          user.staff_role === "admin" || user.staff_role === "owner",
        );
        // Load the list right away (no typing delay) while categories load in parallel.
        void load({ ...EMPTY_FILTERS, q: initialQuery.current });
        clientListAdminCategories(locale)
          .then(({ items: values }) => setCategories(values))
          .catch(() => undefined);
        setReady(true);
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : t(locale, "loadError"),
        ),
      );
  }, [locale, load]);

  // Filters apply automatically; typing is debounced so each keystroke does not hit the API.
  // The first list is loaded above without delay, so the first run here is skipped.
  const skipFirstFilterRun = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (skipFirstFilterRun.current) {
      skipFirstFilterRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => load(filters), 300);
    return () => window.clearTimeout(timer);
  }, [ready, filters, load]);

  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Any change to search or filters starts again from the first page.
  function setFilter(key: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAccess("all");
    setPage(1);
  }

  async function onDelete(row: Row) {
    if (
      !confirm(
        `${t(locale, "deleteConfirm")}\n\n${row.title || row.document_number || ""}`,
      )
    )
      return;
    setDeletingId(row.id);
    try {
      await clientDeleteAdminDocument(row.id);
      setItems(
        (current) => current?.filter((item) => item.id !== row.id) || current,
      );
      setNotice({ tone: "success", text: t(locale, "documentDeleted") });
    } catch (err) {
      setNotice({
        tone: "error",
        text:
          err instanceof Error
            ? err.message
            : t(locale, "documentDeleteFailed"),
      });
    } finally {
      setDeletingId("");
    }
  }

  const advancedCount = [
    filters.year,
    filters.updated_after,
    filters.updated_before,
  ].filter(Boolean).length;
  const filtersActive =
    Object.values(filters).some(Boolean) || access !== "all";
  const visible =
    items?.filter(
      (item) => access === "all" || (item.read_access || "public") === access,
    ) || [];
  const pager = usePagination(visible);
  const setPage = pager.setPage;

  // A new top-bar search (?q= changed) fills the search box and starts at page 1; the filter
  // effect above then reloads the list. Adjusted during render, as React recommends.
  if (seenQuery !== urlQuery) {
    setSeenQuery(urlQuery);
    setFilters((current) => ({ ...current, q: urlQuery }));
    setPage(1);
  }
  const dateFormat = (value: string) => formatDate(locale, value);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={t(locale, "adminDocuments")}
        description={
          items
            ? t(
                locale,
                `${filtersActive ? "docMatchCount" : "docCount"}${visible.length === 1 ? "One" : ""}`,
                { count: visible.length },
              )
            : t(locale, "adminDocsLead")
        }
        actions={
          <Link href={`/${locale}/admin/documents/new`} className={btn.primary}>
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
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
          <button
            type="button"
            aria-label={t(locale, "dismiss")}
            className="font-semibold"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      ) : null}

      <section ref={listTop} className={`${panelClass} overflow-hidden`}>
        {/* Search and filters */}
        <div className="space-y-3 border-b border-bb-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bb-text-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5l4 4" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                aria-label={t(locale, "searchDocuments")}
                className={`${fieldClass} pl-9 pr-9`}
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
                placeholder={
                  locale === "lo"
                    ? "ຄົ້ນຫາຊື່ ຫຼື ເລກທີເອກະສານ..."
                    : "Search by title or document number"
                }
              />
              {filters.q ? (
                <button
                  type="button"
                  aria-label={t(locale, "clearSearch")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-bb-text-muted hover:text-[var(--bb-text)]"
                  onClick={() => setFilter("q", "")}
                >
                  ×
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <select
                aria-label={t(locale, "status")}
                className={`${fieldClass} sm:w-40`}
                value={filters.status}
                onChange={(event) => setFilter("status", event.target.value)}
              >
                <option value="">{t(locale, "allStatuses")}</option>
                <option value="published">{t(locale, "published")}</option>
                <option value="draft">{t(locale, "draft")}</option>
                <option value="archived">{t(locale, "archived")}</option>
              </select>
              <select
                aria-label={t(locale, "category")}
                className={`${fieldClass} sm:w-48`}
                value={filters.category}
                onChange={(event) => setFilter("category", event.target.value)}
              >
                <option value="">{t(locale, "allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${btn.secondary} col-span-2 sm:col-span-1`}
                aria-expanded={showMore}
                onClick={() => setShowMore((open) => !open)}
              >
                {t(locale, "moreFilters")}
                {advancedCount ? ` (${advancedCount})` : ""}
              </button>
            </div>
          </div>

          {showMore ? (
            <div className="grid gap-3 rounded-lg bg-bb-muted p-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                {t(locale, "year")}
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  placeholder={t(locale, "yearPlaceholder")}
                  value={filters.year}
                  onChange={(event) =>
                    setFilter(
                      "year",
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                {t(locale, "updatedFrom")}
                <input
                  className={fieldClass}
                  type="date"
                  value={filters.updated_after}
                  onChange={(event) =>
                    setFilter("updated_after", event.target.value)
                  }
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-bb-text-muted">
                {t(locale, "updatedUntil")}
                <input
                  className={fieldClass}
                  type="date"
                  value={filters.updated_before}
                  onChange={(event) =>
                    setFilter("updated_before", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className="flex gap-1 overflow-x-auto rounded-lg bg-bb-muted p-1"
              role="group"
              aria-label={t(locale, "filterByAccess")}
            >
              {ACCESS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={access === tab.value}
                  onClick={() => {
                    setAccess(tab.value);
                    setPage(1);
                  }}
                  className={`min-h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition ${access === tab.value ? "bg-[var(--bb-surface)] text-[var(--bb-text)] shadow-sm" : "text-bb-text-muted hover:text-[var(--bb-text)]"}`}
                >
                  {t(locale, tab.label)}
                </button>
              ))}
            </div>
            {filtersActive ? (
              <button
                type="button"
                className="text-sm font-semibold text-bb-blue hover:underline"
                onClick={clearFilters}
              >
                {t(locale, "clearFilters")}
              </button>
            ) : null}
          </div>
        </div>

        {/* Column headings (desktop) */}
        <div
          className={`${visible.length && !loadError ? "md:grid" : ""} hidden grid-cols-[2.5rem_minmax(0,1fr)_160px_110px_120px_176px] gap-4 border-b border-bb-border bg-bb-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-bb-text-muted`}
        >
          <span className="text-center">{t(locale, "rowNumber")}</span>
          <span>{t(locale, "colDocument")}</span>
          <span>{t(locale, "category")}</span>
          <span>{t(locale, "status")}</span>
          <span>{t(locale, "colUpdated")}</span>
          <span className="text-center">{t(locale, "colActions")}</span>
        </div>

        {loadError ? (
          <StatePanel
            tone="error"
            title={t(locale, "documentsLoadFailed")}
            description={loadError}
            action={
              <button
                type="button"
                className={btn.secondary}
                onClick={() =>
                  ready ? load(filters) : window.location.reload()
                }
              >
                {t(locale, "retry")}
              </button>
            }
          />
        ) : !items ? (
          <DocumentRowsSkeleton locale={locale} />
        ) : visible.length === 0 ? (
          filtersActive ? (
            <StatePanel
              title={t(locale, "noDocumentsMatch")}
              description={t(locale, "noDocumentsMatchHint")}
              action={
                <button
                  type="button"
                  className={btn.secondary}
                  onClick={clearFilters}
                >
                  {t(locale, "clearFilters")}
                </button>
              }
            />
          ) : (
            <StatePanel
              title={t(locale, "noDocumentsYet")}
              description={t(locale, "noDocumentsYetHint")}
              action={
                <Link
                  href={`/${locale}/admin/documents/new`}
                  className={btn.primary}
                >
                  {t(locale, "newDocument")}
                </Link>
              }
            />
          )
        ) : (
          <ul className="divide-y divide-[var(--bb-border)]">
            {pager.rows.map((row, index) => {
              const href = `/${locale}/admin/documents/${row.id}`;
              const title = row.title || t(locale, "untitledDocument");
              const fileCount = row.files?.length || 0;
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[1.75rem_auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 transition hover:bg-bb-muted/60 md:grid-cols-[2.5rem_minmax(0,1fr)_160px_110px_120px_176px] md:items-center"
                >
                  {/* Position in the filtered list (not the database id), continuing across pages. */}
                  <span className="row-span-2 pt-1 text-center text-sm font-medium tabular-nums text-bb-text-muted md:row-span-1 md:pt-0">
                    {pager.offset + index + 1}
                  </span>
                  {/* Cover + title */}
                  <div className="contents md:flex md:min-w-0 md:items-center md:gap-4">
                    <Link
                      href={href}
                      aria-label={t(locale, "openItem", { title })}
                      className="row-span-2 md:row-span-1"
                    >
                      <DocumentCover
                        locale={locale}
                        src={row.cover_image_url || defaultCover}
                        fallbackSrc={categoryCover(row, row.id)}
                        title={title}
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={href}
                        className="line-clamp-2 break-words font-semibold leading-snug hover:text-bb-blue"
                      >
                        {title}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-xs text-bb-text-muted">
                        {row.document_number || "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-bb-text-muted">
                        <AccessBadge locale={locale} access={row.read_access} />
                        <span className="md:hidden">
                          <StatusBadge locale={locale} status={row.status} />
                        </span>
                        {row.year ? <span>· {row.year}</span> : null}
                        <span>
                          ·{" "}
                          {t(
                            locale,
                            fileCount === 1 ? "fileCountOne" : "fileCount",
                            { count: fileCount },
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-bb-text-muted md:hidden">
                        {[
                          row.category_name,
                          row.updated_at
                            ? t(locale, "updatedOn", {
                                date: dateFormat(row.updated_at),
                              })
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <span className="hidden truncate text-sm md:block">
                    {row.category_name || "—"}
                  </span>
                  <span className="hidden md:block">
                    <StatusBadge locale={locale} status={row.status} />
                  </span>
                  <span className="hidden text-sm text-bb-text-muted md:block">
                    {row.updated_at ? dateFormat(row.updated_at) : "—"}
                  </span>
                  <div className="col-start-3 flex flex-wrap gap-2 md:col-start-auto md:justify-center">
                    <Link
                      href={`${href}/edit`}
                      className={`${btn.secondarySm} min-w-[4.5rem]`}
                    >
                      {t(locale, "edit")}
                    </Link>
                    {canDelete ? (
                      <button
                        type="button"
                        className={`${btn.dangerOutlineSm} min-w-[4.5rem]`}
                        disabled={deletingId === row.id}
                        onClick={() => onDelete(row)}
                      >
                        {deletingId === row.id
                          ? t(locale, "deleting")
                          : t(locale, "delete")}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loadError ? (
          <AdminPagination
            locale={locale}
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            onPageChange={setPage}
            scrollTarget={listTop}
            className="border-t border-bb-border"
          />
        ) : null}
      </section>
    </div>
  );
}
