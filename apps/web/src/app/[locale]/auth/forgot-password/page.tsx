"use client";

import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { clientForgotPassword } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await clientForgotPassword(String(fd.get("email") || ""));
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">{t(locale, "forgotPassword")}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "email")}</span>
          <input className="input" name="email" type="email" required />
        </label>
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "..." : t(locale, "submit")}
        </button>
      </form>
    </div>
  );
}
