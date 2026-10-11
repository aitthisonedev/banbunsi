"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale, User } from "@/lib/api";
import { AdminProfileMenu } from "@/components/admin-profile-menu";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingState, ErrorState } from "@/components/ui";
import { avatarSrc, clientLogout, clientMe } from "@/lib/client-api";
import { t } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  adminPlus?: boolean;
};

function initials(user: User): string {
  const first = (user.first_name || user.name || "?").trim().charAt(0);
  const last = (user.last_name || "").trim().charAt(0);
  return (first + last).toUpperCase() || "?";
}

export function AdminShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    clientMe()
      .then((u) => {
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setUser(u);
      })
      .catch(() => {
        setError(t(locale, "staffSignInRequired"));
        router.replace(`/${locale}/auth/login?next=/${locale}/admin`);
      });
  }, [locale, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  async function onLogout() {
    await clientLogout().catch(() => undefined);
    router.push(`/${locale}`);
    router.refresh();
  }

  if (error) {
    return (
      <div className="admin-shell">
        <div className="admin-main">
          <ErrorState title={error} />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="admin-shell">
        <div className="admin-main">
          <LoadingState label={t(locale, "loading")} />
        </div>
      </div>
    );
  }

  const isAdminPlus = user.staff_role === "admin" || user.staff_role === "owner";
  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: t(locale, "dashboard"),
      match: (p: string) => p === `/${locale}/admin`,
    },
    {
      href: `/${locale}/admin/documents`,
      label: t(locale, "adminDocuments"),
      match: (p: string) => p.includes("/admin/documents"),
    },
    {
      href: `/${locale}/admin/categories`,
      label: t(locale, "adminCategories"),
      match: (p: string) => p.includes("/admin/categories"),
    },
    {
      href: `/${locale}/admin/quizzes`,
      label: t(locale, "adminQuizzes"),
      match: (p: string) => p.includes("/admin/quizzes"),
    },
    {
      href: `/${locale}/admin/members`,
      label: t(locale, "adminMembers"),
      match: (p: string) => p.includes("/admin/members"),
      adminPlus: true,
    },
    {
      href: `/${locale}/admin/settings`,
      label: t(locale, "settings"),
      match: (p: string) => p.includes("/admin/settings"),
      adminPlus: true,
    },
  ];
  const nav = navItems.filter((item) => !item.adminPlus || isAdminPlus);
  const title =
    nav.find((item) => item.match(pathname))?.label || t(locale, "admin");
  const photo = avatarSrc(user.avatar_url);

  return (
    <div className={`admin-shell${navOpen ? " is-nav-open" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <BrandLogo locale={locale} />
          <p className="admin-sidebar-label">{t(locale, "admin")}</p>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link${item.match(pathname) ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-sidebar-user">
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
                <span className="admin-profile-avatar-initials">
                  {initials(user)}
                </span>
              )}
            </span>
            <p className="admin-user-meta">
              <strong>{user.name}</strong>
              <span>{user.staff_role}</span>
            </p>
          </div>
          <Link href={`/${locale}`} className="section-link">
            {t(locale, "backToSite")}
          </Link>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label={t(locale, "menu")}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="admin-topbar-title">
            <p className="admin-topbar-kicker">{t(locale, "admin")}</p>
            <h1>{title}</h1>
          </div>
          <div className="admin-topbar-actions">
            <AdminProfileMenu
              user={user}
              locale={locale}
              onLogout={onLogout}
            />
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>

      {navOpen ? (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label={t(locale, "cancel")}
          onClick={() => setNavOpen(false)}
        />
      ) : null}
    </div>
  );
}
