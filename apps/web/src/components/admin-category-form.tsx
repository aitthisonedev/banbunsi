"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, SuccessBanner } from "@/components/ui";
import type { AdminCategory, AdminCategoryPayload } from "@/lib/client-api";
import {
  clientCreateAdminCategory,
  clientUpdateAdminCategory,
} from "@/lib/client-api";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

function emptyPayload(): AdminCategoryPayload {
  return {
    code: "",
    sort_order: 0,
    is_active: true,
    translations: [
      { locale: "lo", name: "", description: "", slug: "", seo_title: "" },
      { locale: "en", name: "", description: "", slug: "", seo_title: "" },
    ],
  };
}

function fromCategory(cat: AdminCategory): AdminCategoryPayload {
  const byLocale = Object.fromEntries(
    cat.translations.map((tr) => [tr.locale, tr]),
  );
  return {
    code: cat.code,
    sort_order: cat.sort_order,
    is_active: cat.is_active,
    translations: (["lo", "en"] as const).map((locale) => ({
      locale,
      name: byLocale[locale]?.name || "",
      description: byLocale[locale]?.description || "",
      slug: byLocale[locale]?.slug || "",
      seo_title: byLocale[locale]?.seo_title || "",
    })),
  };
}

export function AdminCategoryForm({
  locale,
  initial,
}: {
  locale: Locale;
  initial?: AdminCategory;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminCategoryPayload>(
    initial ? fromCategory(initial) : emptyPayload(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (initial) {
        await clientUpdateAdminCategory(initial.id, form);
        setMessage(t(locale, "saved"));
      } else {
        const created = await clientCreateAdminCategory(form);
        router.push(`/${locale}/admin/categories/${created.id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      {error ? (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      ) : null}

      <div className="admin-form-grid cols-2">
        <FormField label={t(locale, "categoryCode")}>
          <input
            className="input"
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
        </FormField>
        <FormField label={t(locale, "sortOrder")}>
          <input
            className="input"
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sort_order: Number(e.target.value) || 0,
              }))
            }
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_active: e.target.checked }))
          }
        />
        {t(locale, "active")}
      </label>

      {form.translations.map((tr, idx) => (
        <div key={tr.locale} className="admin-locale-block">
          <h3>{tr.locale.toUpperCase()}</h3>
          <FormField label={t(locale, "name")}>
            <input
              className="input"
              required
              value={tr.name}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = { ...translations[idx], name: value };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "slug")}>
            <input
              className="input"
              required
              value={tr.slug}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = { ...translations[idx], slug: value };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "description")}>
            <textarea
              className="input"
              rows={3}
              value={tr.description}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = {
                    ...translations[idx],
                    description: value,
                  };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "seoTitle")}>
            <input
              className="input"
              value={tr.seo_title || ""}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = {
                    ...translations[idx],
                    seo_title: value,
                  };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
        </div>
      ))}

      <div className="admin-actions-row">
        <button className="btn-primary" type="submit" disabled={loading}>
          {t(locale, "save")}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push(`/${locale}/admin/categories`)}
        >
          {t(locale, "cancel")}
        </button>
      </div>
    </form>
  );
}
