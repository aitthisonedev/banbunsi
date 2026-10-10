"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField } from "@/components/ui";
import { clientLogin, getGoogleAuthUrl } from "@/lib/client-api";
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

  const initialError = (() => {
    const err = search.get("error");
    if (!err) return "";
    if (err === "account_suspended") {
      return locale === "lo" ? "ບັນຊີຂອງທ່ານຖືກໂຈະ." : "Account is suspended.";
    }
    if (err === "google_cancelled") {
      return locale === "lo"
        ? "ການເຂົ້າສູ່ລະບົບດ້ວຍ Google ຖືກຍົກເລີກ."
        : "Google sign-in was cancelled.";
    }
    return locale === "lo"
      ? `ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບດ້ວຍ Google (${err})`
      : `Google sign-in error (${err})`;
  })();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
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
      <div className="auth-oauth-section">
        <a
          href={getGoogleAuthUrl("login", nextPath || `/${locale}`, locale)}
          className="auth-oauth-btn auth-oauth-btn--google"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>
            {locale === "lo" ? "ສືບຕໍ່ດ້ວຍ Google" : "Continue with Google"}
          </span>
        </a>
      </div>

      <div className="auth-divider-row" aria-hidden="true">
        <span className="auth-divider-line" />
        <span>{locale === "lo" ? "ຫຼື" : "or"}</span>
        <span className="auth-divider-line" />
      </div>

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
              aria-label={
                showPassword
                  ? t(locale, "hidePassword")
                  : t(locale, "showPassword")
              }
              title={
                showPassword
                  ? t(locale, "hidePassword")
                  : t(locale, "showPassword")
              }
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

        <button className="auth-submit-btn" disabled={loading} type="submit">
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
