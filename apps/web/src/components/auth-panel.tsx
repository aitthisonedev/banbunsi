import { BrandLogo } from "@/components/brand-logo";
import type { Locale } from "@/lib/api";

export function AuthPanel({
  locale,
  title,
  children,
  footer,
}: {
  locale: Locale;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel-brand">
          <BrandLogo locale={locale} />
        </div>
        <h1 className="auth-panel-title">{title}</h1>
        <div className="auth-panel-body">{children}</div>
        {footer ? <div className="auth-panel-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
