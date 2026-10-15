import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_HEADER } from "@/lib/locale-header";

/** Passes the URL's locale to the root layout so it can set <html lang> (WCAG 3.1.1). */
export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[1];
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, segment === "en" ? "en" : "lo");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: skip Next internals and files with an extension (images, robots.txt, sitemap.xml).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
