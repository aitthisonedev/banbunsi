"use client";

import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Accessible name of the close buttons, in the page language. */
  closeLabel: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="drawer-root"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="drawer-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="drawer-panel">
        <div className="drawer-head">
          <p className="drawer-title">{title}</p>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
