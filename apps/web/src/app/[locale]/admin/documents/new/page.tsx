"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import { LoadingState } from "@/components/ui";
import type { CategoryNode } from "@/lib/api";
import { clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminNewDocumentPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [isAdminPlus, setIsAdminPlus] = useState(false);

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setIsAdminPlus(u.staff_role === "admin" || u.staff_role === "owner");
        const res = await fetch(
          `${API_URL}/api/v1/admin/categories?locale=${locale}`,
          { credentials: "include" },
        );
        const data = await res.json();
        setCategories(data.items || []);
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [locale, router]);

  if (!categories) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{t(locale, "newDocument")}</h1>
      <AdminDocumentForm
        locale={locale}
        categories={categories}
        isAdminPlus={isAdminPlus}
      />
    </div>
  );
}
