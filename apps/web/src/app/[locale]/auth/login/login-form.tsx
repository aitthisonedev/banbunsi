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

export function LoginForm() {
  const params = useParams();
  const search = useSearchParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
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
      title={t(locale, "login")}
      footer={
        <>
          <Link className="text-bb-blue hover:underline" href={`/${locale}/auth/register`}>
            {t(locale, "register")}
          </Link>
          <Link
            className="text-bb-blue hover:underline"
            href={`/${locale}/auth/forgot-password`}
          >
            {t(locale, "forgotPassword")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t(locale, "email")}>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField label={t(locale, "password")}>
          <input
            className="input"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </FormField>
        {error ? <p className="form-field-error">{error}</p> : null}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? t(locale, "loading") : t(locale, "login")}
        </button>
      </form>
    </AuthPanel>
  );
}
