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
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal-container">
        <div className="admin-modal-header">
          <div className="admin-modal-title-group">
            <span className="admin-modal-icon">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
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
              <h2 className="admin-modal-title">
                {t(locale, "addBackendPermission")}
              </h2>
              <p className="admin-modal-subtitle">
                {t(locale, "rolePromotionHelp")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close"
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

        <div className="admin-modal-body">
          {error ? (
            <div className="admin-alert-error" role="alert">
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
          <div className="admin-modal-section">
            <label className="admin-field-label" htmlFor="perm-user-search">
              1. {t(locale, "searchMemberToAdd")}
            </label>
            <div className="admin-search-input-wrap">
              <svg
                className="admin-search-icon"
                viewBox="0 0 20 20"
                width="16"
                height="16"
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
                className="input admin-modal-input"
                placeholder={t(locale, "searchUserPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="admin-user-selector-list">
              {loading ? (
                <div className="admin-selector-loading">
                  <span className="spinner-dots">{t(locale, "loading")}</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="admin-selector-empty">
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
                      className={`admin-user-option${isSelected ? " is-selected" : ""}`}
                      onClick={() => setSelectedMember(m)}
                    >
                      <span className="admin-profile-avatar admin-profile-avatar--sm">
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt=""
                            width={32}
                            height={32}
                            className="admin-profile-avatar-img"
                          />
                        ) : (
                          <span className="admin-profile-avatar-initials">
                            {memberInitials(m.name, m.email)}
                          </span>
                        )}
                      </span>
                      <div className="admin-user-option-info">
                        <div className="admin-user-option-line">
                          <strong className="admin-user-option-name">
                            {m.name || m.email}
                          </strong>
                          {isCurrentStaff ? (
                            <span className="admin-badge-staff">
                              {m.staff_role}
                            </span>
                          ) : null}
                          {m.membership_tier === "vip" ? (
                            <span className="admin-badge-vip">VIP</span>
                          ) : null}
                        </div>
                        <span className="admin-user-option-email">
                          {m.email}
                        </span>
                      </div>
                      <div className="admin-user-option-check">
                        {isSelected ? (
                          <svg
                            viewBox="0 0 20 20"
                            width="18"
                            height="18"
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
          <div className="admin-modal-section">
            <label className="admin-field-label">
              2. {t(locale, "selectRole")}
            </label>
            <div className="admin-role-options-grid">
              <label
                className={`admin-role-option-card${
                  selectedRole === "editor" ? " is-active" : ""
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
                <div className="admin-role-card-head">
                  <span className="admin-role-icon admin-role-icon--editor">
                    ✏️
                  </span>
                  <div>
                    <strong className="admin-role-name">
                      {t(locale, "roleEditor")}
                    </strong>
                    <span className="admin-role-tag">Editor</span>
                  </div>
                </div>
                <p className="admin-role-desc">
                  {t(locale, "roleEditorDesc")}
                </p>
              </label>

              <label
                className={`admin-role-option-card${
                  selectedRole === "admin" ? " is-active" : ""
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
                <div className="admin-role-card-head">
                  <span className="admin-role-icon admin-role-icon--admin">
                    🛡️
                  </span>
                  <div>
                    <strong className="admin-role-name">
                      {t(locale, "roleAdmin")}
                    </strong>
                    <span className="admin-role-tag">Admin</span>
                  </div>
                </div>
                <p className="admin-role-desc">{t(locale, "roleAdminDesc")}</p>
              </label>

              {isOwner ? (
                <label
                  className={`admin-role-option-card${
                    selectedRole === "owner" ? " is-active" : ""
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
                  <div className="admin-role-card-head">
                    <span className="admin-role-icon admin-role-icon--owner">
                      👑
                    </span>
                    <div>
                      <strong className="admin-role-name">
                        {t(locale, "roleOwner")}
                      </strong>
                      <span className="admin-role-tag">Owner</span>
                    </div>
                  </div>
                  <p className="admin-role-desc">
                    {t(locale, "roleOwnerDesc")}
                  </p>
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t(locale, "cancel")}
          </button>
          <button
            type="button"
            className="btn-primary admin-modal-confirm-btn"
            disabled={!selectedMember || submitting}
            onClick={handleGrant}
          >
            {submitting ? (
              <span className="spinner-dots">{t(locale, "loading")}</span>
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
