"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  documentFileDownloadURL,
  type DocumentFileMeta,
  type Locale,
} from "@/lib/api";
import { clientMe } from "@/lib/client-api";
import { t } from "@/lib/i18n";

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function canDownloadClient(
  access: DocumentFileMeta["download_access"],
  user: {
    staff_role: string;
    membership_tier: string;
    account_status: string;
  } | null,
) {
  if (!user || user.account_status !== "active") return false;
  if (["editor", "admin", "owner"].includes(user.staff_role)) return true;
  if (access === "member") return true;
  if (access === "vip") return user.membership_tier === "vip";
  return false;
}

export function DocumentFileDownload({
  locale,
  slug,
  file,
  loginHref,
  vipHref,
  initialCanDownload = false,
}: {
  locale: Locale;
  slug: string;
  file: DocumentFileMeta;
  loginHref: string;
  vipHref: string;
  initialCanDownload?: boolean;
}) {
  const [canDL, setCanDL] = useState(
    Boolean(file.can_download || initialCanDownload),
  );
  const [authed, setAuthed] = useState(
    Boolean(file.can_download || initialCanDownload),
  );

  useEffect(() => {
    let cancelled = false;
    clientMe()
      .then((user) => {
        if (cancelled) return;
        setAuthed(true);
        setCanDL(canDownloadClient(file.download_access, user));
      })
      .catch(() => {
        if (cancelled) return;
        setAuthed(false);
        setCanDL(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file.download_access]);

  if (canDL) {
    return (
      <a
        href={documentFileDownloadURL(slug, file.id)}
        className="doc-file-btn"
        download
      >
        <DownloadIcon />
        <span>{t(locale, "download")}</span>
      </a>
    );
  }

  if (!authed) {
    return (
      <Link href={loginHref} className="doc-file-btn">
        <DownloadIcon />
        <span>{t(locale, "downloadLogin")}</span>
      </Link>
    );
  }

  return (
    <Link href={vipHref} className="doc-file-btn">
      <DownloadIcon />
      <span>{t(locale, "downloadVip")}</span>
    </Link>
  );
}
