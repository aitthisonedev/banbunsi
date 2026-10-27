import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/document-list";
import { Pagination } from "@/components/ui";
import { getCategories, getDocuments, me } from "@/lib/api";
import { categoriesOrDemo } from "@/lib/demo-categories";
import { isLocale, t } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

const HOME_PER_PAGE_OPTIONS = [10, 20, 30, 50];
const HOME_DEFAULT_PER_PAGE = 10;

function parseHomePerPage(raw: string | undefined) {
  const n = Number(raw || HOME_DEFAULT_PER_PAGE);
  if (HOME_PER_PAGE_OPTIONS.includes(n)) return n;
  if (Number.isFinite(n) && n >= 10 && n <= 100) return Math.floor(n);
  return HOME_DEFAULT_PER_PAGE;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "");
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; per_page?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  if (!isLocale(raw)) notFound();
  const page = Math.max(1, Number(sp.page || "1") || 1);
  const perPage = parseHomePerPage(sp.per_page);
  const cookie = (await headers()).get("cookie") || undefined;
  const [{ items }, latest, viewer] = await Promise.all([
    getCategories(raw).catch(() => ({ items: [] })),
    getDocuments(raw, { page, per_page: perPage }).catch(() => ({
      items: [],
      total: 0,
      page,
      per_page: perPage,
    })),
    // Signed-in visitors are not asked to register or sign in again.
    cookie ? me({ cookie }).catch(() => null) : Promise.resolve(null),
  ]);
  const { items: categoryItems } = categoriesOrDemo(raw, items);
  const latestDocs = latest.items;
  const tax = categoryItems.find((c) => c.code === "tax");

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
              className="object-cover"
              sizes="100vw"
            />
            <div className="hero-overlay" />
          </div>

          <div className="hero-inner">
            <div className="hero-copy">
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
              <div className="hero-tags-list">
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
          </div>

          <div className="feature-bridge">
            <div className="feature-grid">
              <Link href={`/${raw}/documents`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 4v10" />
                    <path
                      d="M8 10l4 4 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M5 18h14" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">
                    {t(raw, "featureForms")}
                  </span>
                  <span className="feature-card-desc">
                    {t(raw, "featureFormsDesc")}
                  </span>
                </span>
              </Link>
              <Link
                href={
                  tax ? `/${raw}/categories/${tax.slug}` : `/${raw}/categories`
                }
                className="feature-card"
              >
                <span className="feature-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path
                      d="M8 3v4M16 3v4M8 12h.01M12 12h.01M16 12h.01"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">
                    {t(raw, "featureCalendar")}
                  </span>
                  <span className="feature-card-desc">
                    {t(raw, "featureCalendarDesc")}
                  </span>
                </span>
              </Link>
              <Link href={`/${raw}/categories`} className="feature-card">
                <span className="feature-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M6 4h9l3 3v13H6z" />
                    <path d="M9 12h6M9 16h6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="feature-card-text">
                  <span className="feature-card-title">
                    {t(raw, "featureGuides")}
                  </span>
                  <span className="feature-card-desc">
                    {t(raw, "featureGuidesDesc")}
                  </span>
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
          <Pagination
            page={latest.page}
            perPage={perPage}
            total={latest.total}
            pathname={`/${raw}`}
            prevLabel={t(raw, "previous")}
            nextLabel={t(raw, "next")}
            perPageLabel={t(raw, "perPage")}
            navLabel={t(raw, "pagination")}
            perPageSizes={HOME_PER_PAGE_OPTIONS}
            defaultPerPage={HOME_DEFAULT_PER_PAGE}
          />
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
          {/* Downloading needs an account: visitors are offered Register (main) and Sign in;
              signed-in members only see the VIP link. */}
          <div className="home-promo-actions">
            {viewer ? null : (
              <>
                <Link href={`/${raw}/auth/register`} className="home-promo-btn">
                  {t(raw, "register")}
                </Link>
                <Link
                  href={`/${raw}/auth/login`}
                  className="home-promo-secondary"
                >
                  {t(raw, "login")}
                </Link>
              </>
            )}
            <Link href={`/${raw}/vip`} className="home-promo-secondary">
              {t(raw, "vipBenefits")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
