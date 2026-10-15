"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/api";
import { clientGetPublicSettings } from "@/lib/client-api";
import logoLight from "../../public/brand/logo-light.png";
import logoDark from "../../public/brand/logo-dark.png";

export function BrandLogo({
  locale,
  priority = false,
  className = "",
  variant = "auto",
}: {
  locale: Locale;
  priority?: boolean;
  className?: string;
  /** auto = theme swap; light/dark = fixed asset for that surface */
  variant?: "auto" | "light" | "dark";
}) {
  const [logos, setLogos] = useState({
    logo: "",
    login: "",
    system: "",
    name: "",
  });
  const [failedLogo, setFailedLogo] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => {
      clientGetPublicSettings()
        .then((settings) => {
          if (active) {
            setLogos({
              logo: settings.logo_url || "",
              login: settings.login_logo_url || "",
              system: settings.system_logo_url || "",
              name: settings.system_name || settings.organization_name || "",
            });
          }
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener("brand-settings-updated", load);
    return () => {
      active = false;
      window.removeEventListener("brand-settings-updated", load);
    };
  }, []);

  const brandName = logos.name || "BAN BUNSI";
  const configuredLogo = variant === "dark"
    ? logos.login || logos.logo
    : logos.system || logos.logo;
  const activeLogo = configuredLogo === failedLogo ? "" : configuredLogo;
  // Uploaded logos are plain URLs, which next/image cannot size on its own; CSS sets the rendered height.
  const remoteSize = activeLogo ? { width: 240, height: 96, unoptimized: true } : {};

  if (variant === "light" || variant === "dark") {
    return (
      <Link
        href={`/${locale}`}
        className={`inline-flex items-center ${className}`}
        aria-label={brandName}
      >
        <Image
          src={activeLogo || (variant === "light" ? logoLight : logoDark)}
          alt={brandName}
          priority={priority}
          {...remoteSize}
          onError={() => setFailedLogo(activeLogo)}
          className="h-10 w-auto md:h-12"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-center ${className}`}
      aria-label={brandName}
    >
      <Image
        src={activeLogo || logoLight}
        alt={brandName}
        priority={priority}
        {...remoteSize}
        onError={() => setFailedLogo(activeLogo)}
        className="logo-light h-10 w-auto md:h-12"
      />
      <Image
        src={activeLogo || logoDark}
        alt=""
        priority={priority}
        {...remoteSize}
        onError={() => setFailedLogo(activeLogo)}
        className="logo-dark h-10 w-auto md:h-12"
      />
    </Link>
  );
}
