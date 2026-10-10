import type { Locale } from "@/lib/api";

export function Flag({ code }: { code: Locale }) {
  if (code === "lo") {
    return (
      <svg className="flag" viewBox="0 0 3 2" aria-hidden="true">
        <rect width="3" height="2" fill="#CE1126" />
        <rect y="0.5" width="3" height="1" fill="#002868" />
        <circle cx="1.5" cy="1" r="0.38" fill="#fff" />
      </svg>
    );
  }

  return (
    <svg className="flag" viewBox="0 0 60 30" aria-hidden="true">
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#fff" strokeWidth="6" d="M0 0l60 30M60 0L0 30" />
      <path stroke="#C8102E" strokeWidth="4" d="M0 0l60 30M60 0L0 30" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  );
}
