"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
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
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setCanDelete(u.staff_role === "admin" || u.staff_role === "owner");
        await load("");
      })
      .catch(() => {
        setError("Please sign in with a staff account.");
        router.replace(`/${locale}/auth/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await clientDeleteAdminDocument(id);
    await load();
  }

  if (error) {
    return <div className="mx-auto max-w-5xl px-4 py-12">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "adminDocuments")}</h1>
          <p className="mt-1 text-sm text-bb-text-muted">
            <Link href={`/${locale}/admin`} className="section-link">
              {t(locale, "dashboard")}
            </Link>
          </p>
        </div>
        <Link href={`/${locale}/admin/documents/new`} className="btn-primary">
          {t(locale, "newDocument")}
        </Link>
      </div>

      <form
        className="mb-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          load(q).catch((err) =>
            setError(err instanceof Error ? err.message : "Failed"),
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
                  {row.status} · {row.read_access}
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
                      className="text-sm text-red-600"
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
        {!items.length ? (
          <p className="p-4 text-muted">{t(locale, "noDocuments")}</p>
        ) : null}
      </div>
    </div>
  );
}
