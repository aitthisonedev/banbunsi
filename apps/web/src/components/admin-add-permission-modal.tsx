"use client";

import { useEffect, useState } from "react";
import type { Locale, User } from "@/lib/api";
import {
  avatarSrc,
  clientListAdminMembers,
  clientPatchAdminMember,
  type AdminMember,
} from "@/lib/client-api";
import { t } from "@/lib/i18n";

function memberInitials(name: string, email: string): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export function AdminAddPermissionModal({
  locale,
  currentUser,
  isOpen,
  onClose,
  onSuccess,
}: {
  locale: Locale;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: AdminMember, role: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<"editor" | "admin" | "owner">(
    "editor",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentUser.staff_role === "owner";

  useEffect(() => {
    let active = true;
    clientListAdminMembers(searchQuery)
      .then((data) => {
        if (!active) return;
        setMembers(data.items);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t(locale, "loadError"));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchQuery, locale]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleGrant() {
    if (!selectedMember) return;
    setSubmitting(true);
    setError("");

    try {
      const updated = await clientPatchAdminMember(selectedMember.id, {
        staff_role: selectedRole,
      });
      onSuccess(updated, selectedRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Filter out self since one cannot change one's own role here
  const filteredMembers = members.filter((m) => m.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t(locale, "addBackendPermission")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(locale, "rolePromotionHelp")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            onClick={onClose}
            aria-label={t(locale, "close")}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {error ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 font-medium" role="alert">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Step 1: Member Search and Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2" htmlFor="perm-user-search">
              1. {t(locale, "searchMemberToAdd")}
            </label>
            <div className="relative flex items-center">
              <svg
                className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5l4 4" strokeLinecap="round" />
              </svg>
              <input
                id="perm-user-search"
                type="text"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                placeholder={t(locale, "searchUserPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="mt-2.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-4 text-center text-slate-400">
                  <span>{t(locale, "loading")}</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="p-4 text-center text-slate-400">
                  {t(locale, "noUsersFound")}
                </p>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedMember?.id === m.id;
                  const photo = avatarSrc(m.avatar_url);
                  const isCurrentStaff = m.staff_role !== "member";

                  return (
                    <button
                      type="button"
                      key={m.id}
                      className={`w-full flex items-center justify-between p-2.5 text-left transition cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/50"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                      onClick={() => setSelectedMember(m)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="uppercase">{memberInitials(m.name, m.email)}</span>
                          )}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {m.name || m.email}
                            </strong>
                            {isCurrentStaff ? (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                {m.staff_role}
                              </span>
                            ) : null}
                            {m.membership_tier === "vip" ? (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300">
                                VIP
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {m.email}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <svg
                            className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              2. {t(locale, "selectRole")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`relative flex flex-col gap-1 p-3 rounded-xl border transition cursor-pointer ${
                  selectedRole === "editor"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="staff_role"
                  value="editor"
                  checked={selectedRole === "editor"}
                  onChange={() => setSelectedRole("editor")}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-base">✏️</span>
                  <div>
                    <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                      {t(locale, "roleEditor")}
                    </strong>
                    <span className="text-[10px] text-slate-400">Editor</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  {t(locale, "roleEditorDesc")}
                </p>
              </label>

              <label
                className={`relative flex flex-col gap-1 p-3 rounded-xl border transition cursor-pointer ${
                  selectedRole === "admin"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="staff_role"
                  value="admin"
                  checked={selectedRole === "admin"}
                  onChange={() => setSelectedRole("admin")}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                      {t(locale, "roleAdmin")}
                    </strong>
                    <span className="text-[10px] text-slate-400">Admin</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                  {t(locale, "roleAdminDesc")}
                </p>
              </label>

              {isOwner ? (
                <label
                  className={`relative flex flex-col gap-1 p-3 rounded-xl border transition cursor-pointer ${
                    selectedRole === "owner"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="staff_role"
                    value="owner"
                    checked={selectedRole === "owner"}
                    onChange={() => setSelectedRole("owner")}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">👑</span>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900 dark:text-white">
                        {t(locale, "roleOwner")}
                      </strong>
                      <span className="text-[10px] text-slate-400">Owner</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    {t(locale, "roleOwnerDesc")}
                  </p>
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            onClick={onClose}
            disabled={submitting}
          >
            {t(locale, "cancel")}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            disabled={!selectedMember || submitting}
            onClick={handleGrant}
          >
            {submitting ? (
              <span>{t(locale, "loading")}</span>
            ) : (
              <>
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t(locale, "confirmGrant")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
