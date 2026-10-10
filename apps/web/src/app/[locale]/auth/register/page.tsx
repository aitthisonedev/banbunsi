"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField, SuccessBanner } from "@/components/ui";
import { clientRegister } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function RegisterPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password !== confirm) {
      setError(t(locale, "passwordMismatch"));
      setLoading(false);
      return;
    }
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
      title={t(locale, "register")}
      lead={t(locale, "registerLead")}
      footer={
        <div className="auth-footer-row">
          <span className="auth-footer-start">{t(locale, "haveAccount")}</span>
          <Link className="auth-link auth-footer-end" href={`/${locale}/auth/login`}>
            {t(locale, "login")}
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="auth-form">
        <FormField label={t(locale, "name")}>
          <input className="input" name="name" required autoComplete="name" />
        </FormField>
        <FormField label={t(locale, "email")}>
          <input
            className="input"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
          />
        </FormField>
        <FormField label={t(locale, "password")}>
          <input
            className="input"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>
        <FormField label={t(locale, "confirmPassword")}>
          <input
            className="input"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>
        {error ? <p className="form-field-error">{error}</p> : null}
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
        <button className="btn-primary auth-submit" disabled={loading} type="submit">
          {loading ? t(locale, "loading") : t(locale, "register")}
        </button>
      </form>
    </AuthPanel>
  );
}
