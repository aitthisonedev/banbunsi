import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

/** Lets search engines index public pages only; account, admin, sign-in and search results stay out. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  const privatePaths = ["/admin", "/account", "/auth", "/search"].flatMap((path) => [`/lo${path}`, `/en${path}`]);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: privatePaths }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
