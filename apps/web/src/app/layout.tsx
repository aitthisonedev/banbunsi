import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Lao } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const noto = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

// Phetsarath is specified in requirements; Noto Sans Lao is a reliable Google Fonts fallback
// until a self-hosted Phetsarath file is added to /public/fonts.
const phetsarathFallback = Noto_Sans_Lao({
  subsets: ["lao"],
  weight: ["400", "700"],
  variable: "--font-phetsarath",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BAN BUNSI",
    template: "%s | BAN BUNSI",
  },
  description: "Knowledge center for accounting, finance, tax, and law",
  applicationName: "BAN BUNSI",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="lo"
      className={`${noto.variable} ${phetsarathFallback.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
