"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  clientDeleteAdminQuiz,
  clientListAdminQuizzes,
  clientMe,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

type Row = {
  id: string;
  code: string;
  title: string;
  slug: string;
  difficulty: string;
  is_published: boolean;
  question_count: number;
};

export default function AdminQuizzesPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [canDelete, setCanDelete] = useState(false);

  async function load() {
    const data = await clientListAdminQuizzes(locale);
    setItems(data.items);
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
    if (!confirm(t(locale, "deleteQuizConfirm"))) return;
    try {
      await clientDeleteAdminQuiz(id);
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
          <h1 className="text-2xl font-bold">{t(locale, "adminQuizzes")}</h1>
          <p>{t(locale, "adminQuizzesLead")}</p>
        </div>
        <Link href={`/${locale}/admin/quizzes/new`} className="btn-primary">
          {t(locale, "newQuiz")}
        </Link>
      </div>

      <div className="surface-panel overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title={t(locale, "noQuizzes")} />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(locale, "title")}</th>
                <th>{t(locale, "difficulty")}</th>
                <th>{t(locale, "questions")}</th>
                <th>{t(locale, "status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold">{row.title || "—"}</div>
                    <div className="text-xs text-bb-text-muted">
                      {row.code} · {row.slug}
                    </div>
                  </td>
                  <td>{row.difficulty}</td>
                  <td>{row.question_count}</td>
                  <td>
                    <Badge muted={!row.is_published}>
                      {row.is_published
                        ? t(locale, "published")
                        : t(locale, "draft")}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/${locale}/admin/quizzes/${row.id}`}
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
