"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  clientDeleteAdminCategory,
  clientListAdminCategories,
  clientMe,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";
import { btn } from "@/components/admin-documents-ui";
import { AdminPagination, usePagination } from "@/components/admin-pagination";

type Row = {
  id: string;
  code: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminCategoriesPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [canDelete, setCanDelete] = useState(false);

  async function load() {
    const data = await clientListAdminCategories(locale);
    setItems(
      data.items.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        slug: row.slug,
        sort_order: row.sort_order,
        is_active: row.is_active,
      })),
    );
  }

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        setCanDelete(u.staff_role === "admin" || u.staff_role === "owner");
        await load();
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function onDelete(id: string) {
    if (!confirm(t(locale, "deleteCategoryConfirm"))) return;
    try {
      await clientDeleteAdminCategory(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    }
  }

  // Before the early returns: hooks must run on every render.
  const pager = usePagination(items || []);
  const listTop = useRef<HTMLDivElement>(null);

  if (error) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  return (
    <div className="w-full">
      <div className="admin-page-head">
        <div>
          <h1 className="text-2xl font-bold">{t(locale, "adminCategories")}</h1>
          <p>{t(locale, "adminCatsLead")}</p>
        </div>
        <div className="admin-page-head-actions">
          {/* Same count pill as Manage Members: the number of items in the list below. */}
          <span className="admin-count-pill" aria-live="polite">
            {t(
              locale,
              items.length === 1 ? "categoryCountOne" : "categoryCount",
              { count: items.length },
            )}
          </span>
          <Link
            href={`/${locale}/admin/categories/new`}
            className="btn-primary"
          >
            {t(locale, "newCategory")}
          </Link>
        </div>
      </div>

      <div ref={listTop} className="surface-panel overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title={t(locale, "noCategories")} />
        ) : (
          <table className="admin-table min-w-[34rem]">
            <thead>
              <tr>
                <th>
                  <span className="block text-center">
                    {t(locale, "rowNumber")}
                  </span>
                </th>
                <th>{t(locale, "name")}</th>
                <th>{t(locale, "categoryCode")}</th>
                <th>{t(locale, "status")}</th>
                {/* .admin-table cells force text-align: left, so alignment sits on an inner element. */}
                <th>
                  <span className="block text-center">
                    {t(locale, "colActions")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pager.rows.map((row, index) => (
                <tr key={row.id}>
                  {/* Position in the list (not the database id), continuing across pages. */}
                  <td className="w-12">
                    <span className="block text-center text-sm font-medium tabular-nums text-bb-text-muted">
                      {pager.offset + index + 1}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold">{row.name || "—"}</div>
                    <div className="text-xs text-bb-text-muted">{row.slug}</div>
                  </td>
                  <td>{row.code}</td>
                  <td>
                    <Badge muted={!row.is_active}>
                      {row.is_active
                        ? t(locale, "active")
                        : t(locale, "inactive")}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex flex-nowrap justify-center gap-2">
                      <Link
                        href={`/${locale}/admin/categories/${row.id}`}
                        className={`${btn.secondarySm} min-w-[4.5rem]`}
                      >
                        {t(locale, "edit")}
                      </Link>
                      {canDelete ? (
                        <button
                          type="button"
                          className={`${btn.dangerOutlineSm} min-w-[4.5rem]`}
                          onClick={() => onDelete(row.id)}
                        >
                          {t(locale, "delete")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AdminPagination
          locale={locale}
          page={pager.page}
          pageCount={pager.pageCount}
          total={pager.total}
          onPageChange={pager.setPage}
          scrollTarget={listTop}
        />
      </div>
    </div>
  );
}
