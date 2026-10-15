"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { FormField, LoadingState, SuccessBanner } from "@/components/ui";
import {
  clientDeleteAdminSettingsAsset,
  clientGetAdminSettings,
  clientListAdminCategories,
  clientMe,
  clientPatchAdminSettings,
  clientUploadAdminSettingsAsset,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

type SettingsForm = Record<string, string>;
type AssetKind =
  "logo" | "login-logo" | "system-logo" | "favicon" | "default-cover";
type FieldDef = {
  key: string;
  label: string;
  type?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  counter?: [number, number];
};
type Section = {
  id: string;
  title?: string;
  description?: string;
  fields?: FieldDef[];
  assets?: boolean;
};

// One scrolling page. The first section keeps the original settings layout (same fields, order and labels).
const SECTIONS: Section[] = [
  {
    id: "general",
    title: "General",
    description:
      "Site names and SEO text appear in browser tabs and search results. Keep SEO titles to about 50–60 characters and meta descriptions to 120–160 characters, unique and descriptive. WhatsApp uses international format (+856…); links must start with https://.",
    fields: [
      { key: "site_name_lo", label: "Site name (Lao)", required: true },
      { key: "site_name_en", label: "Site name (English)", required: true },
      {
        key: "timezone",
        label: "Timezone",
        required: true,
        placeholder: "Asia/Vientiane",
      },
      { key: "contact_email", label: "Contact email", type: "email" },
      {
        key: "whatsapp_number",
        label: "WhatsApp",
        type: "tel",
        placeholder: "+8562012345678",
      },
      { key: "facebook_url", label: "Facebook URL", type: "url" },
      { key: "tiktok_url", label: "TikTok URL", type: "url" },
      {
        key: "default_seo_title_lo",
        label: "SEO title (Lao)",
        counter: [30, 60],
      },
      {
        key: "default_seo_title_en",
        label: "SEO title (English)",
        counter: [30, 60],
      },
      {
        key: "default_meta_description_lo",
        label: "Meta description (Lao)",
        type: "textarea",
        counter: [120, 160],
      },
      {
        key: "default_meta_description_en",
        label: "Meta description (English)",
        type: "textarea",
        counter: [120, 160],
      },
    ],
  },
  {
    id: "organization",
    title: "Organization & contact",
    description:
      "Shown in the footer, on the Contact page and in the Privacy Policy and Terms. Leave a contact field blank to hide it; provide at least one way to reach you.",
    fields: [
      { key: "organization_name", label: "Organization name" },
      { key: "system_name", label: "System name" },
      {
        key: "contact_phone",
        label: "Phone",
        type: "tel",
        placeholder: "+856 21 123 456",
      },
      {
        key: "website",
        label: "Website",
        type: "url",
        placeholder: "https://example.com",
      },
      { key: "address", label: "Address", type: "textarea" },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        hint: "Shown under the logo in the footer.",
      },
    ],
  },
  {
    id: "branding",
    title: "Logo & images",
    description:
      "Use PNG or WebP. Logos look sharpest at twice their display size (e.g. 480 × 160 px) with a transparent background; the favicon should be square, at least 512 × 512 px. Max 2 MB each. Changes are previewed here and applied when you save.",
    assets: true,
  },
  {
    id: "documents",
    title: "Documents",
    description:
      "Defaults used when creating documents. Allow only the file types you need; PDF is recommended for published documents because it opens the same on every device.",
    fields: [
      { key: "default_document_category", label: "Default document category" },
      { key: "default_document_status", label: "Default document status" },
      {
        key: "allowed_file_types",
        label: "Allowed file types",
        placeholder: "pdf,docx,xlsx",
        hint: "Comma-separated: pdf, doc, docx, xls, xlsx, csv, txt, zip, jpg, jpeg, png, webp.",
      },
      {
        key: "max_file_size_mb",
        label: "Maximum file size (MB)",
        type: "number",
      },
      {
        key: "document_number_format",
        label: "Document numbering format",
        placeholder: "DOC-2026-0001",
      },
    ],
  },
  {
    id: "appearance",
    title: "Appearance",
    description:
      "Brand colors apply in light mode; dark mode keeps its own accessible palette. Primary and secondary colors sit behind white text (buttons, footer), so they need at least 4.5:1 contrast with white; the accent color is used for icons and highlights and needs at least 3:1 against white (WCAG 2.1 AA). The ratio is checked under each color.",
    fields: [
      { key: "primary_color", label: "Primary color", type: "color" },
      { key: "secondary_color", label: "Secondary color", type: "color" },
      { key: "accent_color", label: "Accent color", type: "color" },
      { key: "application_title", label: "Application title" },
      { key: "sidebar_title", label: "Admin sidebar title" },
      { key: "dashboard_title", label: "Dashboard title" },
      {
        key: "footer_text",
        label: "Footer text",
        hint: "Leave blank to use “© year organization name”.",
      },
    ],
  },
];

