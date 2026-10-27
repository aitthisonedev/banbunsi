"use client";

import { useState } from "react";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

export type PreviewFile = { id: string; label: string; url: string };

function previewUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}preview=1`;
}

// PDF viewer open parameters: no thumbnail sidebar, page fitted to the frame's width.
const FRAME_VIEW = "#navpanes=0&view=FitH";

/**
 * Reads a PDF on the document page. The API checks sign-in and file access for the frame the
 * same way as for downloads, so only files the viewer may download are passed in.
 */
export function DocumentPreview({
  locale,
  files,
}: {
  locale: Locale;
  files: PreviewFile[];
}) {
  const [selectedId, setSelectedId] = useState(files[0]?.id);
  const selected = files.find((file) => file.id === selectedId) || files[0];
  if (!selected) return null;
  const src = previewUrl(selected.url);

  return (
    <div className="doc-preview">
      <div className="doc-preview-bar">
        {files.length > 1 ? (
          <div
            className="doc-preview-tabs"
            role="group"
            aria-label={t(locale, "files")}
          >
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                aria-pressed={file.id === selected.id}
                className={`doc-preview-tab${file.id === selected.id ? " is-active" : ""}`}
                onClick={() => setSelectedId(file.id)}
              >
                {file.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="doc-preview-name">{selected.label}</span>
        )}
        <a
          href={src}
          target="_blank"
          rel="noopener"
          className="doc-preview-open"
        >
          {t(locale, "openInNewTab")}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </a>
      </div>
      <iframe
        key={selected.id}
        src={`${src}${FRAME_VIEW}`}
        title={`${t(locale, "filePreview")}: ${selected.label}`}
        className="doc-preview-frame"
        loading="lazy"
      />
    </div>
  );
}
