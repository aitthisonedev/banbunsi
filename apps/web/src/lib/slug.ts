/**
 * Route params arrive percent-encoded (e.g. "%E0%BA%9A…" for a Lao slug); decode once so the slug
 * is not encoded twice when it is sent to the API. Malformed input is returned unchanged.
 */
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
