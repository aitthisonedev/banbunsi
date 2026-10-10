"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
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
};

export default function AdminDocumentsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">{t(locale, "adminDocuments")}</h1>
        <Link href={`/${locale}/admin/documents/new`} className="btn-primary">
          {t(locale, "newDocument")}
        </Link>
      </div>

      <form
        className="mb-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          load(q).catch((err) =>
            setError(err instanceof Error ? err.message : t(locale, "loadError")),
          );
        }}
      >
        <input
          className="input max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(locale, "search")}
        />
        <button className="btn-secondary" type="submit">
          {t(locale, "search")}
        </button>
      </form>

      <div className="surface-panel overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title={t(locale, "noDocuments")} />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(locale, "title")}</th>
                <th>{t(locale, "status")}</th>
                <th>{t(locale, "categories")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold">{row.title || "—"}</div>
                    <div className="text-xs text-bb-text-muted">
                      {row.document_number}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Badge muted>{row.status}</Badge>
                      <Badge>{row.read_access}</Badge>
                    </div>
                  </td>
                  <td>{row.category_name}</td>
                  <td className="text-right">
                    <Link
                      href={`/${locale}/admin/documents/${row.id}`}
                      className="section-link mr-3"
                    >
                      {t(locale, "edit")}
                    </Link>
                    {canDelete ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-red-600"
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
