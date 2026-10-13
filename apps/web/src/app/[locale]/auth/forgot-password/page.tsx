"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField } from "@/components/ui";
import { clientForgotPassword } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await clientForgotPassword(String(fd.get("email") || ""));
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      locale={locale}
      title={t(locale, "forgotPassword")}
      footer={
        <p className="auth-footer-prompt">
          <span>{t(locale, "haveAccount")}</span>
          <Link className="auth-footer-link" href={`/${locale}/auth/login`}>
            {t(locale, "login")}
          </Link>
        </p>
      }
    >
      {message ? (
        <div className="auth-success-card" role="status">
          <div className="auth-success-icon-wrap">
            <CheckCircleIcon />
          </div>
          <p className="auth-success-message">{message}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="auth-submit-btn auth-success-btn"
          >
            <span>{t(locale, "login")}</span>
            <ArrowRightIcon className="auth-btn-arrow" />
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="auth-form">
          <FormField label={t(locale, "email")} htmlFor="forgot-email">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="forgot-email"
                className="input has-icon-left"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </FormField>

          {error ? (
            <div className="auth-alert auth-alert--error" role="alert">
              <span className="auth-alert-icon">
                <AlertCircleIcon />
              </span>
              <span>{error}</span>
            </div>
          ) : null}

          <button
            className="auth-submit-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <SpinnerIcon />
                <span>{t(locale, "loading")}</span>
              </>
            ) : (
              <>
                <span>{t(locale, "submit")}</span>
                <ArrowRightIcon className="auth-btn-arrow" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthPanel>
  );
}
