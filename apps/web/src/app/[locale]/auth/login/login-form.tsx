"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField } from "@/components/ui";
import { clientLogin } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function safeNextPath(nextPath: string, locale: string) {
  if (!nextPath.startsWith(`/${locale}`)) return null;
  if (nextPath.startsWith("//")) return null;
  if (nextPath.includes("://")) return null;
  return nextPath;
}

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

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
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

export function LoginForm() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nextPath = search.get("next") || "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const user = await clientLogin(
        String(fd.get("email") || ""),
        String(fd.get("password") || ""),
      );
      const safe = safeNextPath(nextPath, locale);
      if (safe) {
        router.push(safe);
      } else if (
        user.staff_role === "admin" ||
        user.staff_role === "owner" ||
        user.staff_role === "editor"
      ) {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel
      locale={locale}
      activeTab="login"
      title={t(locale, "welcomeBack")}
      lead={t(locale, "loginLead")}
      footer={
        <p className="auth-footer-prompt">
          <span>{t(locale, "noAccountYet")}</span>
          <Link className="auth-footer-link" href={`/${locale}/auth/register`}>
            {t(locale, "register")}
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
        <FormField label={t(locale, "email")} htmlFor="login-email">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <MailIcon />
            </span>
            <input
              id="login-email"
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

        <FormField label={t(locale, "password")} htmlFor="login-password">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <LockIcon />
            </span>
            <input
              id="login-password"
              className="input has-icon-left has-icon-right"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              minLength={7}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t(locale, "hidePassword") : t(locale, "showPassword")}
              title={showPassword ? t(locale, "hidePassword") : t(locale, "showPassword")}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </FormField>

        <div className="auth-remember-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              name="remember"
              className="auth-checkbox"
              defaultChecked
            />
            <span>{t(locale, "rememberMe")}</span>
          </label>

          <Link
            className="auth-forgot-link"
            href={`/${locale}/auth/forgot-password`}
          >
            {t(locale, "forgotPassword")}
          </Link>
        </div>

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
              <span>{t(locale, "login")}</span>
              <ArrowRightIcon className="auth-btn-arrow" />
            </>
          )}
        </button>
      </form>
    </AuthPanel>
  );
}
