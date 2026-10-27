"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Document cover that opens full size when clicked. Uses the native <dialog>, so Escape, focus
 * handling and the backdrop come from the browser; a click outside the image also closes it.
 */
export function CoverViewer({
  src,
  fullSrc,
  alt,
  unoptimized,
  openLabel,
  closeLabel,
}: {
  src: string;
  /** The original image, shown complete (not cropped) in the viewer. */
  fullSrc: string;
  alt: string;
  unoptimized: boolean;
  openLabel: string;
  closeLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="doc-cover-trigger"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        title={openLabel}
      >
        <span className="doc-cover-frame">
          <Image
            src={src}
            unoptimized={unoptimized}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 40vw, 100vw"
            className="doc-cover-img"
          />
        </span>
        <span className="doc-cover-zoom" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="doc-cover-dialog"
        aria-label={alt}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open ? (
          <>
            {/* Full-size view of an image of unknown dimensions, so a plain <img>. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullSrc} alt={alt} className="doc-cover-full" />
            <button
              type="button"
              className="doc-cover-close"
              onClick={() => setOpen(false)}
              aria-label={closeLabel}
              title={closeLabel}
            >
              ×
            </button>
          </>
        ) : null}
      </dialog>
    </>
  );
}
