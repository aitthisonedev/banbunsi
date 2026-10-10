"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "banbunsi-theme";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle({
  darkLabel,
  lightLabel,
}: {
  darkLabel: string;
  lightLabel: string;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  const label = theme === "dark" ? lightLabel : darkLabel;

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-pressed={theme === "dark"}
      aria-label={label}
      title={label}
      data-theme={theme}
    >
      <svg
        className="theme-icon theme-icon-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="theme-icon theme-icon-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
