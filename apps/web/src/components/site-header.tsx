"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { t } from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const homeHref = `/${locale}`;
  const categoriesHref = `/${locale}/categories`;
  const documentsHref = `/${locale}/documents`;
  const isHome = pathname === homeHref || pathname === `${homeHref}/`;
  const onCategories = pathname.startsWith(categoriesHref);
  const onDocuments = pathname.startsWith(documentsHref);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-header-left">
          <BrandLogo locale={locale} priority />
          <nav className="site-nav" aria-label="Main">
            <Link
              href={homeHref}
              className={`nav-link${isHome ? " is-active" : ""}`}
              aria-current={isHome ? "page" : undefined}
            >
              {t(locale, "home")}
            </Link>
            <Link
              href={categoriesHref}
              className={`nav-link${onCategories ? " is-active" : ""}`}
            >
              {t(locale, "knowledge")}
            </Link>
            <Link
              href={documentsHref}
              className={`nav-link${onDocuments ? " is-active" : ""}`}
              aria-current={onDocuments ? "page" : undefined}
            >
              {t(locale, "documents")}
            </Link>
            <span className="nav-link nav-link--muted">{t(locale, "quizzes")}</span>
          </nav>
        </div>

        <div className="site-header-right">
          <ThemeToggle
            darkLabel={t(locale, "darkMode")}
            lightLabel={t(locale, "lightMode")}
          />
          <LanguageSwitch locale={locale} />
          <Link href={`/${locale}/auth/login`} className="btn-header-secondary">
            {t(locale, "login")}
          </Link>
          <Link href={`/${locale}/auth/register`} className="btn-header-primary">
            {t(locale, "register")}
          </Link>
        </div>
      </div>
    </header>
  );
}
