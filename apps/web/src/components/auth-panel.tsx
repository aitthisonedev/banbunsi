import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function DocumentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

export function AuthPanel({
  locale,
  title,
  lead,
  children,
  footer,
  activeTab,
}: {
  locale: Locale;
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  activeTab?: "login" | "register";
}) {
  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <aside className="auth-aside">
          <div className="auth-aside-glow auth-aside-glow-1" aria-hidden="true" />
          <div className="auth-aside-glow auth-aside-glow-2" aria-hidden="true" />

          <div className="auth-aside-top">
            <div className="auth-aside-brand-row">
              <BrandLogo locale={locale} variant="dark" priority />
              <span className="auth-aside-badge">
                <SparkleIcon />
                <span>{t(locale, "trustBadge")}</span>
              </span>
            </div>

            <div className="auth-aside-header">
              <h2 className="auth-aside-title">BAN BUNSI</h2>
              <p className="auth-aside-lead">{t(locale, "headline")}</p>
            </div>

            <div className="auth-aside-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrap">
                  <DocumentIcon />
                </div>
                <div className="auth-feature-content">
                  <h3 className="auth-feature-title">{t(locale, "feature1Title")}</h3>
                  <p className="auth-feature-desc">{t(locale, "feature1Desc")}</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrap">
                  <DownloadIcon />
                </div>
                <div className="auth-feature-content">
                  <h3 className="auth-feature-title">{t(locale, "feature2Title")}</h3>
                  <p className="auth-feature-desc">{t(locale, "feature2Desc")}</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-wrap">
                  <ShieldIcon />
                </div>
                <div className="auth-feature-content">
                  <h3 className="auth-feature-title">{t(locale, "feature3Title")}</h3>
                  <p className="auth-feature-desc">{t(locale, "feature3Desc")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-aside-bottom">
            <div className="auth-trust-card">
              <div className="auth-trust-stars" aria-label="5 stars rating">
                ★★★★★
              </div>
              <p className="auth-trust-text">{t(locale, "trustMembers")}</p>
            </div>

            <Link href={`/${locale}`} className="auth-aside-home">
              <ArrowLeftIcon />
              <span>{t(locale, "backHome")}</span>
            </Link>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-mobile-header">
            <BrandLogo locale={locale} variant="auto" priority />
            <Link
              href={`/${locale}`}
              className="auth-mobile-home-btn"
              aria-label={t(locale, "backHome")}
            >
              <ArrowLeftIcon />
            </Link>
          </div>

          {activeTab ? (
            <div className="auth-nav-tabs" role="tablist">
              <Link
                href={`/${locale}/auth/login`}
                className={`auth-nav-tab ${activeTab === "login" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "login"}
              >
                <UserIcon />
                <span>{t(locale, "login")}</span>
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className={`auth-nav-tab ${activeTab === "register" ? "is-active" : ""}`}
                role="tab"
                aria-selected={activeTab === "register"}
              >
                <UserPlusIcon />
                <span>{t(locale, "register")}</span>
              </Link>
            </div>
          ) : null}

          <div className="auth-panel-heading">
            <h1 className="auth-panel-title">{title}</h1>
            {lead ? <p className="auth-panel-lead">{lead}</p> : null}
          </div>

          <div className="auth-panel-body">{children}</div>

          {footer ? <div className="auth-panel-footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
