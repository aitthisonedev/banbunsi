import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const { items } = await getCategories(raw).catch(() => ({ items: [] }));
  const preview = items.slice(0, 6);
  const tax = items.find((c) => c.code === "tax");

  return (
    <div className="page-home">
      <div className="hero-stack">
        <section className="hero">
          <div className="hero-media" aria-hidden>
            {/* Replace file at: apps/web/public/images/hero-default.jpeg */}
            <Image
              src="/images/hero-default.jpeg"
              alt=""
              fill
              priority
              unoptimized
              className="object-cover"
              sizes="100vw"
            />
            <div className="hero-overlay" />
          </div>

          <div className="hero-inner">
            <form
              className="hero-search"
              action={`/${raw}/search`}
              method="get"
              role="search"
            >
              <label className="sr-only" htmlFor="q">
                {t(raw, "search")}
              </label>
              <input
                id="q"
                name="q"
                placeholder={t(raw, "searchPlaceholder")}
              />
              <button type="submit" aria-label={t(raw, "search")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            <div className="hero-copy">
              <h1>{t(raw, "headline")}</h1>
              <p className="hero-lead">{t(raw, "subhead")}</p>
            </div>
          </div>

          <div className="feature-bridge">
            <div className="feature-grid">
              <Link href={`/${raw}/categories`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 4v10" />
                    <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 18h14" strokeLinecap="round" />
                  </svg>
                </span>
                <span>{t(raw, "featureForms")}</span>
              </Link>
              <Link
                href={tax ? `/${raw}/categories/${tax.slug}` : `/${raw}/categories`}
                className="feature-card"
              >
                <span className="feature-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3v4M16 3v4M8 12h.01M12 12h.01M16 12h.01" strokeLinecap="round" />
                  </svg>
                </span>
                <span>{t(raw, "featureCalendar")}</span>
              </Link>
              <Link href={`/${raw}/categories`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 4h9l3 3v13H6z" />
                    <path d="M9 12h6M9 16h6" strokeLinecap="round" />
                  </svg>
                </span>
                <span>{t(raw, "featureGuides")}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="band-after-hero">
        <div className="mx-auto max-w-[1200px] px-4 md:px-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="section-title">{t(raw, "latestDocuments")}</h2>
            <Link href={`/${raw}/categories`} className="section-link">
              {t(raw, "viewAllCategories")}
            </Link>
          </div>
          <div className="surface-panel">
            <p className="text-muted">{t(raw, "comingSoon")}</p>
          </div>
        </div>
      </section>

      <section className="band-plain">
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="section-title">{t(raw, "categories")}</h2>
            <Link href={`/${raw}/categories`} className="section-link">
              {t(raw, "viewAllCategories")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {preview.map((cat) => (
              <Link key={cat.id} href={`/${raw}/categories/${cat.slug}`} className="chip">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
