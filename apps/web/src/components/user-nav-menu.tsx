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

export function UserNavMenu({
  user,
  locale,
  isStaff,
  onLogout,
}: {
  user: User;
  locale: Locale;
  isStaff: boolean;
  onLogout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const photo = avatarSrc(user.avatar_url);
  const initials = getInitials(user);
  const displayName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.email;
  const isVip = user.membership_tier === "vip";

  return (
    <div className="user-nav-menu" ref={menuRef}>
      <button
        type="button"
        className="user-nav-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={displayName}
        title={displayName}
      >
        <span className="user-nav-avatar">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={32}
              height={32}
              className="user-nav-avatar-img"
            />
          ) : (
            <span className="user-nav-avatar-initials">{initials}</span>
          )}
        </span>
        <svg
          className={`user-nav-chevron ${open ? "is-open" : ""}`}
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div className="user-nav-dropdown" role="menu">
          {/* User details header */}
          <div className="user-nav-dropdown-head">
            <span className="user-nav-dropdown-avatar">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  width={40}
                  height={40}
                  className="user-nav-avatar-img"
                />
              ) : (
                <span className="user-nav-avatar-initials">{initials}</span>
              )}
            </span>
            <div className="user-nav-dropdown-info">
              <span className="user-nav-dropdown-name">{displayName}</span>
              <span className="user-nav-dropdown-email">{user.email}</span>
              <span
                className={`user-nav-tier-badge ${isVip ? "is-vip" : "is-member"}`}
              >
                {isVip
                  ? `👑 ${t(locale, "badgeVip")}`
                  : t(locale, "badgeMember")}
              </span>
            </div>
          </div>

          <div className="user-nav-dropdown-divider" />

          {/* Links */}
          <div className="user-nav-dropdown-items">
            <Link
              href={`/${locale}/account`}
              className="user-nav-dropdown-item"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{t(locale, "account")}</span>
            </Link>

            {isStaff ? (
              <Link
                href={`/${locale}/admin`}
                className="user-nav-dropdown-item"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{t(locale, "admin")}</span>
              </Link>
            ) : null}
          </div>

          <div className="user-nav-dropdown-divider" />

          {/* Logout */}
          <button
            type="button"
            className="user-nav-dropdown-item user-nav-dropdown-item--danger"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
            role="menuitem"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t(locale, "logout")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
