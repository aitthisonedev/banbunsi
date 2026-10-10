"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
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
    try {
      const res = await clientRegister(
        String(fd.get("name") || ""),
        String(fd.get("email") || ""),
        String(fd.get("password") || ""),
      );
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">{t(locale, "register")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "name")}</span>
          <input className="input" name="name" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "email")}</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "password")}</span>
          <input className="input" name="password" type="password" required minLength={8} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "..." : t(locale, "submit")}
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link className="text-bb-blue hover:underline" href={`/${locale}/auth/login`}>
          {t(locale, "login")}
        </Link>
      </p>
    </div>
  );
}
