"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/api";
import {
  avatarSrc,
  clientChangePassword,
  clientDeleteAvatar,
  clientMe,
  clientUpdateProfile,
  clientUploadAvatar,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";
import { EmptyState, FormField, LoadingState, SuccessBanner } from "@/components/ui";

type TabId =
  | "profile"
  | "security"
  | "login"
  | "membership"
  | "favorites"
  | "downloads"
  | "quizzes";

function getInitials(user: User) {
  const a = (user.first_name || user.name || "?").trim().charAt(0);
  const b = (user.last_name || "").trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

function tierLabel(locale: "lo" | "en", tier: User["membership_tier"]) {
  if (tier === "vip") return t(locale, "badgeVip");
  return t(locale, "badgeMember");
}

export function AccountHub() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabId>("profile");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    clientMe()
      .then((u) => {
        setUser(u);
        setFirstName(u.first_name || "");
        setLastName(u.last_name || "");
        setPhone(u.phone || "");
      })
      .catch(() => {
        router.replace(
          `/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/account`)}`,
        );
      });
  }, [locale, router]);

  const tabs = useMemo(
    () =>
      [
        {
          id: "profile" as const,
          label: t(locale, "profileTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ),
        },
        {
          id: "security" as const,
          label: t(locale, "securityTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
        },
        {
          id: "login" as const,
          label: t(locale, "loginMethodsTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m21 2-2 2m-2-2 2 2m-4.5 9a6.5 6.5 0 1 1-9-9 6.5 6.5 0 0 1 9 9Zm0 0L20 18l2 2" />
            </svg>
          ),
        },
        {
          id: "membership" as const,
          label: t(locale, "membershipTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
            </svg>
          ),
        },
        {
          id: "favorites" as const,
          label: t(locale, "favoritesTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          ),
        },
        {
          id: "downloads" as const,
          label: t(locale, "downloadsTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          ),
        },
        {
          id: "quizzes" as const,
          label: t(locale, "quizHistoryTab"),
          icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          ),
        },
      ] as const,
    [locale],
  );

  if (!user) {
    return (
      <div className="account-shell">
        <div className="account-inner bb-content">
          <LoadingState label={t(locale, "loading")} />
        </div>
      </div>
    );
  }

  const photo = avatarSrc(user.avatar_url);
  const initials = getInitials(user);
  const isVip = user.membership_tier === "vip";
  const displayName =
    user.name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await clientUpdateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      setUser(next);
      setMessage(t(locale, "profileSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await clientUploadAvatar(file);
      setUser(next);
      setMessage(t(locale, "profileSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusy(false);
    }
  }

  async function onRemoveAvatar() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await clientDeleteAvatar();
      setUser(next);
      setMessage(t(locale, "profileSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const current = String(fd.get("current") || "");
    const nextPw = String(fd.get("next") || "");
    const confirm = String(fd.get("confirm") || "");
    setError("");
    setMessage("");
    if (nextPw !== confirm) {
      setError(t(locale, "passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await clientChangePassword(current, nextPw);
      setMessage(t(locale, "passwordChanged"));
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-shell">
      <div className="account-inner bb-content">
        {/* Modern Profile Header Card */}
        <header className="account-hero-card">
          <div className="account-hero-profile">
            <div className="account-avatar-wrapper">
              <div className="account-avatar-main" aria-hidden>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    width={84}
                    height={84}
                    className="account-avatar-main-img"
                  />
                ) : (
                  <span className="account-avatar-main-initials">{initials}</span>
                )}
              </div>
            </div>

            <div className="account-hero-details">
              <div className="account-hero-title-row">
                <h1 className="account-hero-name">{displayName}</h1>
                <span className={`account-badge ${isVip ? "account-badge--vip" : "account-badge--member"}`}>
                  {isVip ? `👑 ${t(locale, "badgeVip")}` : t(locale, "badgeMember")}
                </span>
              </div>
              <p className="account-hero-desc">{t(locale, "accountLead")}</p>
              <div className="account-hero-meta-row">
                <span className="account-hero-email">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {user.email}
                </span>
                {user.email_verified ? (
                  <span className="account-verified-pill is-verified">
                    <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t(locale, "verified")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {!isVip ? (
            <div className="account-hero-upgrade">
              <Link href={`/${locale}/vip`} className="account-upgrade-btn">
                <span>👑 {t(locale, "vipBenefits")}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </header>

        {/* Account layout: Tabs + Panel */}
        <div className="account-layout">
          {/* Sidebar Tabs */}
          <nav className="account-tabs-card" aria-label={t(locale, "account")}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`account-tab-btn ${tab === item.id ? "is-active" : ""}`}
                onClick={() => {
                  setTab(item.id);
                  setError("");
                  setMessage("");
                }}
              >
                <span className="account-tab-icon">{item.icon}</span>
                <span className="account-tab-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Tab Content Panel */}
          <main className="account-panel-card">
            {message ? (
              <div className="account-alert-box">
                <SuccessBanner>{message}</SuccessBanner>
              </div>
            ) : null}
            {error ? (
              <div className="account-alert-box">
                <p className="form-field-error">{error}</p>
              </div>
            ) : null}

            {/* Tab: Profile */}
            {tab === "profile" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "profileTab")}</h2>
                  <p className="account-pane-desc">{t(locale, "accountLead")}</p>
                </div>

                <form className="account-form" onSubmit={onSaveProfile}>
                  {/* Photo section */}
                  <div className="account-photo-card">
                    <div className="account-photo-preview" aria-hidden>
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo}
                          alt=""
                          width={68}
                          height={68}
                          className="account-photo-preview-img"
                        />
                      ) : (
                        <span className="account-avatar-main-initials">{initials}</span>
                      )}
                    </div>
                    <div className="account-photo-controls">
                      <div className="account-photo-btns">
                        <label className="btn-secondary account-file-btn">
                          {t(locale, "changePhoto")}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            disabled={busy}
                            onChange={(ev) => {
                              const f = ev.target.files?.[0] || null;
                              void onAvatarChange(f);
                              ev.target.value = "";
                            }}
                          />
                        </label>
                        {user.avatar_url ? (
                          <button
                            type="button"
                            className="btn-secondary text-red-600 hover:text-red-700 dark:text-red-400"
                            disabled={busy}
                            onClick={() => void onRemoveAvatar()}
                          >
                            {t(locale, "removePhoto")}
                          </button>
                        ) : null}
                      </div>
                      <p className="account-field-hint">{t(locale, "avatarHint")}</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="account-fields-grid">
                    <FormField label={t(locale, "firstName")} htmlFor="first-name">
                      <input
                        id="first-name"
                        className="input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name"
                      />
                    </FormField>
                    <FormField label={t(locale, "lastName")} htmlFor="last-name">
                      <input
                        id="last-name"
                        className="input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                      />
                    </FormField>
                  </div>

                  <FormField label={t(locale, "phone")} htmlFor="phone">
                    <input
                      id="phone"
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="+856 20…"
                    />
                  </FormField>

                  <FormField label={t(locale, "email")} htmlFor="email-ro">
                    <input
                      id="email-ro"
                      className="input"
                      value={user.email}
                      readOnly
                      disabled
                    />
                  </FormField>

                  <div className="account-form-actions">
                    <button className="btn-primary account-submit-btn" type="submit" disabled={busy}>
                      {busy ? t(locale, "loading") : t(locale, "save")}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {/* Tab: Security */}
            {tab === "security" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "securityTab")}</h2>
                  <p className="account-pane-desc">
                    {locale === "lo"
                      ? "ປ່ຽນລະຫັດຜ່ານເພື່ອຮັກສາຄວາມປອດໄພຂອງບັນຊີທ່ານ."
                      : "Update your password to keep your account safe and secure."}
                  </p>
                </div>

                <form className="account-form" onSubmit={onChangePassword}>
                  <FormField label={t(locale, "currentPassword")} htmlFor="pw-current">
                    <input
                      id="pw-current"
                      className="input"
                      name="current"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </FormField>
                  <FormField label={t(locale, "newPassword")} htmlFor="pw-next">
                    <input
                      id="pw-next"
                      className="input"
                      name="next"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder={locale === "lo" ? "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ" : "At least 8 characters"}
                    />
                  </FormField>
                  <FormField label={t(locale, "confirmPassword")} htmlFor="pw-confirm">
                    <input
                      id="pw-confirm"
                      className="input"
                      name="confirm"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </FormField>
                  <div className="account-form-actions">
                    <button className="btn-primary account-submit-btn" type="submit" disabled={busy}>
                      {busy ? t(locale, "loading") : t(locale, "changePassword")}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {/* Tab: Login methods */}
            {tab === "login" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "loginMethodsTab")}</h2>
                  <p className="account-pane-desc">
                    {locale === "lo"
                      ? "ວິທີການຢືນຢັນຕົວຕົນທີ່ເຊື່ອມຕໍ່ກັບບັນຊີຂອງທ່ານ."
                      : "Authentication methods and third-party logins connected to your account."}
                  </p>
                </div>

                <div className="account-methods-list">
                  <div className="account-method-card">
                    <div className="account-method-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="account-method-info">
                      <span className="account-method-name">{t(locale, "email")}</span>
                      <span className="account-method-value">{user.email}</span>
                    </div>
                    <span className="account-method-badge is-connected">
                      ✓ {t(locale, "connected")}
                    </span>
                  </div>

                  <div className="account-method-card">
                    <div className="account-method-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="account-method-info">
                      <span className="account-method-name">{t(locale, "phone")}</span>
                      <span className="account-method-value">{user.phone || "—"}</span>
                    </div>
                    <span className="account-method-badge is-coming">
                      {t(locale, "comingSoon")}
                    </span>
                  </div>

                  <div className="account-method-card">
                    <div className="account-method-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                    </div>
                    <div className="account-method-info">
                      <span className="account-method-name">Google</span>
                      <span className="account-method-value">{locale === "lo" ? "ເຂົ້າສູ່ລະບົບດ້ວຍ Google" : "Sign in with Google"}</span>
                    </div>
                    <span className="account-method-badge is-coming">
                      {t(locale, "comingSoon")}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Tab: Membership */}
            {tab === "membership" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "membershipTab")}</h2>
                  <p className="account-pane-desc">
                    {locale === "lo"
                      ? "ຂໍ້ມູນສິດທິປະໂຫຍດ ແລະ ສະຖານະສະມາຊິກຂອງທ່ານ."
                      : "Your membership benefits, expiration date, and privileges."}
                  </p>
                </div>

                <div className="account-membership-card">
                  <div className="account-membership-status-row">
                    <div>
                      <span className="account-membership-label">{t(locale, "membershipLevel")}</span>
                      <div className="account-membership-level">
                        {isVip ? "👑 VIP Member" : "Standard Member"}
                      </div>
                    </div>
                    <span className={`account-badge ${isVip ? "account-badge--vip" : "account-badge--member"}`}>
                      {tierLabel(locale, user.membership_tier)}
                    </span>
                  </div>

                  <div className="account-membership-grid">
                    <div className="account-membership-item">
                      <span className="account-membership-item-label">{t(locale, "status")}</span>
                      <span className="account-membership-item-val">{user.account_status}</span>
                    </div>
                    <div className="account-membership-item">
                      <span className="account-membership-item-label">{t(locale, "membershipExpires")}</span>
                      <span className="account-membership-item-val">
                        {user.membership_ends_at
                          ? new Date(user.membership_ends_at).toLocaleDateString(
                              locale === "lo" ? "lo-LA" : "en-GB",
                            )
                          : t(locale, "noExpiry")}
                      </span>
                    </div>
                  </div>

                  {!isVip ? (
                    <div className="account-membership-promo">
                      <div className="account-membership-promo-text">
                        <h3>👑 {t(locale, "vipBenefits")}</h3>
                        <p>
                          {locale === "lo"
                            ? "ອັບເກຣດເປັນສະມາຊິກ VIP ເພື່ອດາວໂຫຼດໄຟລ໌ແບບຟອມຕົ້ນສະບັບຄົບຊຸດ, ເຂົ້າເຖິງເອກະສານພິເສດ ແລະ ອ່ານກົດໝາຍສະບັບເຕັມ."
                            : "Upgrade to VIP membership to download original files, access exclusive content, and unlock full accounting resources."}
                        </p>
                      </div>
                      <Link href={`/${locale}/vip`} className="btn-primary">
                        {t(locale, "vipBenefits")} →
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Tab: Favorites */}
            {tab === "favorites" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "favoritesTab")}</h2>
                </div>
                <EmptyState
                  title={t(locale, "emptyFavorites")}
                  description={t(locale, "stubHint")}
                />
              </div>
            ) : null}

            {/* Tab: Downloads */}
            {tab === "downloads" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "downloadsTab")}</h2>
                </div>
                <EmptyState
                  title={t(locale, "emptyDownloads")}
                  description={t(locale, "stubHint")}
                />
              </div>
            ) : null}

            {/* Tab: Quizzes */}
            {tab === "quizzes" ? (
              <div className="account-tab-pane">
                <div className="account-pane-head">
                  <h2 className="account-pane-title">{t(locale, "quizHistoryTab")}</h2>
                </div>
                <EmptyState
                  title={t(locale, "emptyQuizHistory")}
                  description={t(locale, "stubHint")}
                />
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
