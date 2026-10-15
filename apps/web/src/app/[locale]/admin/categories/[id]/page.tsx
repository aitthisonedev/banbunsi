"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminCategoryForm } from "@/components/admin-category-form";
import { ErrorState, LoadingState } from "@/components/ui";
import { clientGetAdminCategory, type AdminCategory } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminEditCategoryPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const id = String(params.id || "");
  const [cat, setCat] = useState<AdminCategory | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    clientGetAdminCategory(id)
      .then(setCat)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
  }, [id, locale]);

  if (error) return <ErrorState title={error} />;
  if (!cat) return <LoadingState label={t(locale, "loading")} />;
  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t(locale, "editCategory")}</h1>
      <AdminCategoryForm locale={locale} initial={cat} />
    </div>
  );
}
