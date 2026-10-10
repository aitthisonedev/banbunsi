import Image from "next/image";
import Link from "next/link";
import type { Locale, PublicSettings } from "@/lib/api";
import { whatsappLink } from "@/lib/api";
import { t } from "@/lib/i18n";
import logoDark from "../../public/brand/logo-dark.png";

function formatPhone(e164: string) {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("856") && digits.length >= 11) {
    const rest = digits.slice(3);
    return `+856 ${rest.slice(0, 2)} ${rest.slice(2, 4)} ${rest.slice(4, 7)} ${rest.slice(7)}`.trim();
  }
  return e164;
}

export function SiteFooter({
  locale,
  settings,
}: {
  locale: Locale;
  settings: PublicSettings;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="bb-content grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-4 md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link href={`/${locale}`} className="inline-block" aria-label="BAN BUNSI">
            <Image
              src={logoDark}
              alt="BAN BUNSI"
              className="h-12 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/85">
            {t(locale, "footerBlurb")}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-wide text-white">
            {t(locale, "knowledge")}
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            <li>
              <Link href={`/${locale}/documents`} className="hover:text-white">
                {t(locale, "documents")}
              </Link>
            </li>
            <li>
              <span className="opacity-70">{t(locale, "latestArticles")}</span>
            </li>
            <li>
              <Link href={`/${locale}/quizzes`} className="hover:text-white">
                {t(locale, "quizzes")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold tracking-wide">
            {t(locale, "usefulLinks")}
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            <li>
              <Link href={`/${locale}/about`} className="hover:text-white">
                {t(locale, "about")}
              </Link>
            </li>
            <li>
              <span className="opacity-70">{t(locale, "faq")}</span>
            </li>
            <li>
              <Link href={`/${locale}/vip`} className="hover:text-white">
                {t(locale, "vipBenefits")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h3 className="mb-4 text-sm font-bold tracking-wide">
            {t(locale, "contactUs")}
          </h3>
          <div className="footer-contact-row">
            <ul className="space-y-3 text-sm text-white/85">
              <li>
                <a
                  className="inline-flex items-center gap-2.5 hover:text-white"
                  href={`mailto:${settings.contact_email}`}
                >
                  <IconMail />
                  {settings.contact_email}
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2.5 hover:text-white"
                  href={whatsappLink(settings.whatsapp_number)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconPhone />
                  {formatPhone(settings.whatsapp_number)}
                </a>
              </li>
            </ul>
            <div className="footer-socials">
              <SocialLink href={settings.facebook_url} label="Facebook">
                <IconFacebook />
              </SocialLink>
              <SocialLink href={settings.tiktok_url} label="TikTok">
                <IconTikTok />
              </SocialLink>
              <SocialLink
                href={whatsappLink(settings.whatsapp_number)}
                label="WhatsApp"
              >
                <IconWhatsApp />
              </SocialLink>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="bb-content flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-white/75">
          <p>
            © {year} BAN BUNSI. {t(locale, "allRights")}
          </p>
          <Link href={`/${locale}/privacy`} className="hover:text-white">
            {t(locale, "privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/70 text-white transition hover:bg-white/10"
    >
      {children}
    </a>
  );
}

function IconMail() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7.5l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        d="M7.5 4.5h3l1.5 4-2 1.2a10 10 0 0 0 4.3 4.3l1.2-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 6 6.1a1.5 1.5 0 0 1 1.5-1.6z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8.1h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6H16.8V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.6 8.3a5.7 5.7 0 0 1-3.4-1.1v6.5a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.7a2.8 2.8 0 1 0 2 2.7V2.5h2.6a5.7 5.7 0 0 0 3.4 3.3v2.5z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.78 14.08c-.24.68-1.42 1.25-1.96 1.33-.5.08-1.14.11-1.84-.12-.42-.13-.97-.32-1.67-.62-2.93-1.27-4.84-4.23-4.98-4.43-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07 1-2.35.24-.26.53-.33.71-.33h.51c.16 0 .38-.06.59.45.22.54.74 1.87.8 2 .07.13.11.29.02.46l-.36.6c-.1.17-.2.24-.35.41-.14.14-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.32 2.36 1.47.29.14.46.12.63-.07l.72-.85c.15-.18.34-.21.56-.12l1.67.79c.2.09.33.14.38.22.05.08.05.45-.19 1.13z" />
    </svg>
  );
}
