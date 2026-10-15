"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/lib/api";
import { AdminAddPermissionModal } from "@/components/admin-add-permission-modal";
import { LoadingState, ErrorState } from "@/components/ui";
import {
  clientGetAdminDashboard,
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  type AdminMember,
} from "@/lib/client-api";
import { categoryCover } from "@/lib/category-covers";
import { isLocale, t } from "@/lib/i18n";
import { MemberAvatar } from "@/components/member-avatar";
import { usePublicSettings } from "@/components/public-settings-context";

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
  const dashboardTitle = usePublicSettings()?.dashboard_title || "";

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
    <div className="dash-content">
      {/* 1. Dashboard Page Header (DashLite Style) */}
      <div className="dash-head">
        <div className="dash-head-content">
          <h1 className="dash-title">
            {dashboardTitle || t(locale, "dashboard")}
          </h1>
          <p className="dash-subtitle">
            {locale === "lo"
              ? "ຍິນດີຕ້ອນຮັບກັບຄືນ, ແຜງຄວບຄຸມລະບົບ BAN BUNSI"
              : "Welcome back, BAN BUNSI Admin Overview."}
          </p>
        </div>

        <div className="dash-head-actions">
          {/* Time range dropdown pill */}
          <div className="dash-date-pill">
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
              className="dash-btn-primary"
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
        <div className="dash-alert dash-alert--success">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMsg}</span>
          <button
            type="button"
            className="dash-alert-close"
            onClick={() => setSuccessMsg("")}
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="dash-alert dash-alert--danger">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
          <button
            type="button"
            className="dash-alert-close"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      ) : null}

      {/* 2. Top 4 Metric Cards with Sparklines (DashLite Signature) */}
      <div className="dash-metric-row">
        {/* Card 1: Today Documents */}
        <div className="dash-card dash-card-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">
              {locale === "lo" ? "ເອກະສານທັງໝົດ" : "Total Documents"}
            </span>
          </div>
          <div className="dash-metric-middle">
            <h3 className="dash-metric-amount">{stats.documents ?? 14}</h3>
            {/* Sparkline curve (blue) */}
            <div className="dash-sparkline">
              <svg viewBox="0 0 80 28" fill="none" className="dash-spark-svg">
                <path
                  d="M2 18 C15 8, 25 24, 38 12 C50 3, 62 16, 78 8"
                  stroke="#798bff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="dash-metric-bottom">
            <span className="dash-trend dash-trend--up">
              ↑ 4.63% <span className="dash-trend-sub">vs last week</span>
            </span>
          </div>
        </div>

        {/* Card 2: Today Downloads / Requests */}
        <div className="dash-card dash-card-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">
              {locale === "lo" ? "ດາວໂຫຼດ & ຮ້ອງຂໍ" : "Total Downloads"}
            </span>
          </div>
          <div className="dash-metric-middle">
            <h3 className="dash-metric-amount">
              {stats.download_requests ? stats.download_requests : 248}
            </h3>
            {/* Sparkline curve (green) */}
            <div className="dash-sparkline">
              <svg viewBox="0 0 80 28" fill="none" className="dash-spark-svg">
                <path
                  d="M2 22 C14 14, 28 4, 40 18 C52 26, 65 6, 78 12"
                  stroke="#1ee0ac"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="dash-metric-bottom">
            <span className="dash-trend dash-trend--up">
              ↑ 2.34% <span className="dash-trend-sub">vs last week</span>
            </span>
          </div>
        </div>

        {/* Card 3: Today Members */}
        <div className="dash-card dash-card-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">
              {locale === "lo" ? "ສະມາຊິກທັງໝົດ" : "Total Members"}
            </span>
          </div>
          <div className="dash-metric-middle">
            <h3 className="dash-metric-amount">{stats.members ?? 7}</h3>
            {/* Sparkline curve (pink/rose) */}
            <div className="dash-sparkline">
              <svg viewBox="0 0 80 28" fill="none" className="dash-spark-svg">
                <path
                  d="M2 12 C16 22, 28 8, 42 16 C54 24, 66 10, 78 14"
                  stroke="#f46363"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="dash-metric-bottom">
            <span className="dash-trend dash-trend--up">
              ↑ 4.63% <span className="dash-trend-sub">vs last week</span>
            </span>
          </div>
        </div>

        {/* Card 4: Active VIP */}
        <div className="dash-card dash-card-metric">
          <div className="dash-metric-top">
            <span className="dash-metric-label">
              {locale === "lo" ? "ສະມາຊິກ VIP" : "Active VIP"}
            </span>
          </div>
          <div className="dash-metric-middle">
            <h3 className="dash-metric-amount">{stats.active_vip ?? 2}</h3>
            {/* Sparkline curve (cyan) */}
            <div className="dash-sparkline">
              <svg viewBox="0 0 80 28" fill="none" className="dash-spark-svg">
                <path
                  d="M2 16 C14 8, 26 22, 40 10 C52 2, 64 14, 78 6"
                  stroke="#09c2de"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="dash-metric-bottom">
            <span className="dash-trend dash-trend--up">
              ↑ 1.85% <span className="dash-trend-sub">vs last week</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Activity Area Chart (Left) + Donut (Middle) + Store Stats (Right) */}
      <div className="dash-charts-grid">
        {/* Main Activity Area Chart */}
        <div className="dash-card dash-card-chart">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">
                {locale === "lo"
                  ? "ສະຖິຕິການເຄື່ອນໄຫວລະບົບ"
                  : "Platform Activity & Content Growth"}
              </h2>
            </div>
            <div className="dash-chart-legend-wrap">
              <span className="dash-legend-dot dash-legend-dot--primary">
                ● Documents
              </span>
              <span className="dash-legend-dot dash-legend-dot--secondary">
                ● Downloads
              </span>
              <span className="dash-sub-select">Weekly ⌄</span>
            </div>
          </div>

          <div className="dash-chart-body">
            <div className="dash-svg-chart-container">
              <svg
                viewBox="0 0 540 190"
                className="dash-area-chart-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#798bff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#798bff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line
                  x1="30"
                  y1="30"
                  x2="520"
                  y2="30"
                  stroke="var(--dash-border)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="75"
                  x2="520"
                  y2="75"
                  stroke="var(--dash-border)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="120"
                  x2="520"
                  y2="120"
                  stroke="var(--dash-border)"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="165"
                  x2="520"
                  y2="165"
                  stroke="var(--dash-border)"
                />

                {/* Y-Axis labels */}
                <text x="12" y="34" className="dash-svg-axis-label">
                  120
                </text>
                <text x="12" y="79" className="dash-svg-axis-label">
                  80
                </text>
                <text x="12" y="124" className="dash-svg-axis-label">
                  40
                </text>
                <text x="16" y="169" className="dash-svg-axis-label">
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
                  stroke="#798bff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Dashed Secondary Curve Red */}
                <path
                  d="M40 155 C90 150, 140 160, 190 152 C240 145, 290 158, 340 150 C390 142, 450 155, 520 148"
                  fill="none"
                  stroke="#f46363"
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
            <div className="dash-chart-x-labels">
              <span>01 Oct</span>
              <span>08 Oct</span>
              <span>15 Oct</span>
              <span>22 Oct</span>
              <span>30 Oct</span>
            </div>
          </div>
        </div>

        {/* Content Distribution Donut Chart */}
        <div className="dash-card dash-card-donut">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              {locale === "lo" ? "ສັດສ່ວນການເຂົ້າເຖິງ" : "Access Distribution"}
            </h2>
          </div>

          <div className="dash-donut-body">
            <div className="dash-donut-container">
              <svg viewBox="0 0 120 120" className="dash-donut-svg">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#e5e9f2"
                  strokeWidth="14"
                />
                {/* Segment 1: Public (Purple/Blue ~ 60%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#798bff"
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
                  stroke="#09c2de"
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
                  stroke="#f46363"
                  strokeWidth="14"
                  strokeDasharray="42 282"
                  strokeDashoffset="-240"
                />
              </svg>
              <div className="dash-donut-center">
                <span className="dash-donut-number">100%</span>
                <span className="dash-donut-label">Total</span>
              </div>
            </div>

            <div className="dash-donut-legend">
              <div className="dash-donut-legend-item">
                <span
                  className="dash-legend-bullet"
                  style={{ background: "#798bff" }}
                />
                <span>Public (60%)</span>
              </div>
              <div className="dash-donut-legend-item">
                <span
                  className="dash-legend-bullet"
                  style={{ background: "#09c2de" }}
                />
                <span>Member (25%)</span>
              </div>
              <div className="dash-donut-legend-item">
                <span
                  className="dash-legend-bullet"
                  style={{ background: "#f46363" }}
                />
                <span>VIP (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Quick Summary Column (DashLite Store Statistics) */}
        <div className="dash-card dash-card-summary">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              {locale === "lo" ? "ຊັບພະຍາກອນລະບົບ" : "Resource Statistics"}
            </h2>
          </div>

          <div className="dash-summary-list">
            <div className="dash-summary-item">
              <div className="dash-summary-info">
                <span className="dash-summary-name">
                  {t(locale, "adminDocuments")}
                </span>
                <strong className="dash-summary-value">
                  {stats.documents ?? 14}
                </strong>
              </div>
              <span
                className="dash-summary-icon"
                style={{ background: "#f5f3ff", color: "#854fff" }}
              >
                📄
              </span>
            </div>

            <div className="dash-summary-item">
              <div className="dash-summary-info">
                <span className="dash-summary-name">
                  {t(locale, "allMembers")}
                </span>
                <strong className="dash-summary-value">
                  {stats.members ?? 7}
                </strong>
              </div>
              <span
                className="dash-summary-icon"
                style={{ background: "#ecfeff", color: "#06b6d4" }}
              >
                👥
              </span>
            </div>

            <div className="dash-summary-item">
              <div className="dash-summary-info">
                <span className="dash-summary-name">
                  {t(locale, "adminCategories")}
                </span>
                <strong className="dash-summary-value">
                  {stats.articles ?? 8}
                </strong>
              </div>
              <span
                className="dash-summary-icon"
                style={{ background: "#fdf2f8", color: "#ec4899" }}
              >
                📂
              </span>
            </div>

            <div className="dash-summary-item">
              <div className="dash-summary-info">
                <span className="dash-summary-name">
                  {t(locale, "adminQuizzes")}
                </span>
                <strong className="dash-summary-value">6</strong>
              </div>
              <span
                className="dash-summary-icon"
                style={{ background: "#eff6ff", color: "#3b82f6" }}
              >
                🏆
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Backend Staff & Permissions Table (Left) + Top Categories (Right) */}
      <div className="dash-bottom-grid">
        {/* Backend Staff & Permissions Table (DashLite Recent Orders style) */}
        <div className="dash-card dash-card-table">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">{t(locale, "backendStaff")}</h2>
              <span className="dash-card-subtitle">
                {locale === "lo"
                  ? "ຜູ້ທີ່ມີສິດທິເຂົ້າເຖິງ ແລະ ຈັດການຫຼັງບ້ານທັງໝົດ"
                  : "Members with staff access to manage backend CMS"}
              </span>
            </div>

            {isAdminPlus ? (
              <button
                type="button"
                className="dash-btn-sm"
                onClick={() => setModalOpen(true)}
              >
                + {t(locale, "addBackendPermission")}
              </button>
            ) : null}
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{locale === "lo" ? "ສະມາຊິກ" : "Member"}</th>
                  <th>{t(locale, "backendPermission")}</th>
                  <th>{locale === "lo" ? "ສະຖານະ" : "Status"}</th>
                  <th className="text-right">
                    {locale === "lo" ? "ຈັດການສິດທິ" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted">
                      {t(locale, "noMembers")}
                    </td>
                  </tr>
                ) : (
                  staffList.map((row) => {
                    const isSelf = row.id === currentUser.id;
                    const isRowOwner = row.staff_role === "owner";
                    const canModify =
                      isAdminPlus && !isSelf && (!isRowOwner || isOwner);

                    return (
                      <tr key={row.id}>
                        {/* Member Identity */}
                        <td>
                          <div className="dash-user-cell">
                            <span className="dash-cell-avatar">
                              <MemberAvatar
                                avatarUrl={row.avatar_url}
                                size={32}
                              />
                            </span>
                            <div className="dash-user-cell-meta">
                              <strong className="dash-user-cell-name">
                                {row.name || row.email}
                                {isSelf ? (
                                  <span className="dash-tag-self">You</span>
                                ) : null}
                              </strong>
                              <span className="dash-user-cell-email">
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Staff Role Badge */}
                        <td>
                          <span
                            className={`dash-role-chip dash-role-chip--${row.staff_role}`}
                          >
                            {row.staff_role === "owner" && "👑 "}
                            {row.staff_role === "admin" && "🛡️ "}
                            {row.staff_role === "editor" && "✏️ "}
                            {row.staff_role}
                          </span>
                        </td>

                        {/* Status Dot */}
                        <td>
                          <span className="dash-status-dot dash-status-dot--paid">
                            ● Active
                          </span>
                        </td>

                        {/* Action / Change Role */}
                        <td className="text-right">
                          {canModify ? (
                            <select
                              className="dash-table-select"
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
                            <span className="dash-table-readonly">
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

        {/* Top Categories Card (Right column matching DashLite Top Products) */}
        <div className="dash-card dash-card-categories">
          <div className="dash-card-header">
            <div>
              <h2 className="dash-card-title">
                {locale === "lo" ? "ໝວດໝູ່ຄວາມຮູ້ຫຼັກ" : "Top Categories"}
              </h2>
            </div>
            <span className="dash-sub-select">Weekly ⌄</span>
          </div>

          <ul className="dash-category-list">
            {[
              {
                code: "tax",
                name: locale === "lo" ? "ພາສີ - ອາກອນ" : "Tax & Duties",
                description:
                  locale === "lo" ? "ແບບຟອມ & ລະບຽບການ" : "Forms & Regulations",
                files: 4,
              },
              {
                code: "accounting",
                name: locale === "lo" ? "ການບັນຊີ" : "Accounting",
                description:
                  locale === "lo" ? "ມາດຕະຖານ & ຄູ່ມື" : "Standards & Guides",
                files: 3,
              },
              {
                code: "law",
                name: locale === "lo" ? "ກົດໝາຍ" : "Law & Regulations",
                description:
                  locale === "lo" ? "ກົດໝາຍວິສາຫະກິດ" : "Commercial Law",
                files: 3,
              },
              {
                code: "finance",
                name: locale === "lo" ? "ການເງິນ" : "Finance",
                description:
                  locale === "lo" ? "ບົດລາຍງານການເງິນ" : "Financial Statements",
                files: 2,
              },
            ].map((cat) => (
              <li key={cat.code}>
                <Link
                  href={`/${locale}/admin/documents?category=${cat.code}`}
                  className="dash-category-item"
                >
                  <span className="dash-cat-media">
                    <Image
                      src={categoryCover({ category_slug: cat.code }, cat.code)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="dash-cat-img"
                    />
                  </span>
                  <span className="dash-cat-info">
                    <strong>{cat.name}</strong>
                    <span>{cat.description}</span>
                  </span>
                  <span className="dash-cat-stat">
                    <strong>{cat.files} Files</strong>
                    <span className="dash-cat-sold">Published</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
