"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminQuizForm } from "@/components/admin-quiz-form";
import { ErrorState, LoadingState } from "@/components/ui";
import {
  clientGetAdminQuiz,
  clientMe,
  type AdminQuiz,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminEditQuizPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const id = String(params.id || "");
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([clientGetAdminQuiz(id), clientMe()])
      .then(([q, u]) => {
        setQuiz(q);
        setCanPublish(u.staff_role === "admin" || u.staff_role === "owner");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
  }, [id, locale]);

  if (error) return <ErrorState title={error} />;
  if (!quiz) return <LoadingState label={t(locale, "loading")} />;
  return (
    <AdminQuizForm locale={locale} initial={quiz} canPublish={canPublish} />
  );
}
