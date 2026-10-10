import Script from "next/script";

/** Runs before paint to avoid light/dark flash. */
export function ThemeScript() {
  return (
    <Script id="banbunsi-theme-boot" strategy="beforeInteractive">
      {`(function(){try{var k='banbunsi-theme';var s=localStorage.getItem(k);var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`}
    </Script>
  );
}