type BuiltInImage = { src: string; dark?: boolean; note: string };

// Images the website uses when nothing has been uploaded (see brand-logo.tsx, site-footer.tsx, app/layout.tsx).
const ASSETS: Array<{
  kind: AssetKind;
  label: string;
  key: string;
  hint: string;
  builtIn: BuiltInImage;
}> = [
  {
    kind: "logo",
    label: "Site logo",
    key: "logo_url",
    hint: "Main logo, used everywhere unless a specific logo below is set.",
    builtIn: {
      src: "/brand/logo-light.png",
      note: "In use now: the built-in BAN BUNSI logo.",
    },
  },
  {
    kind: "system-logo",
    label: "Header & admin logo",
    key: "system_logo_url",
    hint: "Website header, admin sidebar and footer.",
    builtIn: {
      src: "/brand/logo-light.png",
      note: "In use now: the site logo above (built-in if none is uploaded).",
    },
  },
  {
    kind: "login-logo",
    label: "Login page logo",
    key: "login_logo_url",
    hint: "Sign-in and registration pages (dark background).",
    builtIn: {
      src: "/brand/logo-dark.png",
      dark: true,
      note: "In use now: the built-in logo for dark backgrounds.",
    },
  },
  {
    kind: "favicon",
    label: "Favicon",
    key: "favicon_url",
    hint: "Browser tab icon. Use a square PNG, e.g. 512 × 512 px.",
    builtIn: {
      src: "/favicon-192.png",
      note: "In use now: the built-in BAN BUNSI icon.",
    },
  },
  {
    kind: "default-cover",
    label: "Default document cover",
    key: "default_cover_url",
    hint: "Shown for documents without their own cover.",
    builtIn: {
      src: "/brand/categories/cat-accounting.jpg",
      note: "In use now: each document shows the image of its category.",
    },
  },
];

function toForm(data: Record<string, unknown>): SettingsForm {
  const form = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ]),
  );
  form.max_file_size_mb = String(
    Number(data.max_file_size_bytes || 2 * 1024 * 1024) / (1024 * 1024),
  );
  return form;
}

const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** A staged image change: a new file to upload, or removal of the saved image. */
type PendingAsset = { file: File; preview: string } | "remove";

