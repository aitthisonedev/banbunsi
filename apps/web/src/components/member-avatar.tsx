"use client";

import { useState } from "react";
import { avatarSrc } from "@/lib/client-api";

/**
 * Content for a member avatar circle: the member's profile photo (an upload or their Google
 * picture) when available, otherwise a
 * default person icon (also used if the photo fails to load). The parent keeps its own size/shape.
 */
export function MemberAvatar({
  avatarUrl,
  size,
  imgClassName = "h-full w-full object-cover",
}: {
  avatarUrl?: string | null;
  size: number;
  imgClassName?: string;
}) {
  const photo = avatarSrc(avatarUrl);
  const [failed, setFailed] = useState("");

  if (photo && failed !== photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        width={size}
        height={size}
        className={imgClassName}
        // Google profile photos (lh3.googleusercontent.com) can refuse requests that send a referrer.
        referrerPolicy="no-referrer"
        onError={() => setFailed(photo)}
      />
    );
  }
  return (
    <span
      className="flex h-full w-full items-center justify-center bg-bb-tint text-bb-blue"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="currentColor">
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4 20.2c0-4 3.6-6.7 8-6.7s8 2.7 8 6.7c0 .5-.4.8-.8.8H4.8c-.4 0-.8-.3-.8-.8z" />
      </svg>
    </span>
  );
}
