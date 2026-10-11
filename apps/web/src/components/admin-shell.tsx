"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale, User } from "@/lib/api";
import { AdminProfileMenu } from "@/components/admin-profile-menu";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingState, ErrorState } from "@/components/ui";
import { clientLogout, clientMe } from "@/lib/client-api";
import { t } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match: (p: string) => boolean;
  adminPlus?: boolean;
};

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
  const [searchFilter, setSearchFilter] = useState("");

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

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setNavOpen(false);
  }

  async function onLogout() {
    await clientLogout().catch(() => undefined);
    router.push(`/${locale}`);
    router.refresh();
  }

  if (error) {
    return (
      <div className="dash-shell">
        <div className="dash-workspace">
          <ErrorState title={error} />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="dash-shell">
        <div className="dash-workspace">
          <LoadingState label={t(locale, "loading")} />
        </div>
      </div>
    );
  }

  const isAdminPlus =
    user.staff_role === "admin" || user.staff_role === "owner";

  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: t(locale, "dashboard"),
      match: (p: string) => p === `/${locale}/admin`,
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/documents`,
      label: t(locale, "adminDocuments"),
      match: (p: string) => p.includes("/admin/documents"),
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/categories`,
      label: t(locale, "adminCategories"),
      match: (p: string) => p.includes("/admin/categories"),
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/quizzes`,
      label: t(locale, "adminQuizzes"),
      match: (p: string) => p.includes("/admin/quizzes"),
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/members`,
      label: t(locale, "adminMembers"),
      match: (p: string) => p.includes("/admin/members"),
      adminPlus: true,
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/settings`,
      label: t(locale, "settings"),
      match: (p: string) => p.includes("/admin/settings"),
      adminPlus: true,
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`dash-shell${navOpen ? " is-nav-open" : ""}`}>
      {/* 1. Left Sidebar (DashLite Clean Light Aesthetic) */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-brand">
            <BrandLogo locale={locale} className="dash-brand-logo" />
          </div>
          <button
            type="button"
            className="dash-sidebar-close"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
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

        <div className="dash-sidebar-body">
          <nav className="dash-nav" aria-label="Admin Navigation">
            <ul className="dash-nav-list">
              {navItems
                .filter((item) => !item.adminPlus || isAdminPlus)
                .map((item) => {
                  const isActive = item.match(pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`dash-nav-link${isActive ? " is-active" : ""}`}
                      >
                        <span className="dash-nav-icon">
                          {item.icon(isActive)}
                        </span>
                        <span className="dash-nav-text">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </div>

        <div className="dash-sidebar-footer">
          <Link href={`/${locale}`} className="dash-sidebar-site-link">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>{t(locale, "backToSite")}</span>
          </Link>
        </div>
      </aside>

      {/* 2. Workspace: Topbar + Main Body */}
      <div className="dash-workspace">
        {/* Topbar Header */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-menu-toggle"
              aria-label={t(locale, "menu")}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            {/* DashLite search bar */}
            <div className="dash-topbar-search">
              <svg
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
                type="text"
                placeholder={
                  locale === "lo"
                    ? "ຄົ້ນຫາເອກະສານ, ຂໍ້ມູນ..."
                    : "Search files, folders, members..."
                }
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-topbar-right">
            {/* Quick Site Link */}
            <Link
              href={`/${locale}`}
              className="dash-icon-btn hidden sm:inline-flex"
              title={t(locale, "backToSite")}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            {/* Notification Bell (DashLite aesthetic) */}
            <button
              type="button"
              className="dash-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="dash-bell-dot" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle
              darkLabel={t(locale, "darkMode")}
              lightLabel={t(locale, "lightMode")}
            />

            {/* Language Switch */}
            <LanguageSwitch locale={locale} />

            <div className="dash-topbar-divider" />

            {/* DashLite Profile Menu (Right side) */}
            <AdminProfileMenu user={user} locale={locale} onLogout={onLogout} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="dash-main">{children}</main>
      </div>

      {/* Mobile Backdrop */}
      {navOpen ? (
        <button
          type="button"
          className="dash-backdrop"
          aria-label={t(locale, "cancel")}
          onClick={() => setNavOpen(false)}
        />
      ) : null}
    </div>
  );
}
