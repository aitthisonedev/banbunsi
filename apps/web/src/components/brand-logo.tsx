import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/api";
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
  if (variant === "light" || variant === "dark") {
    return (
      <Link
        href={`/${locale}`}
        className={`inline-flex items-center ${className}`}
        aria-label="BAN BUNSI"
      >
        <Image
          src={variant === "light" ? logoLight : logoDark}
          alt="BAN BUNSI"
          priority={priority}
          className="h-10 w-auto md:h-12"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-center ${className}`}
      aria-label="BAN BUNSI"
    >
      <Image
        src={logoLight}
        alt="BAN BUNSI"
        priority={priority}
        className="logo-light h-10 w-auto md:h-12"
      />
      <Image
        src={logoDark}
        alt=""
        priority={priority}
        className="logo-dark h-10 w-auto md:h-12"
      />
    </Link>
  );
}
