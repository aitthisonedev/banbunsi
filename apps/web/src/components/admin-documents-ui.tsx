"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";
import { imageVariant } from "@/lib/image-variants";

/** Shared building blocks for the admin document pages (list, detail, new, edit). */

// Utility-only classes: the global .btn-* / .surface-panel rules are unlayered and would override Tailwind sizing.
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bb-blue)] disabled:cursor-not-allowed disabled:opacity-60";

export const btn = {
  primary: `${BTN_BASE} min-h-10 px-4 bg-bb-blue text-white hover:bg-bb-blue-hover dark:bg-[#2f5fd6] dark:hover:bg-[#3463d9]`,
  secondary: `${BTN_BASE} min-h-10 px-4 border border-bb-border bg-[var(--bb-surface)] hover:bg-bb-muted`,
  secondarySm: `${BTN_BASE} min-h-9 px-3 border border-bb-border bg-[var(--bb-surface)] hover:bg-bb-muted`,
  dangerSm: `${BTN_BASE} min-h-9 px-3 border border-transparent text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40`,
  /** Outlined like secondarySm, so an Edit + Delete pair is visually balanced in table rows. */
  dangerOutlineSm: `${BTN_BASE} min-h-9 px-3 border border-rose-200 bg-[var(--bb-surface)] text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40`,
  danger: `${BTN_BASE} min-h-10 px-4 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40`,
};

export const panelClass =
  "rounded-2xl border border-bb-border bg-[var(--bb-surface)] shadow-[0_10px_28px_rgba(15,23,42,0.04)]";

export const fieldClass =
  "w-full min-h-10 rounded-lg border border-bb-border bg-[var(--bb-surface)] px-3 text-sm text-[var(--bb-text)] focus:outline-2 focus:outline-[color-mix(in_srgb,var(--bb-blue)_35%,transparent)]";

const COVER_SIZES = {
  sm: "w-14 sm:w-16",
  md: "w-20 sm:w-24",
  lg: "w-full max-w-[280px]",
} as const;

export function DocumentCover({
  locale,
  src: primarySrc,
  fallbackSrc,
  title,
  size = "sm",
}: {
  locale: Locale;
  src?: string;
  /** Shown when `src` is missing or fails to load (e.g. a category image). */
  fallbackSrc?: string;
  title: string;
  size?: keyof typeof COVER_SIZES;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  // Uploaded covers are requested at thumbnail size from the API.
  const resizedPrimary = imageVariant(primarySrc, size === "lg" ? 640 : 160);
  const src = [resizedPrimary, fallbackSrc].find(
    (candidate) => candidate && !failed.includes(candidate),
  );
  const showImage = Boolean(src);
  return (
    <div
      className={`relative aspect-[3/4] shrink-0 overflow-hidden rounded-md border border-bb-border bg-bb-muted ${COVER_SIZES[size]}`}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={t(locale, "coverOf", { title })}
          fill
          sizes={size === "lg" ? "280px" : "96px"}
          unoptimized={!src!.startsWith("/")}
          onError={() => setFailed((current) => [...current, src!])}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-bb-text-muted">
          <svg
            viewBox="0 0 24 24"
            className={size === "lg" ? "h-10 w-10" : "h-5 w-5"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M7 3h7l5 5v13H7z" strokeLinejoin="round" />
            <path d="M14 3v5h5M10 13h6M10 17h4" strokeLinecap="round" />
          </svg>
          {size === "lg" ? (
            <span className="text-sm">{t(locale, "noCoverImage")}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300",
  draft:
    "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300",
  archived:
    "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300",
};

// Dictionary keys for each status; unknown values are shown as sent by the API.
const STATUS_LABEL: Record<string, string> = {
  published: "published",
  draft: "draft",
  archived: "archived",
};

export function StatusBadge({
  locale,
  status,
}: {
  locale: Locale;
  status?: string;
}) {
  const value = status || "draft";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[value] || STATUS_STYLE.draft}`}
    >
      {STATUS_LABEL[value] ? t(locale, STATUS_LABEL[value]) : value}
    </span>
  );
}

const ACCESS_LABEL: Record<string, string> = {
  public: "badgePublic",
  member: "accessMembers",
  vip: "badgeVip",
};

export function AccessBadge({
  locale,
  access,
}: {
  locale: Locale;
  access?: string;
}) {
  const value = access || "public";
  return (
    <span className="inline-flex items-center rounded-full bg-bb-tint px-2 py-0.5 text-xs font-medium text-bb-blue">
      {ACCESS_LABEL[value] ? t(locale, ACCESS_LABEL[value]) : value}
    </span>
  );
}

/** Centered message for empty and error states, with an optional action. */
export function StatePanel({
  tone = "neutral",
  title,
  description,
  action,
}: {
  tone?: "neutral" | "error";
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center px-6 py-14 text-center"
      role={tone === "error" ? "alert" : undefined}
    >
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${tone === "error" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40" : "bg-bb-tint text-bb-blue"}`}
      >
        {tone === "error" ? (
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 8v5M12 16.5v.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M7 3h7l5 5v13H7z" strokeLinejoin="round" />
            <path d="M14 3v5h5" />
          </svg>
        )}
      </div>
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-bb-text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}

/** Placeholder rows shown while the document list loads. */
export function DocumentRowsSkeleton({
  locale,
  rows = 5,
}: {
  locale: Locale;
  rows?: number;
}) {
  return (
    <div
      className="divide-y divide-[var(--bb-border)]"
      role="status"
      aria-label={t(locale, "loadingDocuments")}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 p-4">
          <div className="aspect-[3/4] w-14 shrink-0 rounded-md bg-bb-muted sm:w-16" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-bb-muted" />
            <div className="h-3 w-1/3 rounded bg-bb-muted" />
          </div>
          <div className="hidden h-9 w-24 rounded-md bg-bb-muted sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Page-level loading placeholder for detail and form pages. */
export function PageSkeleton({ locale }: { locale: Locale }) {
  return (
    <div
      className="w-full animate-pulse space-y-6"
      role="status"
      aria-label={t(locale, "loading")}
    >
      <div className="h-4 w-32 rounded bg-bb-muted" />
      <div className="h-8 w-2/3 rounded bg-bb-muted" />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="aspect-[3/4] w-full max-w-[280px] rounded-lg bg-bb-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-10 rounded bg-bb-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Breadcrumb-style back link plus page title, description and actions. */
export function PageHeader({
  back,
  eyebrow,
  title,
  description,
  badges,
  actions,
}: {
  back?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-xs text-bb-text-muted">{eyebrow}</p>
          ) : null}
          <h1 className="break-words text-2xl font-bold leading-tight">
            {title}
          </h1>
          {badges ? (
            <div className="mt-2 flex flex-wrap gap-2">{badges}</div>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-bb-text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
