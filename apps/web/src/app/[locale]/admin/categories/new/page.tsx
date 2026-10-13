"use client";

import { useParams } from "next/navigation";
import { AdminCategoryForm } from "@/components/admin-category-form";
import { isLocale } from "@/lib/i18n";

export default function AdminNewCategoryPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  return <AdminCategoryForm locale={locale} />;
}
