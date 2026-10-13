import Image from "next/image";
import Link from "next/link";
import type { CategoryNode, Locale } from "@/lib/api";
import { demoCategories } from "@/lib/demo-categories";
import { t } from "@/lib/i18n";

const COVER_LIST = [
  "/brand/categories/cat-accounting.jpg",
  "/brand/categories/cat-finance.jpg",
  "/brand/categories/cat-tax.jpg",
  "/brand/categories/cat-duties.jpg",
  "/brand/categories/cat-audit.jpg",
  "/brand/categories/cat-law.jpg",
] as const;

const COVER_BY_CODE: Record<string, string> = {
  accounting: COVER_LIST[0],
  finance: COVER_LIST[1],
  tax: COVER_LIST[2],
  duties: COVER_LIST[3],
  audit: COVER_LIST[4],
  law: COVER_LIST[5],
  knowledge: "/images/hero-default.jpeg",
  sme: COVER_LIST[1],
};

function coverFor(code: string, index: number) {
  return COVER_BY_CODE[code] || COVER_LIST[index % COVER_LIST.length];
}

function titleFor(locale: Locale, cat: CategoryNode) {
  const name = (cat.name || "").trim();
  if (name) return name;
  const demo = demoCategories(locale).find((d) => d.code === cat.code);
  if (demo?.name) return demo.name;
  return t(locale, "categories");
}

export function CategoryCards({
  locale,
  items,
  counts,
}: {
  locale: Locale;
  items: CategoryNode[];
  counts?: Record<string, number>;
}) {
  if (!items.length) return null;

  return (
    <ul className="category-card-grid">
      {items.map((cat, index) => {
        const title = titleFor(locale, cat);
        const cover = coverFor(cat.code, index);
        const count = counts?.[cat.slug] ?? counts?.[cat.code];

        return (
          <li key={cat.id || `${cat.code}-${index}`}>
            <Link
              href={`/${locale}/categories/${cat.slug}`}
              className="category-card category-card--image"
            >
              <span className="category-card-media">
                <Image
                  src={cover}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="category-card-img"
                  priority={index < 3}
                />
                <span className="category-card-media-shade" aria-hidden />
                <span className="category-card-title-on-image">{title}</span>
              </span>
              <span className="category-card-body">
                {cat.description ? (
                  <span className="category-card-desc">{cat.description}</span>
                ) : null}
                <span className="category-card-meta">
                  {typeof count === "number"
                    ? `${count} ${t(locale, "documents")}`
                    : t(locale, "browseCategory")}
                  <span className="category-card-arrow" aria-hidden>
                    →
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
