"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clientLogin } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function LoginPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (user.staff_role === "admin" || user.staff_role === "owner" || user.staff_role === "editor") {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">{t(locale, "login")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "email")}</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "password")}</span>
          <input className="input" name="password" type="password" required minLength={8} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "..." : t(locale, "login")}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link className="text-bb-blue hover:underline" href={`/${locale}/auth/register`}>
          {t(locale, "register")}
        </Link>
        <Link className="text-bb-blue hover:underline" href={`/${locale}/auth/forgot-password`}>
          {t(locale, "forgotPassword")}
        </Link>
      </div>
    </div>
  );
}
