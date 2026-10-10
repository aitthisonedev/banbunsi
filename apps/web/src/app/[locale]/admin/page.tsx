"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState, ErrorState } from "@/components/ui";
import { clientGetAdminDashboard } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const STAT_LABELS: Record<string, string> = {
  documents: "statsDocuments",
  members: "statsMembers",
  active_vip: "statsVip",
  pending_review: "statsPending",
  articles: "statsArticles",
  download_requests: "statsDownloads",
};

export default function AdminDashboardPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clientGetAdminDashboard()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
  }, [locale]);

  if (error) {
    return <ErrorState title={error} />;
  }
  if (!stats) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "dashboard")}</h1>
        </div>
        <Link href={`/${locale}/admin/documents`} className="btn-primary">
          {t(locale, "adminDocuments")}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="card-soft">
            <p className="text-sm text-bb-text-muted">
              {t(locale, STAT_LABELS[key] || key)}
            </p>
            <p className="mt-2 text-3xl font-bold text-bb-blue">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
