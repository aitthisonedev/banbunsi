"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale, User } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { Drawer } from "@/components/ui";
import { clientLogout, clientMe } from "@/lib/client-api";
import { t } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const homeHref = `/${locale}`;
  const categoriesHref = `/${locale}/categories`;
  const documentsHref = `/${locale}/documents`;
  const isHome = pathname === homeHref || pathname === `${homeHref}/`;
  const onCategories = pathname.startsWith(categoriesHref);
  const onDocuments = pathname.startsWith(documentsHref);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    clientMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  async function onLogout() {
    await clientLogout().catch(() => undefined);
    setUser(null);
    setMenuOpen(false);
    router.refresh();
  }

  const isStaff =
    user && ["editor", "admin", "owner"].includes(user.staff_role);

  const navLinks = (
    <>
      <Link
        href={homeHref}
        className={`nav-link${isHome ? " is-active" : ""}`}
        aria-current={isHome ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
      >
        {t(locale, "home")}
      </Link>
      <Link
        href={categoriesHref}
        className={`nav-link${onCategories ? " is-active" : ""}`}
        onClick={() => setMenuOpen(false)}
      >
        {t(locale, "knowledge")}
      </Link>
      <Link
        href={documentsHref}
        className={`nav-link${onDocuments ? " is-active" : ""}`}
        aria-current={onDocuments ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
      >
        {t(locale, "documents")}
      </Link>
      <span className="nav-link nav-link--muted">{t(locale, "quizzes")}</span>
    </>
  );

  const authActions =
    user === undefined ? null : user ? (
      <>
        {isStaff ? (
          <Link
            href={`/${locale}/admin`}
            className="btn-header-secondary"
            onClick={() => setMenuOpen(false)}
          >
            {t(locale, "admin")}
          </Link>
        ) : null}
        <button type="button" className="btn-header-primary" onClick={onLogout}>
          {t(locale, "logout")}
        </button>
      </>
    ) : (
      <>
        <Link
          href={`/${locale}/auth/login`}
          className="btn-header-secondary"
          onClick={() => setMenuOpen(false)}
        >
          {t(locale, "login")}
        </Link>
        <Link
          href={`/${locale}/auth/register`}
          className="btn-header-primary"
          onClick={() => setMenuOpen(false)}
        >
          {t(locale, "register")}
        </Link>
      </>
    );

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-left">
          <button
            type="button"
            className="menu-toggle icon-btn"
            aria-label={t(locale, "menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <BrandLogo locale={locale} priority />
          <nav className="site-nav" aria-label="Main">
            {navLinks}
          </nav>
        </div>

        <div className="site-header-right">
          <ThemeToggle
            darkLabel={t(locale, "darkMode")}
            lightLabel={t(locale, "lightMode")}
          />
          <LanguageSwitch locale={locale} />
          <div className="site-header-auth">{authActions}</div>
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t(locale, "menu")}
      >
        <nav className="drawer-nav" aria-label="Mobile">
          {navLinks}
          <div className="drawer-auth">{authActions}</div>
        </nav>
      </Drawer>
    </header>
  );
}
