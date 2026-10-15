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
import { slugsFromNames } from "@/lib/form-defaults";
import { t } from "@/lib/i18n";

/** Guidance shown with each part of the form, in the admin's language. */
const GUIDE = {
  lo: {
    settings: "ການຕັ້ງຄ່າໝວດ",
    settingsIntro: "ລະຫັດ ແລະ ລຳດັບ ຖືກຕື່ມໃຫ້ອັດຕະໂນມັດ. ປ່ຽນໄດ້ຖ້າຕ້ອງການ.",
    code: "ລະຫັດພາຍໃນ (ໂຕພິມນ້ອຍ, ບໍ່ມີຍະຫວ່າງ). ຕື່ມໃຫ້ຈາກຊື່ພາສາອັງກິດ.",
    sort: "ເລກນ້ອຍສະແດງກ່ອນ. ໝວດໃໝ່ຖືກວາງໄວ້ທ້າຍສຸດ.",
    active: "ເປີດໃຊ້ງານ: ສະແດງໝວດນີ້ໃນເວັບໄຊ. ປິດໄວ້ເພື່ອເຊື່ອງຊົ່ວຄາວ.",
    blockIntro: "ຂໍ້ມູນທີ່ຜູ້ອ່ານເຫັນໃນພາສານີ້.",
    name: "ສະແດງໃນເມນູ ແລະ ໃນເອກະສານ.",
    namePlaceholder: { lo: "ເຊັ່ນ: ພາສີ", en: "e.g. Tax" },
    slug: "ສ່ວນຂອງທີ່ຢູ່ເວັບ. ຕື່ມໃຫ້ຈາກຊື່; ໃຊ້ໂຕອັກສອນ, ຕົວເລກ ແລະ ຂີດ (-).",
    description: "1–2 ປະໂຫຍກ ອະທິບາຍວ່າໝວດນີ້ມີເອກະສານຫຍັງ.",
    descriptionPlaceholder: { lo: "ເຊັ່ນ: ກົດໝາຍ, ແບບຟອມ ແລະ ຄູ່ມືກ່ຽວກັບພາສີ.", en: "e.g. Tax laws, forms and filing guides." },
    seo: "ຊື່ໃນແຖບບຣາວເຊີ ແລະ ຜົນການຄົ້ນຫາ (ປະມານ 50–60 ໂຕອັກສອນ). ປ່ອຍວ່າງເພື່ອໃຊ້ຊື່ໝວດ.",
    langName: { lo: "ພາສາລາວ", en: "ພາສາອັງກິດ" },
  },
  en: {
    settings: "Category settings",
    settingsIntro: "Code and sort order are filled in for you. Change them if needed.",
    code: "Internal identifier (lowercase, no spaces). Filled from the English name.",
    sort: "Lower numbers appear first. New categories are placed last.",
    active: "Active: show this category on the website. Untick to hide it for now.",
    blockIntro: "What readers see in this language.",
    name: "Shown in menus and on documents.",
    namePlaceholder: { lo: "ເຊັ່ນ: ພາສີ", en: "e.g. Tax" },
    slug: "Part of the web address. Filled from the name; letters, numbers and hyphens only.",
    description: "One or two sentences on what documents this category contains.",
    descriptionPlaceholder: { lo: "ເຊັ່ນ: ກົດໝາຍ, ແບບຟອມ ແລະ ຄູ່ມືກ່ຽວກັບພາສີ.", en: "e.g. Tax laws, forms and filing guides." },
    seo: "Browser tab and search result title (about 50–60 characters). Leave blank to use the name.",
    langName: { lo: "Lao", en: "English" },
  },
} as const;

function emptyPayload(sortOrder: number): AdminCategoryPayload {
  return {
    code: "",
    sort_order: sortOrder,
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
  nextSortOrder = 1,
}: {
  locale: Locale;
  initial?: AdminCategory;
  /** Sort position for a new category (after the existing ones). */
  nextSortOrder?: number;
}) {
  const router = useRouter();
  const guide = GUIDE[locale];
  const [form, setForm] = useState<AdminCategoryPayload>(
    initial ? fromCategory(initial) : emptyPayload(nextSortOrder),
  );
  // New categories fill code and slugs from the names until the admin edits them; existing ones never change automatically.
  const [auto, setAuto] = useState({ code: !initial, lo: !initial, en: !initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateTranslation(idx: number, patch: Partial<AdminCategoryPayload["translations"][number]>) {
    setForm((f) => {
      const translations = [...f.translations];
      translations[idx] = { ...translations[idx], ...patch };
      if (!("name" in patch)) return { ...f, translations };
      const names = {
        lo: translations.find((tr) => tr.locale === "lo")?.name || "",
        en: translations.find((tr) => tr.locale === "en")?.name || "",
      };
      const slugs = slugsFromNames(names);
      const withSlugs = translations.map((tr) =>
        auto[tr.locale as "lo" | "en"] ? { ...tr, slug: slugs[tr.locale as "lo" | "en"] } : tr,
      );
      return { ...f, translations: withSlugs, code: auto.code ? slugs.en.slice(0, 64) : f.code };
    });
  }

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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      {error ? (
        <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>
      ) : null}

      <section className="space-y-3" aria-labelledby="category-settings-heading">
        <div>
          <h2 id="category-settings-heading" className="text-lg font-bold">{guide.settings}</h2>
          <p className="text-sm text-bb-text-muted">{guide.settingsIntro}</p>
        </div>
        <div className="admin-form-grid cols-2">
          <FormField label={t(locale, "categoryCode")} hint={guide.code}>
            <input
              className="input"
              required
              placeholder="tax"
              value={form.code}
              onChange={(e) => {
                setAuto((a) => ({ ...a, code: false }));
                setForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, "-") }));
              }}
            />
          </FormField>
          <FormField label={t(locale, "sortOrder")} hint={guide.sort}>
            <input
              className="input"
              type="number"
              min={0}
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
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.is_active}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.target.checked }))
            }
          />
          <span>
            <span className="font-semibold">{t(locale, "active")}</span>
            <span className="block text-bb-text-muted">{guide.active}</span>
          </span>
        </label>
      </section>

      {form.translations.map((tr, idx) => {
        const lang = tr.locale as "lo" | "en";
        return (
          <div key={tr.locale} className="admin-locale-block">
            <h3>{guide.langName[lang]}</h3>
            <p className="-mt-1 mb-2 text-sm text-bb-text-muted">{guide.blockIntro}</p>
            <FormField label={t(locale, "name")} hint={guide.name}>
              <input
                className="input"
                required
                placeholder={guide.namePlaceholder[lang]}
                value={tr.name}
                onChange={(e) => updateTranslation(idx, { name: e.target.value })}
              />
            </FormField>
            <FormField label={t(locale, "slug")} hint={guide.slug}>
              <input
                className="input"
                required
                placeholder="tax-guides"
                value={tr.slug}
                onChange={(e) => {
                  setAuto((a) => ({ ...a, [lang]: false }));
                  updateTranslation(idx, { slug: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t(locale, "description")} hint={guide.description}>
              <textarea
                className="input"
                rows={3}
                placeholder={guide.descriptionPlaceholder[lang]}
                value={tr.description}
                onChange={(e) => updateTranslation(idx, { description: e.target.value })}
              />
            </FormField>
            <FormField label={t(locale, "seoTitle")} hint={guide.seo}>
              <input
                className="input"
                placeholder={tr.name || guide.namePlaceholder[lang]}
                value={tr.seo_title || ""}
                onChange={(e) => updateTranslation(idx, { seo_title: e.target.value })}
              />
            </FormField>
          </div>
        );
      })}

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
