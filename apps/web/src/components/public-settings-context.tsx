"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PublicSettings } from "@/lib/api";
import { clientGetPublicSettings } from "@/lib/client-api";

const PublicSettingsContext = createContext<PublicSettings | null>(null);

/**
 * Shares the settings the server already loaded for this page with client components, so they
 * do not each fetch /settings/public again. Reloads only when Settings dispatches
 * "brand-settings-updated" after a save.
 */
export function PublicSettingsProvider({
  initial,
  children,
}: {
  initial: PublicSettings;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(initial);
  useEffect(() => {
    const reload = () =>
      clientGetPublicSettings()
        .then(setSettings)
        .catch(() => undefined);
    window.addEventListener("brand-settings-updated", reload);
    return () => window.removeEventListener("brand-settings-updated", reload);
  }, []);
  return (
    <PublicSettingsContext.Provider value={settings}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

/** Public site settings for the current page (null only outside the provider). */
export function usePublicSettings() {
  return useContext(PublicSettingsContext);
}
