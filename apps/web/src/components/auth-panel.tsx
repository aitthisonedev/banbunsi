import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

export function AuthPanel({
  locale,
  title,
  lead,
  children,
  footer,
}: {
  locale: Locale;
  title: string;
  lead?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <aside className="auth-aside">
          <BrandLogo locale={locale} variant="dark" priority />
          <p className="auth-aside-lead">{t(locale, "authAsideLead")}</p>
          <Link href={`/${locale}`} className="auth-aside-home">
            {t(locale, "backHome")}
          </Link>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-brand auth-panel-brand--mobile">
            <BrandLogo locale={locale} variant="light" priority />
          </div>
          <h1 className="auth-panel-title">{title}</h1>
          {lead ? <p className="auth-panel-lead">{lead}</p> : null}
          <div className="auth-panel-body">{children}</div>
          {footer ? <div className="auth-panel-footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