function assetFileError(file: File) {
  if (
    !ASSET_TYPES.includes(file.type) &&
    !/\.(jpe?g|png|webp)$/i.test(file.name)
  ) {
    return "Choose a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_ASSET_BYTES) return "Image must be 2 MiB or smaller.";
  return "";
}

function AssetControl({
  kind,
  label,
  hint,
  builtIn,
  savedSrc,
  pending,
  disabled,
  onSelect,
  onRemove,
  onUndo,
}: {
  kind: AssetKind;
  label: string;
  hint: string;
  builtIn: BuiltInImage;
  savedSrc: string;
  pending?: PendingAsset;
  disabled: boolean;
  onSelect: (kind: AssetKind, file: File) => void;
  onRemove: (kind: AssetKind) => void;
  onUndo: (kind: AssetKind) => void;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  const src = pending === "remove" ? "" : pending?.preview || savedSrc;
  // With nothing uploaded (or a removal pending), preview the built-in image the website falls back to.
  const usingBuiltIn = !src;
  const shown = src || builtIn.src;
  const isCover = kind === "default-cover";
  return (
    <section className="grid gap-4 border-b border-bb-border py-4 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <div
        className={`relative flex h-24 w-28 items-center justify-center overflow-hidden rounded-md border border-bb-border ${usingBuiltIn && builtIn.dark ? "bg-[#0b1f6b]" : "bg-bb-surface"}`}
      >
        {failedSrc !== shown ? (
          <Image
            src={shown}
            alt={`${label} preview`}
            fill
            sizes="112px"
            unoptimized={!shown.startsWith("/")}
            onError={() => setFailedSrc(shown)}
            className={isCover ? "object-cover" : "object-contain p-2"}
          />
        ) : (
          <span className="text-xs text-bb-text-muted">
            Preview unavailable
          </span>
        )}
        {usingBuiltIn ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-medium text-white">
            Built-in
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {label}
            {pending ? (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                {pending === "remove" ? "Will be removed" : "Unsaved"}
              </span>
            ) : null}
          </h3>
          <p className="mt-1 text-xs text-bb-text-muted">{hint}</p>
          {usingBuiltIn ? (
            <p className="mt-0.5 text-xs text-bb-text-muted">
              {pending === "remove"
                ? "After saving, the website goes back to the built-in image."
                : `${builtIn.note} Upload an image to replace it.`}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-bb-text-muted">
            JPG, PNG, or WebP · up to 2 MB
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className={`btn-secondary ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            {src ? "Replace" : "Upload"}
            <input
              className="sr-only"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) onSelect(kind, file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {pending ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={disabled}
              onClick={() => onUndo(kind)}
            >
              Undo
            </button>
          ) : null}
          {savedSrc && pending !== "remove" ? (
            <button
              type="button"
              className="btn-secondary text-rose-600"
              disabled={disabled}
              onClick={() => onRemove(kind)}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** WCAG contrast ratio of a #RRGGBB color against white text. */
function contrastWithWhite(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

export default function AdminSettingsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [savedForm, setSavedForm] = useState<SettingsForm | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [pendingAssets, setPendingAssets] = useState<
    Partial<Record<AssetKind, PendingAsset>>
  >({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-dismiss success notifications; errors stay until the next action.
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function loadSettings() {
    const settings = toForm(await clientGetAdminSettings());
    setForm(settings);
    setSavedForm(settings);
  }

  useEffect(() => {
    clientMe()
      .then(async (user) => {
        if (!["admin", "owner"].includes(user.staff_role)) {
          router.replace(`/${locale}/admin`);
          return;
        }
        await Promise.all([
          loadSettings(),
          clientListAdminCategories(locale).then(({ items }) =>
            setCategories(items),
          ),
        ]);
      })
      .catch(() => router.replace(`/${locale}/auth/login`));
  }, [locale, router]);

  function releasePreview(pending?: PendingAsset) {
    if (pending && pending !== "remove") URL.revokeObjectURL(pending.preview);
  }

  function stageAsset(kind: AssetKind, next?: PendingAsset) {
    setPendingAssets((current) => {
      releasePreview(current[kind]);
      const updated = { ...current };
      if (next) updated[kind] = next;
      else delete updated[kind];
      return updated;
    });
  }

  function selectAsset(kind: AssetKind, file: File) {
    const problem = assetFileError(file);
    if (problem) {
      setMessage("");
      setError(problem);
      return;
    }
    setError("");
    stageAsset(kind, { file, preview: URL.createObjectURL(file) });
  }

  const fieldsDirty = Boolean(
    form &&
    savedForm &&
    Object.keys(form).some((key) => form[key] !== savedForm[key]),
  );
  const assetsDirty = Object.keys(pendingAssets).length > 0;
  const dirty = fieldsDirty || assetsDirty;

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function onCancel() {
    Object.values(pendingAssets).forEach(releasePreview);
    setPendingAssets({});
    setForm(savedForm);
    setError("");
    setMessage("Changes discarded.");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || !dirty) return;
    setLoading(true);
    setError("");
    setMessage("");
    const failures: string[] = [];
    try {
      if (fieldsDirty) {
        const payload: Record<string, unknown> = { ...form };
        delete payload.max_file_size_mb;
        payload.max_file_size_bytes = Math.round(
          Number(form.max_file_size_mb || 2) * 1024 * 1024,
        );
        await clientPatchAdminSettings(payload);
      }
      const remaining: Partial<Record<AssetKind, PendingAsset>> = {};
      for (const [kind, pending] of Object.entries(pendingAssets) as Array<
        [AssetKind, PendingAsset]
      >) {
        const label =
          ASSETS.find((asset) => asset.kind === kind)?.label || kind;
        try {
          if (pending === "remove") await clientDeleteAdminSettingsAsset(kind);
          else await clientUploadAdminSettingsAsset(kind, pending.file);
          releasePreview(pending);
        } catch (reason) {
          remaining[kind] = pending;
          failures.push(
            `${label}: ${reason instanceof Error ? reason.message : "upload failed"}`,
          );
        }
      }
      setPendingAssets(remaining);
      // Fields were saved above, so it is safe to reset the form to the server's values.
      const settings = toForm(await clientGetAdminSettings());
      setSavedForm(settings);
      setForm(settings);
      window.dispatchEvent(new Event("brand-settings-updated"));
      router.refresh();
      if (failures.length)
        setError(`Some images were not saved. ${failures.join(" ")}`);
      else setMessage("Settings saved successfully.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t(locale, "loadError"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <LoadingState label={t(locale, "loading")} />;

  // Hard limit from the server (MAX_UPLOAD_MB); the Settings value cannot exceed it.
  const maxUploadMb = Math.floor(Number(form.max_upload_bytes || 14 * 1024 * 1024) / (1024 * 1024));
  const update = (key: string, value: string) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  // What the site shows when a field is left blank (mirrors the fallbacks in the public pages and admin shell).
  const siteName =
    (locale === "en" ? form.site_name_en : form.site_name_lo) ||
    form.site_name_en ||
    "BAN BUNSI";
  const defaults: Record<string, string> = {
    organization_name: siteName,
    system_name: "BAN BUNSI",
    description: t(locale, "footerBlurb"),
    application_title: siteName,
    dashboard_title: t(locale, "dashboard"),
    footer_text: `© ${new Date().getFullYear()} ${form.organization_name || siteName}. ${t(locale, "allRights")}`,
    document_number_format: "DOC-2026-0001",
    primary_color: "#0036ad",
    secondary_color: "#061644",
    accent_color: "#27ae60",
    default_seo_title_lo:
      form.application_title || form.site_name_lo || "BAN BUNSI",
    default_seo_title_en:
      form.application_title || form.site_name_en || "BAN BUNSI",
  };

  function fieldHint(field: FieldDef) {
    const value = form?.[field.key] || "";
    const parts = [field.hint];
    if (defaults[field.key] && !value)
      parts.push(`Blank uses the default: “${defaults[field.key]}”.`);
    if (field.key === "max_file_size_mb") {
      parts.push(`Per file, up to ${maxUploadMb} MB (the server's upload limit).`);
    }
    if (field.counter) {
      const [min, max] = field.counter;
      const length = [...value].length;
      parts.push(
        `${length} characters${length && (length < min || length > max) ? ` (recommended ${min}–${max})` : ""}.`,
      );
    }
    if (field.type === "color") {
      const ratio = contrastWithWhite(value || defaults[field.key] || "");
      // Accent is used for icons/highlights on white (non-text, 3:1); the others sit behind white text (4.5:1).
      const isAccent = field.key === "accent_color";
      const minimum = isAccent ? 3 : 4.5;
      const subject = isAccent
        ? "against a white background"
        : "with white text";
      if (ratio)
        parts.push(
          ratio >= minimum
            ? `Contrast ${subject} ${ratio.toFixed(1)}:1 — meets WCAG AA.`
            : `Contrast ${subject} ${ratio.toFixed(1)}:1 — below the ${minimum}:1 minimum; choose a darker color.`,
        );
    }
    return parts.filter(Boolean).join(" ") || undefined;
  }

  function renderField(field: FieldDef) {
    const value = form?.[field.key] || "";
    if (field.key === "default_document_category") {
      return (
        <select
          className="input"
          value={value}
          onChange={(event) => update(field.key, event.target.value)}
        >
          <option value="">No default</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      );
    }
    if (field.key === "default_document_status") {
      return (
        <select
          className="input"
          value={value || "draft"}
          onChange={(event) => update(field.key, event.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      );
    }
    if (field.type === "textarea") {
      return (
        <textarea
          className="input min-h-24"
          placeholder={field.placeholder || defaults[field.key]}
          value={value}
          onChange={(event) => update(field.key, event.target.value)}
        />
      );
    }
    if (field.type === "color") {
      return (
        <div className="flex gap-2">
          <input
            aria-label={`${field.label} picker`}
            className="h-[2.85rem] w-16 shrink-0 cursor-pointer rounded-lg border border-bb-border bg-transparent p-1"
            type="color"
            value={value || defaults[field.key] || "#0036ad"}
            onChange={(event) => update(field.key, event.target.value)}
          />
          <input
            className="input"
            placeholder={defaults[field.key]}
            value={value}
            onChange={(event) => update(field.key, event.target.value)}
          />
        </div>
      );
    }
    const isSize = field.key === "max_file_size_mb";
    return (
      <input
        className="input"
        type={field.type || "text"}
        placeholder={field.placeholder || defaults[field.key]}
        required={field.required}
        min={isSize ? "0.1" : undefined}
        max={isSize ? String(maxUploadMb) : undefined}
        step={isSize ? "0.1" : undefined}
        value={value}
        onChange={(event) => update(field.key, event.target.value)}
      />
    );
  }

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t(locale, "settings")}</h1>
        <p className="mt-1 text-sm text-bb-text-muted">
          Changes apply across the website after you save. Fields marked as
          required cannot be left blank.
        </p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4">
        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            aria-labelledby={
              section.title ? `settings-${section.id}` : undefined
            }
            className={
              index > 0
                ? "space-y-4 border-t border-bb-border pt-6"
                : "space-y-4"
            }
          >
            {section.title ? (
              <div>
                <h2 id={`settings-${section.id}`} className="text-lg font-bold">
                  {section.title}
                </h2>
                {section.description ? (
                  <p className="mt-0.5 text-sm text-bb-text-muted">
                    {section.description}
                  </p>
                ) : null}
              </div>
            ) : null}
            {section.fields?.map((field) => (
              <FormField
                key={field.key}
                label={
                  field.required ? `${field.label} (required)` : field.label
                }
                hint={fieldHint(field)}
              >
                {renderField(field)}
              </FormField>
            ))}
            {section.assets ? (
              <div>
                {ASSETS.map((asset) => (
                  <AssetControl
                    key={asset.kind}
                    kind={asset.kind}
                    label={asset.label}
                    hint={asset.hint}
                    builtIn={asset.builtIn}
                    savedSrc={savedForm?.[asset.key] || ""}
                    pending={pendingAssets[asset.kind]}
                    disabled={loading}
                    onSelect={selectAsset}
                    onRemove={(kind) => stageAsset(kind, "remove")}
                    onUndo={(kind) => stageAsset(kind)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ))}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-bb-border bg-[var(--bb-bg-muted)] py-4">
          <p className="text-sm text-bb-text-muted" aria-live="polite">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={loading || !dirty}
              onClick={onCancel}
            >
              {t(locale, "cancel")}
            </button>
            <button
              className="btn-primary"
              disabled={loading || !dirty}
              type="submit"
            >
              {loading ? t(locale, "loading") : t(locale, "save")}
            </button>
          </div>
        </div>
      </form>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:max-w-sm">
        {error ? (
          <div
            className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg"
            role="alert"
          >
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="font-semibold"
              aria-label="Dismiss"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        ) : null}
        {message ? (
          <div className="pointer-events-auto w-full shadow-lg">
            <SuccessBanner>{message}</SuccessBanner>
          </div>
        ) : null}
      </div>
    </div>
  );
}
