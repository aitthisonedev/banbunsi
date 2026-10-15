"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/api";
import {
  clientAccountDownloads,
  clientAccountQuizHistory,
  type DownloadHistoryItem,
  type QuizHistoryItem,
} from "@/lib/client-api";
import { formatDate } from "@/lib/dashboard-stats";
import { t } from "@/lib/i18n";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";

/** Loads one history list for the Account page; null while loading. */
function useHistory<T>(load: () => Promise<{ items: T[] }>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let ignore = false;
    load()
      .then((data) => {
        if (!ignore) setItems(data.items);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "");
      });
    return () => {
      ignore = true;
    };
    // The loader only changes with the language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { items, error };
}

const ROW =
  "flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4";

/** Account → Downloads: the user's real past downloads (recorded by the API on each download). */
export function DownloadHistory({ locale }: { locale: Locale }) {
  const { items, error } = useHistory<DownloadHistoryItem>(() =>
    clientAccountDownloads(locale),
  );
  if (error)
    return <ErrorState title={t(locale, "loadError")} description={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;
  if (!items.length)
    return (
      <EmptyState
        title={t(locale, "emptyDownloads")}
        description={t(locale, "emptyDownloadsHint")}
      />
    );
  return (
    <ul className="divide-y divide-[var(--bb-border)]">
      {items.map((item, index) => {
        const title =
          item.document_title || item.document_number || item.file_name || "—";
        return (
          <li key={`${item.file_id}-${item.at}-${index}`} className={ROW}>
            <div className="min-w-0">
              {item.document_slug ? (
                <Link
                  href={`/${locale}/documents/${encodeURIComponent(item.document_slug)}`}
                  className="font-semibold hover:text-bb-blue"
                >
                  {title}
                </Link>
              ) : (
                <span className="font-semibold">{title}</span>
              )}
              <p className="truncate text-sm text-bb-text-muted">
                {item.file_label || item.file_name}
              </p>
            </div>
            <span className="shrink-0 text-sm text-bb-text-muted">
              {formatDate(locale, item.at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Account → Quiz history: the user's submitted quiz results. */
export function QuizHistory({ locale }: { locale: Locale }) {
  const { items, error } = useHistory<QuizHistoryItem>(() =>
    clientAccountQuizHistory(locale),
  );
  if (error)
    return <ErrorState title={t(locale, "loadError")} description={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;
  if (!items.length)
    return (
      <EmptyState
        title={t(locale, "emptyQuizHistory")}
        description={t(locale, "emptyQuizHistoryHint")}
      />
    );
  return (
    <ul className="divide-y divide-[var(--bb-border)]">
      {items.map((item, index) => (
        <li key={`${item.at}-${index}`} className={ROW}>
          <div className="min-w-0">
            {item.quiz_slug ? (
              <Link
                href={`/${locale}/quizzes/${encodeURIComponent(item.quiz_slug)}`}
                className="font-semibold hover:text-bb-blue"
              >
                {item.quiz_title || "—"}
              </Link>
            ) : (
              <span className="font-semibold">{item.quiz_title || "—"}</span>
            )}
            <p className="text-sm text-bb-text-muted">
              {t(locale, "quizScore", {
                correct: item.correct,
                total: item.total,
                percent: item.percent,
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`doc-badge${item.passed ? "" : " doc-badge-muted"}`}
            >
              {t(locale, item.passed ? "passed" : "failed")}
            </span>
            <span className="text-sm text-bb-text-muted">
              {formatDate(locale, item.at)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
