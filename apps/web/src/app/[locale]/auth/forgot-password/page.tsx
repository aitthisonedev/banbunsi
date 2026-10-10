"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField, SuccessBanner } from "@/components/ui";
import { clientForgotPassword } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

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
        <Link className="auth-link" href={`/${locale}/auth/login`}>
          {t(locale, "login")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t(locale, "email")}>
          <input className="input" name="email" type="email" required />
        </FormField>
        {error ? <p className="form-field-error">{error}</p> : null}
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? t(locale, "loading") : t(locale, "submit")}
        </button>
      </form>
    </AuthPanel>
  );
}
