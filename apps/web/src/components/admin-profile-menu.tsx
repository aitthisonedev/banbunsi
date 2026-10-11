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
    <div className="admin-profile-menu" ref={menuRef}>
      <button
        type="button"
        className="admin-profile-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={displayName}
      >
        <span className="admin-profile-meta">
          <span className="admin-profile-name">{displayName}</span>
          <span className="admin-profile-role">{user.staff_role}</span>
        </span>
        <span className="admin-profile-avatar">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={40}
              height={40}
              className="admin-profile-avatar-img"
            />
          ) : (
            <span className="admin-profile-avatar-initials">{initials}</span>
          )}
        </span>
      </button>

      {open ? (
        <div className="admin-profile-dropdown" role="menu">
          <div className="admin-profile-dropdown-head">
            <span className="admin-profile-avatar admin-profile-avatar--lg">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  width={48}
                  height={48}
                  className="admin-profile-avatar-img"
                />
              ) : (
                <span className="admin-profile-avatar-initials">
                  {initials}
                </span>
              )}
            </span>
            <div>
              <p className="admin-profile-dropdown-name">{displayName}</p>
              <p className="admin-profile-dropdown-email">{user.email}</p>
              <span className="admin-role-pill">{user.staff_role}</span>
            </div>
          </div>
          <div className="admin-profile-dropdown-items">
            <Link
              href={`/${locale}/account`}
              className="admin-profile-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t(locale, "account")}
            </Link>
            <Link
              href={`/${locale}`}
              className="admin-profile-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t(locale, "backToSite")}
            </Link>
            <button
              type="button"
              className="admin-profile-item admin-profile-item--danger"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
            >
              {t(locale, "logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
