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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={displayName}
      >
        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={34}
              height={34}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="uppercase">{initials}</span>
          )}
        </span>

        <span className="flex flex-col text-left leading-tight">
          <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
            {user.staff_role === "owner"
              ? "Owner"
              : user.staff_role === "admin"
                ? "Admin"
                : "Editor"}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
              {displayName}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
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
          </span>
        </span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-[#152038] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1"
          role="menu"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="uppercase">{initials}</span>
              )}
            </span>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <strong className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    user.staff_role === "owner"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : user.staff_role === "admin"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  }`}
                >
                  {user.staff_role}
                </span>
                {user.membership_tier === "vip" ? (
                  <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300">
                    VIP
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href={`/${locale}/account`}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left"
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
