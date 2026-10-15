"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminQuizForm } from "@/components/admin-quiz-form";
import { LoadingState } from "@/components/ui";
import { clientListAdminQuizzes, clientMe } from "@/lib/client-api";
import { nextSortOrder } from "@/lib/form-defaults";
import { isLocale, t } from "@/lib/i18n";

export default function AdminNewQuizPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [canPublish, setCanPublish] = useState<boolean | null>(null);
  const [sortOrder, setSortOrder] = useState<number | null>(null);

  useEffect(() => {
    clientMe()
      .then((u) =>
        setCanPublish(u.staff_role === "admin" || u.staff_role === "owner"),
      )
      .catch(() => setCanPublish(false));
    // Place the new quiz after the existing ones.
    clientListAdminQuizzes(locale)
      .then(({ items }) => setSortOrder(nextSortOrder(items)))
      .catch(() => setSortOrder(1));
  }, [locale]);

  if (canPublish === null || sortOrder === null) {
    return <LoadingState label={t(locale, "loading")} />;
  }
  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t(locale, "newQuiz")}</h1>
      <AdminQuizForm locale={locale} canPublish={canPublish} nextSortOrder={sortOrder} />
    </div>
  );
}
