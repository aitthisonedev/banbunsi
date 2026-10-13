/** Loads before paint to avoid light/dark flash. */
export function ThemeScript() {
  return (
    <script
      id="banbunsi-theme-boot"
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            try {
              var key = "banbunsi-theme";
              var stored = localStorage.getItem(key);
              var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              var shouldUseDark = stored ? stored === "dark" : prefersDark;
              document.documentElement.classList.toggle("dark", shouldUseDark);
            } catch {
              // Swallow browser storage issues; the page can still render safely.
            }
          })();
        `,
      }}
    />
  );
}
