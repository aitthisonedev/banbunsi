import type { DashboardDayCount } from "@/lib/client-api";

export type DashboardRange = "7d" | "30d" | "90d" | "12m";

export const DASHBOARD_RANGES: DashboardRange[] = ["7d", "30d", "90d", "12m"];

/** One point on the chart: an inclusive date span (YYYY-MM-DD strings compare correctly). */
export type Bucket = { start: string; end: string; label: string };

/** Today's date (YYYY-MM-DD) in the site's timezone. */
export function todayIn(timeZone?: string, now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, days: number) {
  const date = parseDay(day);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDay(date);
}

// Browsers have no Lao month names, so they are spelled out here (standard abbreviations).
const LAO_MONTHS = [
  "ມ.ກ.",
  "ກ.ພ.",
  "ມີ.ນ.",
  "ເມ.ສ.",
  "ພ.ພ.",
  "ມິ.ຖ.",
  "ກ.ລ.",
  "ສ.ຫ.",
  "ກ.ຍ.",
  "ຕ.ລ.",
  "ພ.ຈ.",
  "ທ.ວ.",
];
const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Short month name (0-based month) in the page language. */
export function monthName(locale: string, month: number) {
  return (locale === "lo" ? LAO_MONTHS : EN_MONTHS)[month];
}

/** "16 Sep" / "16 ກ.ຍ." for a YYYY-MM-DD day; adds the year when asked. */
export function formatShortDate(locale: string, day: string, withYear = false) {
  const date = parseDay(day);
  const text = `${date.getUTCDate()} ${monthName(locale, date.getUTCMonth())}`;
  return withYear ? `${text} ${date.getUTCFullYear()}` : text;
}

/**
 * Chart buckets ending today: daily for 7/30 days, weekly for 90 days, monthly for 12 months.
 * Labels use the page language.
 */
export function buildBuckets(
  range: DashboardRange,
  today: string,
  locale: string,
): Bucket[] {
  const dayLabel = (day: string) => formatShortDate(locale, day);

  if (range === "12m") {
    const [y, m] = today.split("-").map(Number);
    const buckets: Bucket[] = [];
    for (let i = 11; i >= 0; i--) {
      const first = new Date(Date.UTC(y, m - 1 - i, 1));
      const last = new Date(Date.UTC(y, m - i, 0));
      buckets.push({
        start: formatDay(first),
        end: i === 0 ? today : formatDay(last),
        label: monthName(locale, first.getUTCMonth()),
      });
    }
    return buckets;
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 91;
  const step = range === "90d" ? 7 : 1;
  const buckets: Bucket[] = [];
  // Buckets end on today, so a week never reaches into the future.
  for (let offset = days - step; offset >= 0; offset -= step) {
    const end = addDays(today, -offset);
    const start = addDays(end, 1 - step);
    buckets.push({ start, end, label: dayLabel(start) });
  }
  return buckets;
}

/** Total of daily counts between start and end (inclusive). */
export function sumBetween(
  series: DashboardDayCount[] | undefined,
  start: string,
  end: string,
) {
  let total = 0;
  for (const row of series || []) {
    if (row.date >= start && row.date <= end) total += row.count;
  }
  return total;
}

export type KpiTrend = {
  /** Items added during the selected range. */
  added: number;
  /** Change of the running total over the range, in percent; null when it started at zero. */
  percent: number | null;
  /** Running total at the end of each bucket, for the sparkline. */
  points: number[];
};

/**
 * Trend for a KPI whose current total is `total` and whose additions per day are `series`.
 * Totals before the range are worked out backwards from the current total.
 */
export function kpiTrend(
  total: number,
  series: DashboardDayCount[] | undefined,
  buckets: Bucket[],
): KpiTrend {
  if (!buckets.length) return { added: 0, percent: null, points: [] };
  const first = buckets[0].start;
  const last = buckets[buckets.length - 1].end;
  const added = sumBetween(series, first, last);
  const startTotal = Math.max(0, total - added);
  const points = buckets.map(
    (bucket) =>
      total - sumBetween(series, addDays(bucket.end, 1), "9999-12-31"),
  );
  return {
    added,
    percent: startTotal > 0 ? (added / startTotal) * 100 : null,
    points: [startTotal, ...points],
  };
}
