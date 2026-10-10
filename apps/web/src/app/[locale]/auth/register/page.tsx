"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField } from "@/components/ui";
import { clientRegister, getGoogleAuthUrl } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
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

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
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

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
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

export default function RegisterPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isMinLength = password.length >= 8;
  const isMatched = confirm.length > 0 && password === confirm;
  const isMismatch = confirm.length > 0 && password !== confirm;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError(t(locale, "passwordMinChars"));
      return;
    }

    if (password !== confirm) {
      setError(t(locale, "passwordMismatch"));
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await clientRegister(
        String(fd.get("name") || ""),
        String(fd.get("email") || ""),
        password,
      );
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
      activeTab="register"
      title={t(locale, "createAccount")}
      lead={t(locale, "registerLead")}
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
          <h2 className="auth-success-title">
            {t(locale, "registrationSuccessful")}
          </h2>
          <p className="auth-success-message">{message}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="auth-submit-btn auth-success-btn"
          >
            <span>{t(locale, "signInNow")}</span>
            <ArrowRightIcon className="auth-btn-arrow" />
          </Link>
        </div>
      ) : (
        <>
          <div className="auth-oauth-section">
          <a
            href={getGoogleAuthUrl("register", `/${locale}/account`, locale)}
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
              {locale === "lo"
                ? "ລົງທະບຽນດ້ວຍ Google"
                : "Sign up with Google"}
            </span>
          </a>
        </div>

        <div className="auth-divider-row" aria-hidden="true">
          <span className="auth-divider-line" />
          <span>{locale === "lo" ? "ຫຼື" : "or"}</span>
          <span className="auth-divider-line" />
        </div>

        <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
          <FormField label={t(locale, "name")} htmlFor="register-name">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <UserIcon />
              </span>
              <input
                id="register-name"
                className="input has-icon-left"
                name="name"
                placeholder={locale === "lo" ? "ສົມສັກ ໄຊຍະວົງ" : "John Doe"}
                required
                autoComplete="name"
              />
            </div>
          </FormField>

          <FormField label={t(locale, "email")} htmlFor="register-email">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <MailIcon />
              </span>
              <input
                id="register-email"
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

          <FormField label={t(locale, "password")} htmlFor="register-password">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <LockIcon />
              </span>
              <input
                id="register-password"
                className="input has-icon-left has-icon-right"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            <div className="auth-password-hints">
              <span
                className={`auth-hint-pill ${isMinLength ? "is-valid" : ""}`}
              >
                {isMinLength ? <CheckIcon /> : "•"}
                <span>{t(locale, "passwordMinChars")}</span>
              </span>
            </div>
          </FormField>

          <FormField
            label={t(locale, "confirmPassword")}
            htmlFor="register-confirm"
          >
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <ShieldCheckIcon />
              </span>
              <input
                id="register-confirm"
                className="input has-icon-left has-icon-right"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? t(locale, "hidePassword") : t(locale, "showPassword")}
                title={showConfirm ? t(locale, "hidePassword") : t(locale, "showPassword")}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirm.length > 0 ? (
              <div className="auth-password-hints">
                <span
                  className={`auth-hint-pill ${isMatched ? "is-valid" : isMismatch ? "is-invalid" : ""}`}
                >
                  {isMatched ? <CheckIcon /> : "•"}
                  <span>
                    {isMatched
                      ? t(locale, "passwordsMatch")
                      : t(locale, "passwordsDoNotMatch")}
                  </span>
                </span>
              </div>
            ) : null}
          </FormField>

          <p className="auth-terms-note">
            <span>{t(locale, "termsNotice")} </span>
            <Link href={`/${locale}/privacy`}>
              {t(locale, "privacyPolicy")}
            </Link>
          </p>

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
                <span>{t(locale, "register")}</span>
                <ArrowRightIcon className="auth-btn-arrow" />
              </>
            )}
          </button>
        </form>
        </>
      )}
    </AuthPanel>
  );
}
