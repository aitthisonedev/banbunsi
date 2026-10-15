"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/api";
import type { DashboardActivity } from "@/lib/client-api";
import {
  formatShortDate,
  type Bucket,
  type KpiTrend,
} from "@/lib/dashboard-stats";
import { imageVariant } from "@/lib/image-variants";

/** Picks the Lao or English text for the page language. */
export function useText(locale: Locale) {
  return (lo: string, en: string) => (locale === "lo" ? lo : en);
}

function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "lo" ? "lo-LA" : "en-US").format(
    value,
  );
}

/* ---------- Icons (24px stroke icons, same style as the sidebar) ---------- */

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Icons = {
  document: (size?: number) => (
    <Svg size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  ),
  users: (size?: number) => (
    <Svg size={size}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  ),
  crown: (size?: number) => (
    <Svg size={size}>
      <path d="M2 18h20" />
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z" />
    </Svg>
  ),
  quiz: (size?: number) => (
    <Svg size={size}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  ),
  folder: (size?: number) => (
    <Svg size={size}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  ),
  userPlus: (size?: number) => (
    <Svg size={size}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </Svg>
  ),
  plus: (size?: number) => (
    <Svg size={size}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  ),
  more: (size?: number) => (
    <Svg size={size}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Svg>
  ),
  paperclip: (size?: number) => (
    <Svg size={size}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Svg>
  ),
  calendar: (size?: number) => (
    <Svg size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
};

/* ---------- KPI card ---------- */

function Sparkline({ points, label }: { points: number[]; label: string }) {
  const id = useId();
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const coords = points.map((value, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = max === min ? 20 : 34 - ((value - min) / span) * 28;
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  return (
    <svg
      className="dov-spark"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100 40 L0 40 Z`} fill={`url(#${id}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  locale,
  tone,
  icon,
  label,
  total,
  trend,
  rangeLabel,
  href,
}: {
  locale: Locale;
  tone: "blue" | "green" | "amber" | "violet";
  icon: ReactNode;
  label: string;
  total: number;
  trend: KpiTrend;
  rangeLabel: string;
  href?: string;
}) {
  const L = useText(locale);
  const change =
    trend.added === 0
      ? L("ບໍ່ມີການປ່ຽນແປງ", "No change")
      : trend.percent === null
        ? L(`+${trend.added} ໃໝ່`, `+${trend.added} new`)
        : `+${trend.percent >= 10 ? Math.round(trend.percent) : trend.percent.toFixed(1)}%`;
  const body = (
    <>
      <div className="dov-kpi-top">
        <span className={`dov-kpi-icon dov-tone-${tone}`}>{icon}</span>
        <span className="dov-kpi-label">{label}</span>
      </div>
      <div className="dov-kpi-middle">
        <strong className="dov-kpi-value">{formatNumber(locale, total)}</strong>
        <span className={`dov-kpi-spark dov-tone-${tone}`}>
          <Sparkline
            points={trend.points}
            label={L(`ແນວໂນ້ມ ${label}`, `${label} trend`)}
          />
        </span>
      </div>
      <p className="dov-kpi-change">
        <span className={`dov-change ${trend.added > 0 ? "is-up" : "is-flat"}`}>
          {trend.added > 0 ? "↑ " : ""}
          {change}
        </span>
        <span className="dov-kpi-range">{rangeLabel}</span>
      </p>
    </>
  );
  return href ? (
    <Link href={href} className="dov-card dov-kpi">
      {body}
    </Link>
  ) : (
    <div className="dov-card dov-kpi">{body}</div>
  );
}

/* ---------- Usage chart ---------- */

export type ChartSeries = {
  key: string;
  label: string;
  tone: "blue" | "green";
  values: number[];
};

export function UsageChart({
  locale,
  buckets,
  series,
  note,
}: {
  locale: Locale;
  buckets: Bucket[];
  series: ChartSeries[];
  note?: string;
}) {
  const L = useText(locale);
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the real width so labels keep their size on small screens.
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setWidth(Math.max(260, Math.round(box.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  // Round the axis up to a friendly number so gridlines read well.
  const step = Math.max(1, Math.ceil(max / 4));
  const top = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const W = width;
  const H = width < 480 ? 200 : 230;
  const padL = 32;
  const padB = 26;
  const plotW = W - padL - 8;
  const plotH = H - padB - 10;
  const slot = plotW / buckets.length;
  const barW = Math.max(2, Math.min(16, (slot - 4) / series.length));
  // About one date label per 72px, counted back from the newest so the last label always shows.
  const labelEvery = Math.max(
    1,
    Math.ceil(buckets.length / Math.floor(plotW / 72)),
  );
  const y = (value: number) => 10 + plotH - (value / top) * plotH;
  const empty = series.every((s) => s.values.every((v) => v === 0));

  return (
    <div className="dov-chart" ref={boxRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="dov-chart-svg"
        role="img"
        aria-label={L(
          "ກຣາຟເອກະສານທີ່ເພີ່ມ ແລະ ການດາວໂຫຼດ",
          "Chart of documents added and downloads",
        )}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL}
              x2={W - 8}
              y1={y(tick)}
              y2={y(tick)}
              className="dov-chart-grid"
            />
            <text
              x={padL - 8}
              y={y(tick) + 4}
              className="dov-chart-axis"
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        ))}
        {buckets.map((bucket, i) => {
          const x0 = padL + i * slot;
          const groupW = barW * series.length;
          return (
            <g key={bucket.start} onMouseEnter={() => setHover(i)}>
              <rect
                x={x0}
                y={10}
                width={slot}
                height={plotH}
                className={`dov-chart-hit${hover === i ? " is-hover" : ""}`}
              />
              {series.map((s, si) => {
                const value = s.values[i] || 0;
                const h = (value / top) * plotH;
                return (
                  <rect
                    key={s.key}
                    x={x0 + (slot - groupW) / 2 + si * barW}
                    y={y(value)}
                    width={barW - 1}
                    height={Math.max(value ? 2 : 0, h)}
                    rx={Math.min(3, barW / 3)}
                    className={`dov-chart-bar dov-fill-${s.tone}`}
                  />
                );
              })}
              {(buckets.length - 1 - i) % labelEvery === 0 ? (
                <text
                  x={x0 + slot / 2}
                  y={H - 8}
                  className="dov-chart-axis"
                  textAnchor="middle"
                >
                  {bucket.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover !== null ? (
        <div className="dov-chart-tip" aria-hidden="true">
          <strong>{buckets[hover].label}</strong>
          {series.map((s) => (
            <span key={s.key}>
              <i className={`dov-dot dov-fill-${s.tone}`} />
              {s.label}: {s.values[hover] || 0}
            </span>
          ))}
        </div>
      ) : null}
      {empty ? (
        <p className="dov-chart-empty">
          {L(
            "ບໍ່ມີເອກະສານ ຫຼື ການດາວໂຫຼດໃນຊ່ວງເວລານີ້.",
            "No documents or downloads in this period.",
          )}
        </p>
      ) : null}
      {note ? <p className="dov-chart-note">{note}</p> : null}
      {/* Same numbers as a table for screen readers */}
      <table className="sr-only">
        <caption>
          {L("ເອກະສານ ແລະ ການດາວໂຫຼດ", "Documents and downloads")}
        </caption>
        <thead>
          <tr>
            <th scope="col">{L("ຊ່ວງເວລາ", "Period")}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, i) => (
            <tr key={bucket.start}>
              <th scope="row">{bucket.label}</th>
              {series.map((s) => (
                <td key={s.key}>{s.values[i] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Quick actions ---------- */

export type QuickAction = {
  href: string;
  label: string;
  hint: string;
  icon: ReactNode;
  tone: "blue" | "green" | "amber" | "violet";
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <ul className="dov-actions">
      {actions.map((action) => (
        <li key={action.href}>
          <Link href={action.href} className="dov-action">
            <span className={`dov-action-icon dov-tone-${action.tone}`}>
              {action.icon}
            </span>
            <span className="dov-action-text">
              <strong>+ {action.label}</strong>
              <span>{action.hint}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Recent activity ---------- */

function relativeTime(locale: Locale, iso: string, now = Date.now()) {
  const minutes = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 60000),
  );
  const lo = locale === "lo";
  if (minutes < 1) return lo ? "ຫາກໍ່ນີ້" : "just now";
  if (minutes < 60) return lo ? `${minutes} ນາທີກ່ອນ` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24)
    return lo
      ? `${hours} ຊົ່ວໂມງກ່ອນ`
      : `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30)
    return lo
      ? `${days} ມື້ກ່ອນ`
      : `${days} ${days === 1 ? "day" : "days"} ago`;
  return formatShortDate(locale, iso.slice(0, 10), true);
}

export function RecentActivity({
  locale,
  items,
  emptyAction,
}: {
  locale: Locale;
  items: DashboardActivity[];
  emptyAction: ReactNode;
}) {
  const L = useText(locale);
  const meta: Record<
    DashboardActivity["type"],
    { label: string; icon: ReactNode; tone: QuickAction["tone"] }
  > = {
    document: {
      label: L("ເພີ່ມເອກະສານ", "Added document"),
      icon: Icons.document(16),
      tone: "blue",
    },
    category: {
      label: L("ເພີ່ມໝວດ", "Added category"),
      icon: Icons.folder(16),
      tone: "amber",
    },
    quiz: {
      label: L("ສ້າງແບບທົດສອບ", "Created quiz"),
      icon: Icons.quiz(16),
      tone: "violet",
    },
    member: {
      label: L("ສະມາຊິກໃໝ່ລົງທະບຽນ", "New member registered"),
      icon: Icons.userPlus(16),
      tone: "green",
    },
  };
  if (!items.length) {
    return (
      <div className="dov-empty">
        <p>{L("ຍັງບໍ່ມີການເຄື່ອນໄຫວ.", "No activity yet.")}</p>
        {emptyAction}
      </div>
    );
  }
  return (
    <ul className="dov-activity">
      {items.map((item, index) => {
        const m = meta[item.type];
        const row = (
          <>
            <span className={`dov-activity-icon dov-tone-${m.tone}`}>
              {m.icon}
            </span>
            <span className="dov-activity-text">
              <strong>{m.label}</strong>
              <span className="dov-activity-title">{item.title}</span>
              {item.user && item.user !== item.title ? (
                <span className="dov-activity-user">{item.user}</span>
              ) : null}
            </span>
            <time className="dov-activity-time" dateTime={item.at}>
              {relativeTime(locale, item.at)}
            </time>
          </>
        );
        return (
          <li key={`${item.type}-${item.at}-${index}`}>
            {item.link ? (
              <Link
                href={`/${locale}${item.link}`}
                className="dov-activity-row"
              >
                {row}
              </Link>
            ) : (
              <div className="dov-activity-row">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Recent documents ---------- */

export type DashboardDocument = {
  id: string;
  title: string;
  category: string;
  files: number;
  status: string;
  cover: string;
  publicHref?: string;
};

function DocumentMenu({
  locale,
  doc,
}: {
  locale: Locale;
  doc: DashboardDocument;
}) {
  const L = useText(locale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="dov-menu" ref={ref}>
      <button
        type="button"
        className="dov-icon-btn"
        aria-label={L(`ຕົວເລືອກ: ${doc.title}`, `Options for ${doc.title}`)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {Icons.more(18)}
      </button>
      {open ? (
        <div className="dov-menu-list" role="menu" id={menuId}>
          <Link
            role="menuitem"
            href={`/${locale}/admin/documents/${doc.id}`}
            onClick={() => setOpen(false)}
          >
            {L("ເບິ່ງລາຍລະອຽດ", "View details")}
          </Link>
          <Link
            role="menuitem"
            href={`/${locale}/admin/documents/${doc.id}/edit`}
            onClick={() => setOpen(false)}
          >
            {L("ແກ້ໄຂ", "Edit")}
          </Link>
          {doc.publicHref ? (
            <a
              role="menuitem"
              href={doc.publicHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              {L("ເປີດໃນເວັບໄຊ", "Open on website")}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DocumentCover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState("");
  if (!src || failed === src) {
    return (
      <span className="dov-doc-fallback" aria-hidden="true">
        {Icons.document(34)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageVariant(src, 480)}
      alt={title}
      loading="lazy"
      className="dov-doc-img"
      onError={() => setFailed(src)}
    />
  );
}

export function RecentDocuments({
  locale,
  docs,
  emptyAction,
}: {
  locale: Locale;
  docs: DashboardDocument[];
  emptyAction: ReactNode;
}) {
  const L = useText(locale);
  const status: Record<string, string> = {
    published: L("ເຜີຍແຜ່ແລ້ວ", "Published"),
    draft: L("ສະບັບຮ່າງ", "Draft"),
    archived: L("ເກັບໄວ້ໃນຄັງ", "Archived"),
  };
  if (!docs.length) {
    return (
      <div className="dov-empty">
        <p>{L("ຍັງບໍ່ມີເອກະສານ.", "No documents yet.")}</p>
        {emptyAction}
      </div>
    );
  }
  return (
    <ul className="dov-docs">
      {docs.map((doc) => (
        <li key={doc.id} className="dov-doc">
          <Link
            href={`/${locale}/admin/documents/${doc.id}`}
            className="dov-doc-cover"
            tabIndex={-1}
            aria-hidden="true"
          >
            <DocumentCover src={doc.cover} title={doc.title} />
          </Link>
          <div className="dov-doc-body">
            <div className="dov-doc-head">
              <Link
                href={`/${locale}/admin/documents/${doc.id}`}
                className="dov-doc-title"
              >
                {doc.title}
              </Link>
              <DocumentMenu locale={locale} doc={doc} />
            </div>
            <p className="dov-doc-category">{doc.category || "—"}</p>
            <div className="dov-doc-meta">
              <span className="dov-doc-files">
                {Icons.paperclip(14)}
                {L(
                  `${doc.files} ໄຟລ໌`,
                  `${doc.files} ${doc.files === 1 ? "file" : "files"}`,
                )}
              </span>
              <span className={`dov-status dov-status--${doc.status}`}>
                {status[doc.status] || doc.status}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Section card ---------- */

export function DashCard({
  title,
  description,
  action,
  children,
  className = "",
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id: string;
}) {
  return (
    <section
      className={`dov-card dov-section ${className}`}
      aria-labelledby={id}
    >
      <header className="dov-section-head">
        <div>
          <h2 id={id} className="dov-section-title">
            {title}
          </h2>
          {description ? (
            <p className="dov-section-desc">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
