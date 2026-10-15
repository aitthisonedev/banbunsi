/** Defaults used when creating new documents, categories and quizzes in the admin. */

/** URL-friendly Latin slug ("Tax Basics 2026" → "tax-basics-2026"). Returns "" for non-Latin text. */
export function latinSlug(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Slugs for both languages from the names. Lao names have no Latin form, so the Lao slug falls
 * back to the English one (existing content uses Latin slugs in both languages).
 */
export function slugsFromNames(names: { lo: string; en: string }) {
  const en = latinSlug(names.en) || latinSlug(names.lo);
  const lo = latinSlug(names.lo) || en;
  return { lo, en };
}

/** Next sort position after the existing items (so new items appear last). */
export function nextSortOrder(items: Array<{ sort_order?: number }>) {
  return items.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 1;
}

/**
 * Suggests the next document number by following the latest number used in the same category,
 * with the current year and the next sequence across all documents, e.g. BB-ACC-2026-010 → BB-ACC-2026-011.
 * Falls back to the numbering format from Settings, then DOC-<year>-0001.
 */
export function suggestDocumentNumber(
  documents: Array<{ document_number?: string; category_id?: string; updated_at?: string }>,
  categoryId: string,
  format?: string,
) {
  const year = new Date().getFullYear();
  const numbered = documents
    .map((doc) => ({ ...doc, match: (doc.document_number || "").match(/^(.*?)(\d+)$/) }))
    .filter((doc) => doc.match);
  const taken = new Set(documents.map((doc) => doc.document_number));
  const template = numbered.find((doc) => doc.category_id === categoryId) || numbered[0];
  if (!template?.match) {
    const base = format && /\d+$/.test(format) ? format : `DOC-${year}-0001`;
    return base.replace(/\b(19|20)\d{2}\b/, String(year));
  }
  const [, prefix, digits] = template.match;
  const highest = numbered.reduce((max, doc) => Math.max(max, Number(doc.match![2])), 0);
  const withYear = prefix.replace(/\b(19|20)\d{2}\b/, String(year));
  let sequence = highest + 1;
  let candidate = `${withYear}${String(sequence).padStart(digits.length, "0")}`;
  while (taken.has(candidate)) candidate = `${withYear}${String(++sequence).padStart(digits.length, "0")}`;
  return candidate;
}
