import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/api";

export function BrandLogo({
  locale,
  priority = false,
  className = "",
}: {
  locale: Locale;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-center ${className}`}
      aria-label="BAN BUNSI"
    >
      <Image
        src="/brand/logo-light.png"
        alt="BAN BUNSI"
        width={606}
        height={320}
        priority={priority}
        className="logo-light h-10 w-auto md:h-12"
      />
      <Image
        src="/brand/logo-dark.png"
        alt=""
        width={606}
        height={320}
        priority={priority}
        className="logo-dark h-10 w-auto md:h-12"
      />
    </Link>
  );
}
