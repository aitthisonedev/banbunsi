"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  clientGetAdminSettings,
  clientMe,
  clientPatchAdminSettings,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminSettingsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}/admin`);
          return;
        }
        setForm(await clientGetAdminSettings());
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [locale, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await clientPatchAdminSettings(form);
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (!form.contact_email) {
    return <div className="mx-auto max-w-3xl px-4 py-12">Loading...</div>;
  }

  const fields = [
    "site_name_lo",
    "site_name_en",
    "timezone",
    "contact_email",
    "whatsapp_number",
    "facebook_url",
    "tiktok_url",
    "default_seo_title_lo",
    "default_seo_title_en",
    "default_meta_description_lo",
    "default_meta_description_en",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-5">
      <h1 className="text-3xl font-bold">{t(locale, "settings")}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {fields.map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-bb-text-muted">{key}</span>
            <input
              className="input"
              value={form[key] || ""}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn-primary" disabled={loading} type="submit">
          {loading ? "..." : t(locale, "submit")}
        </button>
      </form>
    </div>
  );
}
