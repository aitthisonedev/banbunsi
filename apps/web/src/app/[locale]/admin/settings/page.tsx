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

type SettingsTab = "general" | "branding" | "documents" | "appearance" | "system";
type SettingsForm = Record<string, string>;
type AssetKind = "logo" | "login-logo" | "system-logo" | "favicon" | "default-cover";

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "documents", label: "Documents" },
  { id: "appearance", label: "Appearance" },
  { id: "system", label: "System" },
];

const FIELDS: Record<Exclude<SettingsTab, "branding">, Array<{ key: string; label: string; type?: string }>> = {
  general: [
    { key: "organization_name", label: "Organization / Company Name" },
    { key: "system_name", label: "System Name" },
    { key: "site_name_lo", label: "Site Name (Lao)" },
    { key: "site_name_en", label: "Site Name (English)" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "contact_phone", label: "Phone", type: "tel" },
    { key: "contact_email", label: "Email", type: "email" },
    { key: "whatsapp_number", label: "WhatsApp", type: "tel" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "website", label: "Website", type: "url" },
    { key: "facebook_url", label: "Facebook URL", type: "url" },
    { key: "tiktok_url", label: "TikTok URL", type: "url" },
  ],
  documents: [
    { key: "default_document_category", label: "Default document category" },
    { key: "default_document_status", label: "Default document status" },
    { key: "allowed_file_types", label: "Allowed file types (comma-separated)" },
    { key: "max_file_size_mb", label: "Maximum file size (MiB)", type: "number" },
    { key: "document_number_format", label: "Document numbering format" },
  ],
  appearance: [
    { key: "primary_color", label: "Primary color", type: "color" },
    { key: "secondary_color", label: "Secondary color", type: "color" },
    { key: "accent_color", label: "Accent color", type: "color" },
    { key: "application_title", label: "Application title" },
    { key: "sidebar_title", label: "Sidebar title" },
    { key: "dashboard_title", label: "Dashboard title" },
    { key: "footer_text", label: "Footer text", type: "textarea" },
  ],
  system: [
    { key: "timezone", label: "Timezone" },
    { key: "default_seo_title_lo", label: "SEO title (Lao)" },
    { key: "default_seo_title_en", label: "SEO title (English)" },
    { key: "default_meta_description_lo", label: "Meta description (Lao)", type: "textarea" },
    { key: "default_meta_description_en", label: "Meta description (English)", type: "textarea" },
  ],
};

const ASSETS: Array<{ kind: AssetKind; label: string; key: string }> = [
  { kind: "logo", label: "Site Logo", key: "logo_url" },
  { kind: "login-logo", label: "Login Page Logo", key: "login_logo_url" },
  { kind: "system-logo", label: "System Logo", key: "system_logo_url" },
  { kind: "favicon", label: "Favicon", key: "favicon_url" },
  { kind: "default-cover", label: "Default Document Cover", key: "default_cover_url" },
];

function toForm(data: Record<string, unknown>): SettingsForm {
  const form = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value == null ? "" : String(value)]),
  );
  form.max_file_size_mb = String(Number(data.max_file_size_bytes || 2 * 1024 * 1024) / (1024 * 1024));
  return form;
}

const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** A staged image change: a new file to upload, or removal of the saved image. */
type PendingAsset = { file: File; preview: string } | "remove";

