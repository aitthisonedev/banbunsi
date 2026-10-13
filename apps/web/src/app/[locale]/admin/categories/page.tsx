"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  clientDeleteAdminCategory,
  clientListAdminCategories,
  clientMe,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

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

  if (error) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  return (
    <div className="w-full">
      <div className="admin-page-head">
        <div>
          <p>{t(locale, "adminCatsLead")}</p>
        </div>
        <Link href={`/${locale}/admin/categories/new`} className="btn-primary">
          {t(locale, "newCategory")}
        </Link>
      </div>

      <div className="surface-panel overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title={t(locale, "noCategories")} />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(locale, "name")}</th>
                <th>{t(locale, "categoryCode")}</th>
                <th>{t(locale, "status")}</th>
                <th>{t(locale, "sortOrder")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
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
                  <td>{row.sort_order}</td>
                  <td className="text-right">
                    <Link
                      href={`/${locale}/admin/categories/${row.id}`}
                      className="section-link mr-3"
                    >
                      {t(locale, "edit")}
                    </Link>
                    {canDelete ? (
                      <button
                        type="button"
                        className="admin-danger"
                        onClick={() => onDelete(row.id)}
                      >
                        {t(locale, "delete")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
