/** Stock cover images per document category, used when a document has no uploaded cover. */

const COVER_BY_CATEGORY: Record<string, string> = {
  accounting: "/brand/categories/cat-accounting.jpg",
  finance: "/brand/categories/cat-finance.jpg",
  tax: "/brand/categories/cat-tax.jpg",
  duties: "/brand/categories/cat-duties.jpg",
  audit: "/brand/categories/cat-audit.jpg",
  law: "/brand/categories/cat-law.jpg",
  knowledge: "/images/hero-default.jpeg",
  sme: "/brand/categories/cat-finance.jpg",
};

const COVER_FALLBACKS = [
  "/brand/categories/cat-accounting.jpg",
  "/brand/categories/cat-finance.jpg",
  "/brand/categories/cat-tax.jpg",
  "/brand/categories/cat-duties.jpg",
  "/brand/categories/cat-audit.jpg",
  "/brand/categories/cat-law.jpg",
];

/**
 * Picks a stock image from the category slug or name. When nothing matches, `key` selects a
 * fallback: a list index, or a stable string (e.g. a document id) so the image never changes.
 */
export function categoryCover(
  doc: { category_slug?: string; category_name?: string },
  key: number | string,
) {
  const slug = (doc.category_slug || "").toLowerCase();
  const name = (doc.category_name || "").toLowerCase();
  for (const [code, src] of Object.entries(COVER_BY_CATEGORY)) {
    if (slug.includes(code) || name.includes(code)) return src;
  }
  // Lao slug heuristics from seed
  if (slug.includes("phasi") || slug.includes("tax"))
    return COVER_BY_CATEGORY.tax;
  if (slug.includes("banchi") || slug.includes("account"))
    return COVER_BY_CATEGORY.accounting;
  if (slug.includes("ngen") || slug.includes("financ"))
    return COVER_BY_CATEGORY.finance;
  if (slug.includes("kotmai") || slug.includes("law"))
    return COVER_BY_CATEGORY.law;
  if (slug.includes("kuat") || slug.includes("audit"))
    return COVER_BY_CATEGORY.audit;
  if (slug.includes("akon") || slug.includes("dut"))
    return COVER_BY_CATEGORY.duties;
  const index =
    typeof key === "number"
      ? key
      : [...key].reduce(
          (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
          0,
        );
  return COVER_FALLBACKS[index % COVER_FALLBACKS.length];
}
