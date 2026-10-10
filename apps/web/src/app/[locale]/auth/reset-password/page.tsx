"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
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
    try {
      const res = await clientResetPassword(token, String(fd.get("password") || ""));
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Reset password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-bb-text-muted">{t(locale, "password")}</span>
          <input className="input" name="password" type="password" required minLength={8} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn-primary w-full" disabled={loading || !token} type="submit">
          {loading ? "..." : t(locale, "submit")}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12">Loading...</div>}>
      <ResetInner />
    </Suspense>
  );
}
