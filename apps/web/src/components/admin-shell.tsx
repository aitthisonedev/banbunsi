"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale, User } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { LoadingState, ErrorState } from "@/components/ui";
import { clientLogout, clientMe } from "@/lib/client-api";
import { t } from "@/lib/i18n";

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

  async function onLogout() {
    await clientLogout().catch(() => undefined);
    router.push(`/${locale}`);
    router.refresh();
  }

  if (error) {
    return (
      <div className="admin-shell">
        <ErrorState title={error} />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="admin-shell">
        <LoadingState label={t(locale, "loading")} />
      </div>
    );
  }

  const isAdminPlus = user.staff_role === "admin" || user.staff_role === "owner";
  const nav = [
    { href: `/${locale}/admin`, label: t(locale, "dashboard"), match: (p: string) => p === `/${locale}/admin` },
    {
      href: `/${locale}/admin/documents`,
      label: t(locale, "adminDocuments"),
      match: (p: string) => p.includes("/admin/documents"),
    },
    ...(isAdminPlus
      ? [
          {
            href: `/${locale}/admin/settings`,
            label: t(locale, "settings"),
            match: (p: string) => p.includes("/admin/settings"),
          },
        ]
      : []),
  ];

  return (
    <div className="admin-shell">
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
          <p className="text-sm text-bb-text-muted">
            {user.name}
            <br />
            {user.staff_role}
          </p>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={onLogout}>
            {t(locale, "logout")}
          </button>
          <Link href={`/${locale}`} className="section-link mt-3 inline-block">
            {t(locale, "backToSite")}
          </Link>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
