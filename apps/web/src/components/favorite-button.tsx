"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/api";
import { clientAddFavorite, clientRemoveFavorite } from "@/lib/client-api";
import { t, translateApiError } from "@/lib/i18n";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Saves or removes a document from the member's favorites. Guests get a sign-in
 * link; signed-in members toggle with one click.
 */
export function FavoriteButton({
  locale,
  documentId,
  initialFavorited,
  loginHref,
  signedIn,
}: {
  locale: Locale;
  documentId: string;
  initialFavorited: boolean;
  loginHref: string;
  signedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!signedIn) {
    return (
      <Link href={loginHref} className="doc-favorite-btn">
        <StarIcon filled={false} />
        <span>{t(locale, "favoriteLogin")}</span>
      </Link>
    );
  }

  async function onToggle() {
    setBusy(true);
    setError("");
    const next = !favorited;
    // Optimistic update so the star feels instant.
    setFavorited(next);
    try {
      if (next) {
        await clientAddFavorite(documentId);
      } else {
        await clientRemoveFavorite(documentId);
      }
    } catch (err) {
      setFavorited(!next);
      setError(
        translateApiError(
          locale,
          err instanceof Error ? err.message : t(locale, "loadError"),
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="doc-favorite">
      <button
        type="button"
        className={`doc-favorite-btn${favorited ? " is-favorited" : ""}`}
        onClick={onToggle}
        disabled={busy}
        aria-busy={busy}
        aria-pressed={favorited}
      >
        <StarIcon filled={favorited} />
        <span>
          {favorited ? t(locale, "removeFavorite") : t(locale, "addFavorite")}
        </span>
      </button>
      {error ? (
        <p className="doc-file-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
