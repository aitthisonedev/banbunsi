"use client";

import { useState } from "react";
import type { Locale } from "@/lib/api";
import { t, translateApiError } from "@/lib/i18n";

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

/** The file name from a Content-Disposition header (readable when the API is on the same site). */
function nameFromDisposition(header: string | null) {
  if (!header) return "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // Fall through to the plain filename.
    }
  }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] || "";
}

/**
 * Downloads a document file on the page itself: the browser fetches it with the visitor's session
 * and saves it under its real name. The API still checks access and records the download; any
 * problem is shown under the button instead of a raw error page.
 */
export function DownloadButton({
  locale,
  fileUrl,
  fileName,
}: {
  locale: Locale;
  fileUrl: string;
  fileName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDownload() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(fileUrl, { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          translateApiError(
            locale,
            data.error || `Request failed (${res.status})`,
          ),
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        nameFromDisposition(res.headers.get("Content-Disposition")) || fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser a moment to start saving before the temporary URL is released.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError(t(locale, "downloadNetworkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="doc-file-download">
      <button
        type="button"
        className="doc-file-btn"
        onClick={onDownload}
        disabled={busy}
        aria-busy={busy}
      >
        <DownloadIcon />
        <span>{busy ? t(locale, "downloading") : t(locale, "download")}</span>
      </button>
      {error ? (
        <p className="doc-file-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
