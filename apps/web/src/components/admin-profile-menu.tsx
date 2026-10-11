"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale, User } from "@/lib/api";
import { avatarSrc } from "@/lib/client-api";
import { t } from "@/lib/i18n";

function getInitials(user: User): string {
  const first = (user.first_name || user.name || "?").trim().charAt(0);
  const last = (user.last_name || "").trim().charAt(0);
  return (first + last).toUpperCase() || "?";
}

export function AdminProfileMenu({
  user,
  locale,
  onLogout,
}: {
  user: User;
  locale: Locale;
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const photo = avatarSrc(user.avatar_url);
  const initials = getInitials(user);
  const displayName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email;
  const isAdminPlus = user.staff_role === "admin" || user.staff_role === "owner";

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="dash-user-menu" ref={menuRef}>
      <button
        type="button"
        className={`dash-user-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={displayName}
      >
        <span className="dash-user-avatar">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={34}
              height={34}
              className="dash-user-avatar-img"
            />
          ) : (
            <span className="dash-user-avatar-initials">{initials}</span>
          )}
        </span>

        <span className="dash-user-meta">
          <span className="dash-user-role-label">
            {user.staff_role === "owner"
              ? "Owner"
              : user.staff_role === "admin"
                ? "Admin"
                : "Editor"}
          </span>
          <span className="dash-user-name-line">
            <span className="dash-user-name">{displayName}</span>
            <svg
              className={`dash-user-chevron ${open ? "is-open" : ""}`}
              viewBox="0 0 20 20"
              width="12"
              height="12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </span>
      </button>

      {open ? (
        <div className="dash-dropdown" role="menu">
          <div className="dash-dropdown-header">
            <span className="dash-user-avatar dash-user-avatar--lg">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  width={42}
                  height={42}
                  className="dash-user-avatar-img"
                />
              ) : (
                <span className="dash-user-avatar-initials">{initials}</span>
              )}
            </span>
            <div className="dash-dropdown-user-info">
              <strong className="dash-dropdown-name">{displayName}</strong>
              <span className="dash-dropdown-email">{user.email}</span>
              <div className="dash-dropdown-badges">
                <span className={`dash-badge dash-badge--${user.staff_role}`}>
                  {user.staff_role}
                </span>
                {user.membership_tier === "vip" ? (
                  <span className="dash-badge dash-badge--vip">VIP</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="dash-dropdown-divider" />

          <div className="dash-dropdown-links">
            <Link
              href={`/${locale}/account`}
              className="dash-dropdown-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{t(locale, "account")}</span>
            </Link>

            {isAdminPlus ? (
              <Link
                href={`/${locale}/admin/members`}
                className="dash-dropdown-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{t(locale, "staffAccess")}</span>
              </Link>
            ) : null}

            <Link
              href={`/${locale}`}
              className="dash-dropdown-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>{t(locale, "backToSite")}</span>
            </Link>
          </div>

          <div className="dash-dropdown-divider" />

          <div className="dash-dropdown-footer">
            <button
              type="button"
              className="dash-dropdown-item dash-dropdown-item--danger"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{t(locale, "logout")}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
