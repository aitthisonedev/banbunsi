"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminQuizForm } from "@/components/admin-quiz-form";
import { LoadingState } from "@/components/ui";
import { clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminNewQuizPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [canPublish, setCanPublish] = useState<boolean | null>(null);

  useEffect(() => {
    clientMe()
      .then((u) =>
        setCanPublish(u.staff_role === "admin" || u.staff_role === "owner"),
      )
      .catch(() => setCanPublish(false));
  }, []);

  if (canPublish === null) {
    return <LoadingState label={t(locale, "loading")} />;
  }
  return <AdminQuizForm locale={locale} canPublish={canPublish} />;
}
