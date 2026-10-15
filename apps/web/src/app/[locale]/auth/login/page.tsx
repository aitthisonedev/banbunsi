import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { LoginForm } from "./login-form";
import type { Metadata } from "next";
import { isLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/auth/login", t(locale, "login"), t(locale, "loginLead"), { noindex: true });
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <LoadingState label="…" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
