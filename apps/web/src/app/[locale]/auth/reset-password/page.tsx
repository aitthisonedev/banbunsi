"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { FormField, LoadingState, SuccessBanner } from "@/components/ui";
import { clientResetPassword } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function ResetInner() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const token = search.get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password !== confirm) {
      setError(t(locale, "passwordMismatch"));
      setLoading(false);
      return;
    }
    try {
      const res = await clientResetPassword(token, password);
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
      title={t(locale, "resetPassword")}
      footer={
        <Link className="text-bb-blue hover:underline" href={`/${locale}/auth/login`}>
          {t(locale, "login")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t(locale, "password")}>
          <input className="input" name="password" type="password" required minLength={8} />
        </FormField>
        <FormField label={t(locale, "confirmPassword")}>
          <input className="input" name="confirm" type="password" required minLength={8} />
        </FormField>
        {error ? <p className="form-field-error">{error}</p> : null}
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
        <button
          className="btn-primary w-full"
          disabled={loading || !token}
          type="submit"
        >
          {loading ? t(locale, "loading") : t(locale, "submit")}
        </button>
      </form>
    </AuthPanel>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <LoadingState label="…" />
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
