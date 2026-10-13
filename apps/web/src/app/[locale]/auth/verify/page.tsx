"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { LoadingState } from "@/components/ui";
import { clientVerifyEmail } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin text-bb-blue"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function VerifyInner() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const token = search.get("token") || "";

  const [message, setMessage] = useState(
    token ? t(locale, "loading") : t(locale, "loadError"),
  );
  const [ok, setOk] = useState(false);
  const [inFlight, setInFlight] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    let active = true;
    clientVerifyEmail(token)
      .then((r) => {
        if (!active) return;
        setMessage(r.message);
        setOk(true);
        setInFlight(false);
      })
      .catch((e) => {
        if (!active) return;
        setMessage(e instanceof Error ? e.message : t(locale, "loadError"));
        setOk(false);
        setInFlight(false);
      });

    return () => {
      active = false;
    };
  }, [token, locale]);

  return (
    <AuthPanel
      locale={locale}
      title={t(locale, "verifyEmail")}
      footer={
        <p className="auth-footer-prompt">
          <Link className="auth-footer-link" href={`/${locale}/auth/login`}>
            {t(locale, "login")}
          </Link>
        </p>
      }
    >
      <div className="auth-success-card" role="status">
        <div className="auth-success-icon-wrap">
          {inFlight ? <SpinnerIcon /> : <CheckCircleIcon />}
        </div>
        <p className="auth-success-message">{message}</p>
        {ok ? (
          <Link
            href={`/${locale}/auth/login`}
            className="auth-submit-btn auth-success-btn"
          >
            <span>{t(locale, "login")}</span>
            <ArrowRightIcon className="auth-btn-arrow" />
          </Link>
        ) : null}
      </div>
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
