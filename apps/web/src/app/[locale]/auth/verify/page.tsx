"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { LoadingState, SuccessBanner } from "@/components/ui";
import { clientVerifyEmail } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function VerifyInner() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const token = search.get("token") || "";
  const [message, setMessage] = useState(t(locale, "loading"));
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage(t(locale, "loadError"));
      return;
    }
    clientVerifyEmail(token)
      .then((r) => {
        setMessage(r.message);
        setOk(true);
      })
      .catch((e) =>
        setMessage(e instanceof Error ? e.message : t(locale, "loadError")),
      );
  }, [token, locale]);

  return (
    <AuthPanel
      locale={locale}
      title={t(locale, "verifyEmail")}
      footer={
        <Link className="auth-link" href={`/${locale}/auth/login`}>
          {t(locale, "login")}
        </Link>
      }
    >
      {ok ? <SuccessBanner>{message}</SuccessBanner> : <p className="text-bb-text-muted">{message}</p>}
    </AuthPanel>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <LoadingState label="…" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
