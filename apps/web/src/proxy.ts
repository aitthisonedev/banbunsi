import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_HEADER } from "@/lib/locale-header";

/**
 * - Addresses without a language (e.g. /admin, /documents?q=tax) redirect to the default
 *   language instead of showing a 404.
 * - Passes the URL's locale to the root layout so it can set <html lang> (WCAG 3.1.1).
 */
// Kept here (not imported from lib/i18n) so the proxy, which runs on every request, stays small.
const LOCALES = ["lo", "en"];
const DEFAULT_LOCALE = "lo";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];
  if (
    pathname !== "/" &&
    !LOCALES.includes(segment) &&
    !pathname.startsWith("/_")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, segment === "en" ? "en" : "lo");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: skip Next internals and files with an extension (images, robots.txt, sitemap.xml).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
