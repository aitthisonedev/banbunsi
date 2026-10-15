"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminCategoryForm } from "@/components/admin-category-form";
import { LoadingState } from "@/components/ui";
import { clientListAdminCategories } from "@/lib/client-api";
import { nextSortOrder } from "@/lib/form-defaults";
import { isLocale, t } from "@/lib/i18n";

export default function AdminNewCategoryPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [sortOrder, setSortOrder] = useState<number | null>(null);

  useEffect(() => {
    // Place the new category after the existing ones (top-level and sub-categories).
    clientListAdminCategories(locale)
      .then(({ items }) => {
        const all = items.flatMap((item) => [
          item,
          ...((item.children || []) as Array<{ sort_order?: number }>),
        ]);
        setSortOrder(nextSortOrder(all));
      })
      .catch(() => setSortOrder(1));
  }, [locale]);

  if (sortOrder === null) return <LoadingState label={t(locale, "loading")} />;
  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t(locale, "newCategory")}</h1>
      <AdminCategoryForm locale={locale} nextSortOrder={sortOrder} />
    </div>
  );
}
