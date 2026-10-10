import Script from "next/script";

/** Loads before paint to avoid light/dark flash. */
export function ThemeScript() {
  return (
    <Script id="banbunsi-theme-boot" src="/theme-boot.js" strategy="beforeInteractive" />
  );
}
