"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/lib/api";
import { AdminAddPermissionModal } from "@/components/admin-add-permission-modal";
import { LoadingState, ErrorState } from "@/components/ui";
import {
  avatarSrc,
  clientGetAdminDashboard,
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  type AdminMember,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

function memberInitials(name: string, email: string): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function getAvatarBgColor(name: string): string {
  const colors = [
    "#6366f1",
    "#06b6d4",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export default function AdminDashboardPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busyMemberId, setBusyMemberId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("30days");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      clientMe(),
      clientGetAdminDashboard(),
      clientListAdminMembers(""),
    ])
      .then(([u, s, m]) => {
        if (ignore) return;
        setCurrentUser(u);
        setStats(s);
        setMembers(m.items);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : t(locale, "loadError"));
      });

    return () => {
      ignore = true;
    };
  }, [locale]);

  async function handleRoleChange(memberId: string, newRole: string) {
    setBusyMemberId(memberId);
    setError("");
    setSuccessMsg("");

    try {
      await clientPatchAdminMember(memberId, { staff_role: newRole });
      setSuccessMsg(t(locale, "permissionGranted"));
      const [m, s] = await Promise.all([
        clientListAdminMembers(""),
        clientGetAdminDashboard(),
      ]);
      setMembers(m.items);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusyMemberId("");
    }
  }

  function handlePermissionGranted() {
    setSuccessMsg(t(locale, "permissionGranted"));
    clientListAdminMembers("").then((m) => setMembers(m.items));
    clientGetAdminDashboard().then(setStats);
  }

  if (error && !stats) {
    return <ErrorState title={error} />;
  }
  if (!stats || !currentUser) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  const isAdminPlus =
    currentUser.staff_role === "admin" || currentUser.staff_role === "owner";
  const isOwner = currentUser.staff_role === "owner";

  // Filter backend staff (owner, admin, editor)
  const staffList = (members || []).filter((m) => m.staff_role !== "member");

  return (
    <div className="w-full space-y-6">
      {/* 1. Dashboard Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t(locale, "dashboard")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {locale === "lo"
              ? "ຍິນດີຕ້ອນຮັບກັບຄືນ, ແຜງຄວບຄຸມລະບົບ BAN BUNSI"
              : "Welcome back, BAN BUNSI Admin Overview."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time range dropdown pill */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152038] px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
            <svg
              viewBox="0 0 20 20"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="14" height="13" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
              <line x1="3" y1="8" x2="17" y2="8" />
            </svg>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              aria-label="Filter time range"
              className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Primary Action Button (Add Permission) */}
          {isAdminPlus ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t(locale, "addBackendPermission")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Notifications */}
      {successMsg ? (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="currentColor"
            className="shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1">{successMsg}</span>
          <button
            type="button"
            className="text-base leading-none text-emerald-700 dark:text-emerald-400 hover:opacity-100 opacity-70 cursor-pointer"
            onClick={() => setSuccessMsg("")}
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium">
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="currentColor"
            className="shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="text-base leading-none text-rose-700 dark:text-rose-400 hover:opacity-100 opacity-70 cursor-pointer"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      ) : null}

      {/* 2. Top 4 Metric Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Today Documents */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {locale === "lo" ? "ເອກະສານທັງໝົດ" : "Total Documents"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.documents ?? 14}
            </h3>
            {/* Sparkline curve (blue) */}
            <div className="w-20 h-7 shrink-0">
              <svg viewBox="0 0 80 28" fill="none" className="w-full h-full">
                <path
                  d="M2 18 C15 8, 25 24, 38 12 C50 3, 62 16, 78 8"
                  stroke="#6366f1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>↑ 4.63%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              vs last week
            </span>
          </div>
        </div>

        {/* Card 2: Today Downloads / Requests */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {locale === "lo" ? "ດາວໂຫຼດ & ຮ້ອງຂໍ" : "Total Downloads"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.download_requests ? stats.download_requests : 248}
            </h3>
            {/* Sparkline curve (green) */}
            <div className="w-20 h-7 shrink-0">
              <svg viewBox="0 0 80 28" fill="none" className="w-full h-full">
                <path
                  d="M2 22 C14 14, 28 4, 40 18 C52 26, 65 6, 78 12"
                  stroke="#10b981"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>↑ 2.34%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              vs last week
            </span>
          </div>
        </div>

        {/* Card 3: Today Members */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {locale === "lo" ? "ສະມາຊິກທັງໝົດ" : "Total Members"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.members ?? 7}
            </h3>
            {/* Sparkline curve (pink/rose) */}
            <div className="w-20 h-7 shrink-0">
              <svg viewBox="0 0 80 28" fill="none" className="w-full h-full">
                <path
                  d="M2 12 C16 22, 28 8, 42 16 C54 24, 66 10, 78 14"
                  stroke="#f43f5e"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>↑ 4.63%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              vs last week
            </span>
          </div>
        </div>

        {/* Card 4: Active VIP */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {locale === "lo" ? "ສະມາຊິກ VIP" : "Active VIP"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.active_vip ?? 2}
            </h3>
            {/* Sparkline curve (cyan) */}
            <div className="w-20 h-7 shrink-0">
              <svg viewBox="0 0 80 28" fill="none" className="w-full h-full">
                <path
                  d="M2 16 C14 8, 26 22, 40 10 C52 2, 64 14, 78 6"
                  stroke="#06b6d4"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>↑ 1.85%</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">
              vs last week
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Activity Area Chart + Donut + Store Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Activity Area Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo"
                ? "ສະຖິຕິການເຄື່ອນໄຫວລະບົບ"
                : "Platform Activity & Content Growth"}
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                ● Documents
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                ● Downloads
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium cursor-pointer">
                Weekly ⌄
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
            <div className="w-full h-44">
              <svg
                viewBox="0 0 540 190"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line
                  x1="30"
                  y1="30"
                  x2="520"
                  y2="30"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="75"
                  x2="520"
                  y2="75"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="120"
                  x2="520"
                  y2="120"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="165"
                  x2="520"
                  y2="165"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                />

                {/* Y-Axis labels */}
                <text x="12" y="34" className="text-[10px] fill-slate-400">
                  120
                </text>
                <text x="12" y="79" className="text-[10px] fill-slate-400">
                  80
                </text>
                <text x="12" y="124" className="text-[10px] fill-slate-400">
                  40
                </text>
                <text x="16" y="169" className="text-[10px] fill-slate-400">
                  0
                </text>

                {/* Area Gradient Blue */}
                <path
                  d="M40 135 C80 120, 110 95, 150 110 C190 125, 230 65, 270 95 C310 125, 340 50, 390 60 C440 70, 480 90, 520 80 L520 165 L40 165 Z"
                  fill="url(#areaGradBlue)"
                />

                {/* Smooth Curve Blue */}
                <path
                  d="M40 135 C80 120, 110 95, 150 110 C190 125, 230 65, 270 95 C310 125, 340 50, 390 60 C440 70, 480 90, 520 80"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Dashed Secondary Curve Red */}
                <path
                  d="M40 155 C90 150, 140 160, 190 152 C240 145, 290 158, 340 150 C390 142, 450 155, 520 148"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
              <span>01 Oct</span>
              <span>08 Oct</span>
              <span>15 Oct</span>
              <span>22 Oct</span>
              <span>30 Oct</span>
            </div>
          </div>
        </div>

        {/* Content Distribution Donut Chart (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo" ? "ສັດສ່ວນການເຂົ້າເຖິງ" : "Access Distribution"}
            </h2>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 my-auto">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="14"
                />
                {/* Segment 1: Public (Purple ~ 60%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="14"
                  strokeDasharray="170 282"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Member (Cyan ~ 25%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="14"
                  strokeDasharray="70 282"
                  strokeDashoffset="-170"
                />
                {/* Segment 3: VIP (Pink ~ 15%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="14"
                  strokeDasharray="42 282"
                  strokeDashoffset="-240"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  100%
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Total
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Public (60%)</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Member (25%)</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>VIP (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Quick Summary Column (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo" ? "ຊັບພະຍາກອນລະບົບ" : "Resource Statistics"}
            </h2>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800/60">
            <div className="flex items-center justify-between py-2.5 first:pt-0">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  {t(locale, "adminDocuments")}
                </span>
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  {stats.documents ?? 14}
                </strong>
              </div>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                📄
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  {t(locale, "allMembers")}
                </span>
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  {stats.members ?? 7}
                </strong>
              </div>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300">
                👥
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  {t(locale, "adminCategories")}
                </span>
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  {stats.articles ?? 8}
                </strong>
              </div>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300">
                📂
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5 last:pb-0">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  {t(locale, "adminQuizzes")}
                </span>
                <strong className="text-base font-bold text-slate-900 dark:text-white">
                  6
                </strong>
              </div>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                🏆
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Backend Staff & Permissions Table (Left) + Top Categories (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Backend Staff & Permissions Table (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t(locale, "backendStaff")}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                {locale === "lo"
                  ? "ຜູ້ທີ່ມີສິດທິເຂົ້າເຖິງ ແລະ ຈັດການຫຼັງບ້ານທັງໝົດ"
                  : "Members with staff access to manage backend CMS"}
              </span>
            </div>

            {isAdminPlus ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                + {t(locale, "addBackendPermission")}
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 sm:px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    {locale === "lo" ? "ສະມາຊິກ" : "Member"}
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    {t(locale, "backendPermission")}
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    {locale === "lo" ? "ສະຖານະ" : "Status"}
                  </th>
                  <th className="px-4 sm:px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] text-right">
                    {locale === "lo" ? "ຈັດການສິດທິ" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      {t(locale, "noMembers")}
                    </td>
                  </tr>
                ) : (
                  staffList.map((row) => {
                    const photo = avatarSrc(row.avatar_url);
                    const isSelf = row.id === currentUser.id;
                    const isRowOwner = row.staff_role === "owner";
                    const canModify =
                      isAdminPlus && !isSelf && (!isRowOwner || isOwner);

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                      >
                        {/* Member Identity */}
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs"
                              style={{
                                background: photo
                                  ? "transparent"
                                  : getAvatarBgColor(row.name || row.email),
                              }}
                            >
                              {photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={photo}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>
                                  {memberInitials(row.name, row.email)}
                                </span>
                              )}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <strong className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                {row.name || row.email}
                                {isSelf ? (
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    You
                                  </span>
                                ) : null}
                              </strong>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Staff Role Badge */}
                        <td className="px-4 sm:px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                              row.staff_role === "owner"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : row.staff_role === "admin"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            }`}
                          >
                            {row.staff_role === "owner" && "👑 "}
                            {row.staff_role === "admin" && "🛡️ "}
                            {row.staff_role === "editor" && "✏️ "}
                            {row.staff_role}
                          </span>
                        </td>

                        {/* Status Dot */}
                        <td className="px-4 sm:px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            ● Active
                          </span>
                        </td>

                        {/* Action / Change Role */}
                        <td className="px-4 sm:px-5 py-3 text-right">
                          {canModify ? (
                            <select
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              disabled={busyMemberId === row.id}
                              value={row.staff_role}
                              onChange={(e) =>
                                handleRoleChange(row.id, e.target.value)
                              }
                              aria-label={t(locale, "backendPermission")}
                            >
                              <option value="editor">
                                {t(locale, "roleEditor")}
                              </option>
                              <option value="admin">
                                {t(locale, "roleAdmin")}
                              </option>
                              {isOwner ? (
                                <option value="owner">
                                  {t(locale, "roleOwner")}
                                </option>
                              ) : null}
                              <option value="member">
                                ✕ {t(locale, "revokePermission")}
                              </option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              {isSelf ? "Current user" : "Protected"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories Card (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#152038] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {locale === "lo" ? "ໝວດໝູ່ຄວາມຮູ້ຫຼັກ" : "Top Categories"}
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium cursor-pointer">
              Weekly ⌄
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <Link
              href={`/${locale}/admin/documents?category=tax`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300">
                📑
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {locale === "lo" ? "ພາສີ - ອາກອນ" : "Tax & Duties"}
                </strong>
                <span className="text-[11px] text-slate-400 truncate">
                  {locale === "lo"
                    ? "ແບບຟອມ & ລະບຽບການ"
                    : "Forms & Regulations"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  4 Files
                </strong>
                <span className="text-[10px] text-slate-400">Published</span>
              </div>
            </Link>

            <Link
              href={`/${locale}/admin/documents?category=accounting`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                📊
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {locale === "lo" ? "ການບັນຊີ" : "Accounting"}
                </strong>
                <span className="text-[11px] text-slate-400 truncate">
                  {locale === "lo" ? "ມາດຕະຖານ & ຄູ່ມື" : "Standards & Guides"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  3 Files
                </strong>
                <span className="text-[10px] text-slate-400">Published</span>
              </div>
            </Link>

            <Link
              href={`/${locale}/admin/documents?category=law`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                ⚖️
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {locale === "lo" ? "ກົດໝາຍ" : "Law & Regulations"}
                </strong>
                <span className="text-[11px] text-slate-400 truncate">
                  {locale === "lo" ? "ກົດໝາຍວິສາຫະກິດ" : "Commercial Law"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  3 Files
                </strong>
                <span className="text-[10px] text-slate-400">Published</span>
              </div>
            </Link>

            <Link
              href={`/${locale}/admin/documents?category=finance`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
                💰
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {locale === "lo" ? "ການເງິນ" : "Finance"}
                </strong>
                <span className="text-[11px] text-slate-400 truncate">
                  {locale === "lo"
                    ? "ບົດລາຍງານການເງິນ"
                    : "Financial Statements"}
                </span>
              </div>
              <div className="text-right shrink-0">
                <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                  2 Files
                </strong>
                <span className="text-[10px] text-slate-400">Published</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      {isAdminPlus && modalOpen ? (
        <AdminAddPermissionModal
          locale={locale}
          currentUser={currentUser}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handlePermissionGranted}
        />
      ) : null}
    </div>
  );
}
