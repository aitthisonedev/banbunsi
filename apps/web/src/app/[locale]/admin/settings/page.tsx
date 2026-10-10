"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FormField, LoadingState, SuccessBanner } from "@/components/ui";
import {
  clientGetAdminSettings,
  clientMe,
  clientPatchAdminSettings,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const FIELD_LABELS: Record<string, string> = {
  site_name_lo: "Site name (Lao)",
  site_name_en: "Site name (English)",
  timezone: "Timezone",
  contact_email: "Contact email",
  whatsapp_number: "WhatsApp",
  facebook_url: "Facebook URL",
  tiktok_url: "TikTok URL",
  default_seo_title_lo: "SEO title (Lao)",
  default_seo_title_en: "SEO title (English)",
  default_meta_description_lo: "Meta description (Lao)",
  default_meta_description_en: "Meta description (English)",
};

export default function AdminSettingsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string> | null>(null);
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
    if (!form) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await clientPatchAdminSettings(form);
      setMessage(t(locale, "saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  if (!form) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  const fields = Object.keys(FIELD_LABELS);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{t(locale, "settings")}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {fields.map((key) => (
          <FormField key={key} label={FIELD_LABELS[key] || key}>
            <input
              className="input"
              value={form[key] || ""}
              onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
            />
          </FormField>
        ))}
        {error ? <p className="form-field-error">{error}</p> : null}
        {message ? <SuccessBanner>{message}</SuccessBanner> : null}
        <button className="btn-primary" disabled={loading} type="submit">
          {loading ? t(locale, "loading") : t(locale, "save")}
        </button>
      </form>
    </div>
  );
}
