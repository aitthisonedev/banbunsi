"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clientGetAdminDashboard, clientMe } from "@/lib/client-api";
import type { User } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminDashboardPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setUser(u);
        setStats(await clientGetAdminDashboard());
      })
      .catch(() => {
        setError("Please sign in with a staff account.");
        router.replace(`/${locale}/auth/login`);
      });
  }, [locale, router]);

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-12">{error}</div>;
  }
  if (!user || !stats) {
    return <div className="mx-auto max-w-3xl px-4 py-12">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-5">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "dashboard")}</h1>
          <p className="mt-1 text-sm text-bb-text-muted">
            {user.name} · {user.staff_role}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/admin/documents`} className="btn-primary">
            {t(locale, "adminDocuments")}
          </Link>
          <Link href={`/${locale}/admin/settings`} className="btn-secondary">
            {t(locale, "settings")}
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="card-soft p-4">
            <p className="text-sm capitalize text-bb-text-muted">{key.replaceAll("_", " ")}</p>
            <p className="mt-2 text-3xl font-bold text-bb-blue">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
