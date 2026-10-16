"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/api";
import { RecentActivity } from "@/components/admin-dashboard";
import {
  clientGetAdminDashboard,
  type DashboardActivity,
} from "@/lib/client-api";
import { t } from "@/lib/i18n";

// Newest activity time this browser has already seen (a per-viewer convenience, so localStorage).
const SEEN_KEY = "banbunsi-admin-notifications-seen";

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return "";
  }
}

function writeSeen(value: string) {
  try {
    localStorage.setItem(SEEN_KEY, value);
  } catch {
    // Storage blocked (private mode): the dot simply shows again next time.
  }
}

/**
 * Admin top-bar bell: the latest real activity (documents, categories and quizzes added, new member
 * registrations) from the dashboard API. The dot marks activity newer than what was last opened.
 */
export function AdminNotifications({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<DashboardActivity[] | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    clientGetAdminDashboard(locale)
      .then((stats) => {
        if (ignore) return;
        setItems(stats.recent_activity || []);
        setSeen(readSeen());
      })
      .catch(() => {
        if (!ignore) setError(true);
      });
    return () => {
      ignore = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const newest = items?.[0]?.at || "";
  const hasNew = Boolean(newest) && newest > seen;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && newest) {
      writeSeen(newest);
      setSeen(newest);
    }
  }

  return (
    <div className="dash-notify" ref={rootRef}>
      <button
        type="button"
        className="dash-icon-btn"
        title={t(locale, "notifications")}
        aria-label={
          hasNew
            ? `${t(locale, "notifications")} (${t(locale, "newNotifications")})`
            : t(locale, "notifications")
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasNew ? <span className="dash-bell-dot" /> : null}
      </button>

      {open ? (
        <div
          className="dash-notify-panel"
          role="dialog"
          aria-label={t(locale, "notifications")}
        >
          <p className="dash-notify-title">{t(locale, "notifications")}</p>
          {/* Following an activity link closes the panel (the admin shell stays mounted). */}
          <div
            className="dov dash-notify-body"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {error ? (
              <p className="dash-notify-note">{t(locale, "loadError")}</p>
            ) : !items ? (
              <p className="dash-notify-note">{t(locale, "loading")}</p>
            ) : (
              <RecentActivity
                locale={locale}
                items={items}
                emptyAction={null}
              />
            )}
          </div>
          <Link
            href={`/${locale}/admin`}
            className="dash-notify-footer"
            onClick={() => setOpen(false)}
          >
            {t(locale, "viewDashboard")} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
