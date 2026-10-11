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
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b1224] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <ErrorState title={error} />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b1224] flex items-center justify-center p-6">
        <LoadingState label={t(locale, "loading")} />
      </div>
    );
  }

  const isAdminPlus = user.staff_role === "admin" || user.staff_role === "owner";

  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      label: t(locale, "dashboard"),
      match: (p: string) => p === `/${locale}/admin`,
      icon: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/quizzes`,
      label: t(locale, "adminQuizzes"),
      match: (p: string) => p.includes("/admin/quizzes"),
      icon: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b1224] text-slate-800 dark:text-slate-100 flex relative text-[13px]">
      {/* 1. Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 flex flex-col bg-white dark:bg-[#111a31] border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out ${
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BrandLogo locale={locale} />
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5">
          <nav aria-label="Admin Navigation">
            <ul className="space-y-1">
              {navItems
                .filter((item) => !item.adminPlus || isAdminPlus)
                .map((item) => {
                  const isActive = item.match(pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <span
                          className={`shrink-0 flex items-center justify-center w-5 h-5 ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {item.icon(isActive)}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>{t(locale, "backToSite")}</span>
          </Link>
        </div>
      </aside>

      {/* 2. Workspace: Topbar + Main Body */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        {/* Topbar Header */}
        <header className="sticky top-0 z-30 h-16 w-full bg-white/95 dark:bg-[#111a31]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              aria-label={t(locale, "menu")}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>

            {/* DashLite search bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-[#152038] border border-slate-200 dark:border-slate-800 text-slate-400 w-64 md:w-80 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
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
                className="bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Site Link */}
            <Link
              href={`/${locale}`}
              className="hidden sm:inline-flex p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t(locale, "backToSite")}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-[#111a31]" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle
              darkLabel={t(locale, "darkMode")}
              lightLabel={t(locale, "lightMode")}
            />

            {/* Language Switch */}
            <LanguageSwitch locale={locale} />

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 my-auto" />

            {/* Profile Menu */}
            <AdminProfileMenu
              user={user}
              locale={locale}
              onLogout={onLogout}
            />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-7 box-border">{children}</main>
      </div>

      {/* Mobile Backdrop */}
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs lg:hidden cursor-pointer"
          aria-label={t(locale, "cancel")}
          onClick={() => setNavOpen(false)}
        />
      ) : null}
    </div>
  );
}
