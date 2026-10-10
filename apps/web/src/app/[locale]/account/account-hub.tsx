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

function initials(user: User) {
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
        { id: "profile" as const, label: t(locale, "profileTab") },
        { id: "security" as const, label: t(locale, "securityTab") },
        { id: "login" as const, label: t(locale, "loginMethodsTab") },
        { id: "membership" as const, label: t(locale, "membershipTab") },
        { id: "favorites" as const, label: t(locale, "favoritesTab") },
        { id: "downloads" as const, label: t(locale, "downloadsTab") },
        { id: "quizzes" as const, label: t(locale, "quizHistoryTab") },
      ] as const,
    [locale],
  );

  if (!user) {
    return (
      <div className="account-shell">
        <LoadingState label={t(locale, "loading")} />
      </div>
    );
  }

  const photo = avatarSrc(user.avatar_url);

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
        <header className="account-hero">
          <div className="account-avatar" aria-hidden>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" width={88} height={88} className="account-avatar-img" />
            ) : (
              <span className="account-avatar-fallback">{initials(user)}</span>
            )}
          </div>
          <div className="account-hero-text">
            <h1 className="account-title">{user.name || t(locale, "account")}</h1>
            <p className="account-lead">{t(locale, "accountLead")}</p>
            <p className="account-meta">
              <span className={`account-badge account-badge--${user.membership_tier}`}>
                {tierLabel(locale, user.membership_tier)}
              </span>
              <span className="account-email">{user.email}</span>
            </p>
          </div>
        </header>

        <div className="account-layout">
          <nav className="account-tabs" aria-label={t(locale, "account")}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`account-tab${tab === item.id ? " is-active" : ""}`}
                onClick={() => {
                  setTab(item.id);
                  setError("");
                  setMessage("");
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <section className="account-panel">
            {message ? <SuccessBanner>{message}</SuccessBanner> : null}
            {error ? <p className="form-field-error">{error}</p> : null}

            {tab === "profile" ? (
              <form className="account-form" onSubmit={onSaveProfile}>
                <div className="account-photo-row">
                  <div className="account-avatar account-avatar--sm" aria-hidden>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" width={64} height={64} className="account-avatar-img" />
                    ) : (
                      <span className="account-avatar-fallback">{initials(user)}</span>
                    )}
                  </div>
                  <div className="account-photo-actions">
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
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => void onRemoveAvatar()}
                      >
                        {t(locale, "removePhoto")}
                      </button>
                    ) : null}
                    <p className="form-field-hint">{t(locale, "avatarHint")}</p>
                  </div>
                </div>

                <div className="account-grid">
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
                    placeholder="+85620…"
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
                <button className="btn-primary" type="submit" disabled={busy}>
                  {busy ? t(locale, "loading") : t(locale, "save")}
                </button>
              </form>
            ) : null}

            {tab === "security" ? (
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
                <button className="btn-primary" type="submit" disabled={busy}>
                  {busy ? t(locale, "loading") : t(locale, "changePassword")}
                </button>
              </form>
            ) : null}

            {tab === "login" ? (
              <ul className="account-methods">
                <li>
                  <span>{t(locale, "email")}</span>
                  <span className="account-method-status is-on">
                    {t(locale, "connected")}
                    {user.email_verified ? ` · ${t(locale, "verified")}` : ` · ${t(locale, "unverified")}`}
                  </span>
                </li>
                <li>
                  <span>{t(locale, "phone")}</span>
                  <span className="account-method-status">{t(locale, "comingSoon")}</span>
                </li>
                <li>
                  <span>Google</span>
                  <span className="account-method-status">{t(locale, "comingSoon")}</span>
                </li>
              </ul>
            ) : null}

            {tab === "membership" ? (
              <dl className="account-dl">
                <div>
                  <dt>{t(locale, "membershipLevel")}</dt>
                  <dd>{tierLabel(locale, user.membership_tier)}</dd>
                </div>
                <div>
                  <dt>{t(locale, "status")}</dt>
                  <dd>{user.account_status}</dd>
                </div>
                <div>
                  <dt>{t(locale, "membershipExpires")}</dt>
                  <dd>
                    {user.membership_ends_at
                      ? new Date(user.membership_ends_at).toLocaleDateString(
                          locale === "lo" ? "lo-LA" : "en-GB",
                        )
                      : t(locale, "noExpiry")}
                  </dd>
                </div>
                {user.membership_tier !== "vip" ? (
                  <div>
                    <dd>
                      <Link href={`/${locale}/vip`} className="section-link">
                        {t(locale, "vipBenefits")}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {tab === "favorites" ? (
              <EmptyState
                title={t(locale, "emptyFavorites")}
                description={t(locale, "stubHint")}
              />
            ) : null}
            {tab === "downloads" ? (
              <EmptyState
                title={t(locale, "emptyDownloads")}
                description={t(locale, "stubHint")}
              />
            ) : null}
            {tab === "quizzes" ? (
              <EmptyState
                title={t(locale, "emptyQuizHistory")}
                description={t(locale, "stubHint")}
              />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
