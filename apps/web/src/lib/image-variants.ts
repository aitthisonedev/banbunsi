import { categoryCover } from "@/lib/category-covers";

/** Widths the API can resize uploaded images to (see apps/api/internal/handlers/image_variants.go). */
export type ImageVariantWidth = 160 | 320 | 480 | 640 | 960 | 1280;

/** True for images uploaded through the admin (served by the API), which Next does not optimize. */
export function isUploadedImage(url: string | undefined | null) {
  return Boolean(url && /\/uploads\/(covers|branding)\//.test(url));
}

/** Asks the API for a resized copy of an uploaded image; other URLs are returned unchanged. */
export function imageVariant(
  url: string | undefined | null,
  width: ImageVariantWidth,
) {
  if (!url) return "";
  if (!isUploadedImage(url) || /[?&]w=\d+/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}w=${width}`;
}

/**
 * The cover a document shows on the website: its uploaded cover, else the default cover from
 * Settings, else its category photo. Uploaded images come back resized to `width`.
 */
export function documentCoverSrc(
  doc: {
    cover_image_url?: string;
    category_slug?: string;
    category_name?: string;
  },
  key: number | string,
  defaultCover: string | undefined,
  width: ImageVariantWidth,
) {
  const uploaded = doc.cover_image_url || defaultCover;
  return uploaded ? imageVariant(uploaded, width) : categoryCover(doc, key);
}

/**
 * The same cover as documentCoverSrc, but the original file exactly as uploaded (no "?w=" resize),
 * for the full-size cover view.
 */
export function documentCoverOriginal(
  doc: {
    cover_image_url?: string;
    category_slug?: string;
    category_name?: string;
  },
  key: number | string,
  defaultCover: string | undefined,
) {
  return doc.cover_image_url || defaultCover || categoryCover(doc, key);
}
