import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryCards } from "@/components/category-cards";
import { DocumentList } from "@/components/document-list";
import { getCategories, getDocuments } from "@/lib/api";
import { categoriesOrDemo } from "@/lib/demo-categories";
import { isLocale, t } from "@/lib/i18n";

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

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const [{ items }, latest] = await Promise.all([
    getCategories(raw).catch(() => ({ items: [] })),
    getDocuments(raw, { per_page: 40 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      per_page: 40,
    })),
  ]);
  const { items: categoryItems } = categoriesOrDemo(raw, items);
  const preview = categoryItems.slice(0, 8);
  const latestDocs = latest.items.slice(0, 8);
  const tax = categoryItems.find((c) => c.code === "tax");
  const counts: Record<string, number> = {};
  for (const doc of latest.items) {
    if (!doc.category_slug) continue;
    counts[doc.category_slug] = (counts[doc.category_slug] || 0) + 1;
  }

  return (
    <div className="page-home">
      <div className="hero-stack">
        <section className="hero">
          <div className="hero-media" aria-hidden>
            <Image
              src="/images/hero-default.jpeg"
              alt=""
              fill
              priority
              quality={80}
              className="object-cover"
              sizes="100vw"
            />
            <div className="hero-overlay" />
          </div>

          <div className="hero-inner">
            <div className="hero-copy">
              <span className="hero-badge">
                <SparkleIcon />
                <span>{t(raw, "trustBadge")}</span>
              </span>
              <h1>{t(raw, "headline")}</h1>
              <p className="hero-lead">{t(raw, "subhead")}</p>
            </div>

            <form
              className="hero-search"
              action={`/${raw}/search`}
              method="get"
              role="search"
            >
              <span className="hero-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <label className="sr-only" htmlFor="q">
                {t(raw, "search")}
              </label>
              <input
                id="q"
                name="q"
                placeholder={t(raw, "searchPlaceholder")}
                autoComplete="off"
              />
              <button type="submit" aria-label={t(raw, "search")}>
                <span>{t(raw, "search")}</span>
              </button>
            </form>

            <div className="hero-tags">
              <span className="hero-tags-label">
                {raw === "lo" ? "ຄົ້ນຫາຍອດນິຍົມ:" : "Popular:"}
              </span>
              <Link
                href={`/${raw}/search?q=${encodeURIComponent(raw === "lo" ? "ພາສີ" : "Tax")}`}
                className="hero-tag"
              >
                {raw === "lo" ? "ພາສີ-ອາກອນ" : "Tax & Duty"}
              </Link>
              <Link
                href={`/${raw}/search?q=${encodeURIComponent(raw === "lo" ? "ບັນຊີ" : "Accounting")}`}
                className="hero-tag"
              >
                {raw === "lo" ? "ມາດຕະຖານບັນຊີ" : "Accounting"}
              </Link>
              <Link
                href={`/${raw}/search?q=${encodeURIComponent(raw === "lo" ? "ກົດໝາຍ" : "Law")}`}
                className="hero-tag"
              >
                {raw === "lo" ? "ກົດໝາຍ" : "Law & Regulations"}
              </Link>
              <Link href={`/${raw}/documents`} className="hero-tag">
                {raw === "lo" ? "ແບບຟອມທັງໝົດ" : "All Forms"}
              </Link>
            </div>
          </div>

          <div className="feature-bridge">
            <div className="feature-grid">
              <Link href={`/${raw}/documents`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 4v10" />
                    <path d="M8 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 18h14" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">{t(raw, "featureForms")}</span>
                  <span className="feature-card-desc">{t(raw, "featureFormsDesc")}</span>
                </span>
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
                <span className="feature-card-text">
                  <span className="feature-card-title">{t(raw, "featureCalendar")}</span>
                  <span className="feature-card-desc">{t(raw, "featureCalendarDesc")}</span>
                </span>
              </Link>
              <Link href={`/${raw}/categories`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 4h9l3 3v13H6z" />
                    <path d="M9 12h6M9 16h6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">{t(raw, "featureGuides")}</span>
                  <span className="feature-card-desc">{t(raw, "featureGuidesDesc")}</span>
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="band-after-hero home-section">
        <div className="home-section-inner">
          <div className="home-section-head">
            <div className="home-section-head-title">
              <span className="home-section-dot" aria-hidden="true" />
              <h2 className="section-title">{t(raw, "latestDocuments")}</h2>
            </div>
            <Link href={`/${raw}/documents`} className="section-link">
              <span>{t(raw, "viewAllDocuments")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <DocumentList
            locale={raw}
            items={latestDocs}
            emptyText={t(raw, "noDocuments")}
            variant="cards"
          />
        </div>
      </section>

      <section className="band-plain home-section home-section--categories">
        <div className="home-section-inner">
          <div className="home-section-head">
            <div className="home-section-head-title">
              <span className="home-section-dot" aria-hidden="true" />
              <h2 className="section-title">{t(raw, "categories")}</h2>
            </div>
            <Link href={`/${raw}/categories`} className="section-link">
              <span>{t(raw, "viewAllCategories")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <CategoryCards locale={raw} items={preview} counts={counts} />
        </div>
      </section>

      <section className="home-promo">
        <div className="home-promo-inner">
          <div className="home-promo-copy">
            <div className="home-promo-badge">
              <CrownIcon />
              <span>{t(raw, "vipBenefits")}</span>
            </div>
            <h2 className="home-promo-title">{t(raw, "homePromoTitle")}</h2>
            <p className="home-promo-lead">{t(raw, "homePromoLead")}</p>
          </div>
          <div className="home-promo-actions">
            <Link href={`/${raw}/auth/login`} className="btn-hero-primary home-promo-btn">
              {t(raw, "login")}
            </Link>
            <Link href={`/${raw}/vip`} className="btn-hero-secondary home-promo-secondary">
              {t(raw, "vipBenefits")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