function assetFileError(file: File) {
  if (!ASSET_TYPES.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return "Choose a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_ASSET_BYTES) return "Image must be 2 MiB or smaller.";
  return "";
}

function AssetControl({
  kind,
  label,
  savedSrc,
  pending,
  disabled,
  onSelect,
  onRemove,
  onUndo,
}: {
  kind: AssetKind;
  label: string;
  savedSrc: string;
  pending?: PendingAsset;
  disabled: boolean;
  onSelect: (kind: AssetKind, file: File) => void;
  onRemove: (kind: AssetKind) => void;
  onUndo: (kind: AssetKind) => void;
}) {
  const [failedSrc, setFailedSrc] = useState("");
  const src = pending === "remove" ? "" : pending?.preview || savedSrc;
  return (
    <section className="grid gap-4 border-b border-bb-border py-4 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)]">
      <div className="relative flex h-24 w-28 items-center justify-center overflow-hidden rounded-md border border-bb-border bg-bb-surface">
        {src && failedSrc !== src ? (
          <Image src={src} alt={`${label} preview`} fill sizes="112px" unoptimized onError={() => setFailedSrc(src)} className="object-contain p-2" />
        ) : <span className="text-xs text-bb-text-muted">{src ? "Preview unavailable" : "No image"}</span>}
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
          <p className="mt-1 text-xs text-bb-text-muted">JPG, PNG, or WebP · up to 2 MiB</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`btn-secondary ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            {src ? "Replace" : "Upload"}
            <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onSelect(kind, file);
              event.currentTarget.value = "";
            }} />
          </label>
          {pending ? (
            <button type="button" className="btn-secondary" disabled={disabled} onClick={() => onUndo(kind)}>Undo</button>
          ) : null}
          {savedSrc && pending !== "remove" ? (
            <button type="button" className="btn-secondary text-rose-600" disabled={disabled} onClick={() => onRemove(kind)}>Remove</button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [savedForm, setSavedForm] = useState<SettingsForm | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [pendingAssets, setPendingAssets] = useState<Partial<Record<AssetKind, PendingAsset>>>({});
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
          clientListAdminCategories(locale).then(({ items }) => setCategories(items)),
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

  const fieldsDirty = Boolean(form && savedForm && Object.keys(form).some((key) => form[key] !== savedForm[key]));
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
        payload.max_file_size_bytes = Math.round(Number(form.max_file_size_mb || 2) * 1024 * 1024);
        await clientPatchAdminSettings(payload);
      }
      const remaining: Partial<Record<AssetKind, PendingAsset>> = {};
      for (const [kind, pending] of Object.entries(pendingAssets) as Array<[AssetKind, PendingAsset]>) {
        const label = ASSETS.find((asset) => asset.kind === kind)?.label || kind;
        try {
          if (pending === "remove") await clientDeleteAdminSettingsAsset(kind);
          else await clientUploadAdminSettingsAsset(kind, pending.file);
          releasePreview(pending);
        } catch (reason) {
          remaining[kind] = pending;
          failures.push(`${label}: ${reason instanceof Error ? reason.message : "upload failed"}`);
        }
      }
      setPendingAssets(remaining);
      // Fields were saved above, so it is safe to reset the form to the server's values.
      const settings = toForm(await clientGetAdminSettings());
      setSavedForm(settings);
      setForm(settings);
      window.dispatchEvent(new Event("brand-settings-updated"));
      router.refresh();
      if (failures.length) setError(`Some images were not saved. ${failures.join(" ")}`);
      else setMessage("Settings saved successfully.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <LoadingState label={t(locale, "loading")} />;

  const fields = activeTab === "branding" ? [] : FIELDS[activeTab];
  return (
    <div className="w-full max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{t(locale, "settings")}</h1>
        <p className="mt-1 text-sm text-bb-text-muted">Manage the organization, documents, and application appearance.</p>
      </header>
      <div className="flex gap-1 overflow-x-auto border-b border-bb-border" role="tablist" aria-label="Settings sections">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold ${activeTab === tab.id ? "border-bb-blue text-bb-blue" : "border-transparent text-bb-text-muted hover:text-bb-text"}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="surface-panel space-y-5">
        {activeTab === "branding" ? ASSETS.map((asset) => (
          <AssetControl key={asset.kind} kind={asset.kind} label={asset.label} savedSrc={savedForm?.[asset.key] || ""} pending={pendingAssets[asset.kind]} disabled={loading} onSelect={selectAsset} onRemove={(kind) => stageAsset(kind, "remove")} onUndo={(kind) => stageAsset(kind)} />
        )) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <FormField key={field.key} label={field.label}>
                {field.key === "default_document_category" ? (
                  <select className="input" value={form[field.key] || ""} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)}>
                    <option value="">No default</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                ) : field.key === "default_document_status" ? (
                  <select className="input" value={form[field.key] || "draft"} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)}>
                    <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea className="input min-h-24" value={form[field.key] || ""} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)} />
                ) : field.type === "color" ? (
                  <div className="flex gap-2"><input className="h-10 w-14 cursor-pointer rounded border border-bb-border bg-transparent p-1" type="color" value={form[field.key] || "#315b9a"} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)} /><input className="input" value={form[field.key] || ""} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)} /></div>
                ) : (
                  <input className="input" type={field.type || "text"} min={field.key === "max_file_size_mb" ? "0.1" : undefined} max={field.key === "max_file_size_mb" ? "14" : undefined} step={field.key === "max_file_size_mb" ? "0.1" : undefined} value={form[field.key] || ""} onChange={(event) => setForm((current) => current ? { ...current, [field.key]: event.target.value } : current)} />
                )}
              </FormField>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bb-border pt-4">
          <p className="text-sm text-bb-text-muted" aria-live="polite">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" disabled={loading || !dirty} onClick={onCancel}>{t(locale, "cancel")}</button>
            <button className="btn-primary" disabled={loading || !dirty} type="submit">{loading ? t(locale, "loading") : t(locale, "save")}</button>
          </div>
        </div>
      </form>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:max-w-sm">
        {error ? (
          <div className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg" role="alert">
            <span className="flex-1">{error}</span>
            <button type="button" className="font-semibold" aria-label="Dismiss" onClick={() => setError("")}>×</button>
          </div>
        ) : null}
        {message ? <div className="pointer-events-auto w-full shadow-lg"><SuccessBanner>{message}</SuccessBanner></div> : null}
      </div>
    </div>
  );
}
