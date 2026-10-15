"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/lib/api";
import { AdminAddPermissionModal } from "@/components/admin-add-permission-modal";
import {
  DashCard,
  Icons,
  KpiCard,
  QuickActions,
  RecentActivity,
  RecentDocuments,
  UsageChart,
  useText,
  type DashboardDocument,
  type QuickAction,
} from "@/components/admin-dashboard";
import { LoadingState, ErrorState } from "@/components/ui";
import { Select } from "@/components/ui/select";
import {
  clientGetAdminDashboard,
  clientListAdminDocuments,
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  type AdminDashboard,
  type AdminMember,
} from "@/lib/client-api";
import {
  DASHBOARD_RANGES,
  buildBuckets,
  formatShortDate,
  kpiTrend,
  sumBetween,
  todayIn,
  type DashboardRange,
} from "@/lib/dashboard-stats";
import { isLocale, t } from "@/lib/i18n";
import { MemberAvatar } from "@/components/member-avatar";
import { usePublicSettings } from "@/components/public-settings-context";

const RECENT_DOCUMENTS = 6;

function toDashboardDocument(
  locale: string,
  row: Record<string, unknown>,
): DashboardDocument {
  const slug = String(row.slug || "");
  return {
    id: String(row.id),
    title: String(row.title || row.document_number || "—"),
    category: String(row.category_name || ""),
    files: Array.isArray(row.files) ? row.files.length : 0,
    status: String(row.status || "draft"),
    cover: String(row.cover_image_url || ""),
    publicHref:
      row.status === "published" && slug
        ? `/${locale}/documents/${encodeURIComponent(slug)}`
        : undefined,
  };
}

export default function AdminDashboardPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const L = useText(locale);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [documents, setDocuments] = useState<DashboardDocument[] | null>(null);
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busyMemberId, setBusyMemberId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [range, setRange] = useState<DashboardRange>("30d");
  const dashboardTitle = usePublicSettings()?.dashboard_title || "";

  useEffect(() => {
    let ignore = false;
    Promise.all([clientMe(), clientGetAdminDashboard(locale)])
      .then(async ([u, s]) => {
        if (ignore) return;
        setCurrentUser(u);
        setStats(s);
        const adminPlus = u.staff_role === "admin" || u.staff_role === "owner";
        // Members are only visible to admins and owners; editors skip that request.
        const [docs, m] = await Promise.all([
          clientListAdminDocuments(locale).catch(() => ({ items: [] })),
          adminPlus
            ? clientListAdminMembers("").catch(() => ({ items: [] }))
            : Promise.resolve({ items: [] as AdminMember[] }),
        ]);
        if (ignore) return;
        setDocuments(
          docs.items
            .slice(0, RECENT_DOCUMENTS)
            .map((row) => toDashboardDocument(locale, row)),
        );
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
        clientGetAdminDashboard(locale),
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
    clientGetAdminDashboard(locale).then(setStats);
  }

  const today = todayIn(stats?.timezone);
  const buckets = useMemo(
    () => buildBuckets(range, today, locale),
    [range, today, locale],
  );

  if (error && !stats) {
    return <ErrorState title={error} />;
  }
  if (!stats || !currentUser) {
    return <LoadingState label={t(locale, "loading")} />;
  }

  const isAdminPlus =
    currentUser.staff_role === "admin" || currentUser.staff_role === "owner";
  const isOwner = currentUser.staff_role === "owner";
  const staffList = (members || []).filter((m) => m.staff_role !== "member");
  const series = stats.series || {};

  const rangeLabels: Record<DashboardRange, string> = {
    "7d": L("7 ມື້ຜ່ານມາ", "Last 7 days"),
    "30d": L("30 ມື້ຜ່ານມາ", "Last 30 days"),
    "90d": L("90 ມື້ຜ່ານມາ", "Last 90 days"),
    "12m": L("12 ເດືອນຜ່ານມາ", "Last 12 months"),
  };
  const rangeShort: Record<DashboardRange, string> = {
    "7d": L("7 ມື້", "7D"),
    "30d": L("30 ມື້", "30D"),
    "90d": L("90 ມື້", "90D"),
    "12m": L("12 ເດືອນ", "12M"),
  };
  const rangeOptions = DASHBOARD_RANGES.map((value) => ({
    value,
    label: rangeLabels[value],
  }));
  const rangeLabel = rangeLabels[range];

  const kpis = [
    {
      key: "documents",
      tone: "blue" as const,
      icon: Icons.document(22),
      label: L("ເອກະສານ", "Documents"),
      total: stats.documents,
      series: series.documents,
      href: `/${locale}/admin/documents`,
    },
    {
      key: "users",
      tone: "green" as const,
      icon: Icons.users(22),
      label: L("ຜູ້ໃຊ້ງານ", "Users"),
      total: stats.users ?? stats.members,
      series: series.users,
      href: isAdminPlus ? `/${locale}/admin/members` : undefined,
    },
    {
      key: "vip",
      tone: "amber" as const,
      icon: Icons.crown(22),
      label: L("ສະມາຊິກ VIP", "VIP Members"),
      total: stats.active_vip,
      series: series.vip,
      href: isAdminPlus ? `/${locale}/admin/members` : undefined,
    },
    {
      key: "quizzes",
      tone: "violet" as const,
      icon: Icons.quiz(22),
      label: L("ແບບທົດສອບ", "Quizzes"),
      total: stats.quizzes ?? 0,
      series: series.quizzes,
      href: `/${locale}/admin/quizzes`,
    },
  ];

  const chartSeries = [
    {
      key: "documents",
      label: L("ເອກະສານທີ່ເພີ່ມ", "Documents added"),
      tone: "blue" as const,
      values: buckets.map((b) => sumBetween(series.documents, b.start, b.end)),
    },
    {
      key: "downloads",
      label: L("ການດາວໂຫຼດ", "Downloads"),
      tone: "green" as const,
      values: buckets.map((b) => sumBetween(series.downloads, b.start, b.end)),
    },
  ];
  const trackedSince = stats.downloads_tracked_since
    ? formatShortDate(
        locale,
        todayIn(stats.timezone, new Date(stats.downloads_tracked_since)),
        true,
      )
    : "";
  const downloadsNote = trackedSince
    ? L(
        `ນັບການດາວໂຫຼດຕັ້ງແຕ່ ${trackedSince}.`,
        `Downloads are counted since ${trackedSince}.`,
      )
    : L(
        "ຍັງບໍ່ມີການດາວໂຫຼດ; ການດາວໂຫຼດໃໝ່ຈະຖືກນັບອັດຕະໂນມັດ.",
        "No downloads recorded yet; new downloads are counted automatically.",
      );

  const quickActions: QuickAction[] = [
    {
      href: `/${locale}/admin/documents/new`,
      label: L("ເພີ່ມເອກະສານ", "Add document"),
      hint: L("ອັບໂຫຼດໄຟລ໌ ແລະ ເຜີຍແຜ່", "Upload files and publish"),
      icon: Icons.document(20),
      tone: "blue",
    },
    {
      href: `/${locale}/admin/categories/new`,
      label: L("ເພີ່ມໝວດ", "Add category"),
      hint: L("ຈັດກຸ່ມເອກະສານ", "Group your documents"),
      icon: Icons.folder(20),
      tone: "amber",
    },
    {
      href: `/${locale}/admin/quizzes/new`,
      label: L("ສ້າງແບບທົດສອບ", "Create quiz"),
      hint: L("ຄຳຖາມ ແລະ ຄຳຕອບ", "Questions and answers"),
      icon: Icons.quiz(20),
      tone: "violet",
    },
    ...(isAdminPlus
      ? [
          {
            href: `/${locale}/admin/members`,
            label: L("ເພີ່ມສະມາຊິກ", "Add member"),
            hint: L("ຈັດການສະມາຊິກ ແລະ ສິດທິ", "Manage members and access"),
            icon: Icons.userPlus(20),
            tone: "green" as const,
          },
        ]
      : []),
  ];

  const addDocumentButton = (
    <Link href={`/${locale}/admin/documents/new`} className="btn-primary">
      + {L("ເພີ່ມເອກະສານ", "Add document")}
    </Link>
  );

  return (
    <div className="dov">
      {/* 1. Header */}
      <header className="dov-head">
        <div>
          <h1 className="dov-title">
            {dashboardTitle || t(locale, "dashboard")}
          </h1>
          <p className="dov-subtitle">
            {L(
              "ພາບລວມຂອງເອກະສານ, ຜູ້ໃຊ້ງານ ແລະ ການເຄື່ອນໄຫວລ່າສຸດ.",
              "An overview of your documents, users and latest activity.",
            )}
          </p>
        </div>
        <div className="dov-range">
          <span className="dov-range-icon" aria-hidden="true">
            {Icons.calendar(16)}
          </span>
          <Select
            aria-label={L("ຊ່ວງເວລາ", "Date range")}
            value={range}
            onChange={(value) => setRange(value as DashboardRange)}
            options={rangeOptions}
            searchable={false}
          />
        </div>
      </header>

      {successMsg ? (
        <div className="dash-alert dash-alert--success" role="status">
          <span>{successMsg}</span>
          <button
            type="button"
            className="dash-alert-close"
            aria-label={L("ປິດ", "Dismiss")}
            onClick={() => setSuccessMsg("")}
          >
            ×
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="dash-alert dash-alert--danger" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="dash-alert-close"
            aria-label={L("ປິດ", "Dismiss")}
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      ) : null}

      {/* 2. Summary cards */}
      <section aria-label={L("ສະຫຼຸບ", "Summary")} className="dov-kpis">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.key}
            locale={locale}
            tone={kpi.tone}
            icon={kpi.icon}
            label={kpi.label}
            total={kpi.total}
            trend={kpiTrend(kpi.total, kpi.series, buckets)}
            rangeLabel={rangeLabel}
            href={kpi.href}
          />
        ))}
      </section>

      {/* 3. Analytics + 4. Quick actions */}
      <div className="dov-grid">
        <DashCard
          id="dov-usage"
          className="dov-span-2"
          title={L("ການນຳໃຊ້", "Usage")}
          description={L(
            "ເອກະສານທີ່ເພີ່ມ ແລະ ການດາວໂຫຼດ",
            "Documents added and downloads",
          )}
          action={
            <div
              className="dov-segmented"
              role="group"
              aria-label={L("ຊ່ວງເວລາ", "Time period")}
            >
              {DASHBOARD_RANGES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={range === value}
                  className={range === value ? "is-active" : ""}
                  onClick={() => setRange(value)}
                >
                  {rangeShort[value]}
                </button>
              ))}
            </div>
          }
        >
          <div className="dov-legend">
            {chartSeries.map((s) => (
              <span key={s.key}>
                <i className={`dov-dot dov-fill-${s.tone}`} />
                {s.label}
                <strong>{s.values.reduce((a, b) => a + b, 0)}</strong>
              </span>
            ))}
          </div>
          <UsageChart
            locale={locale}
            buckets={buckets}
            series={chartSeries}
            note={downloadsNote}
          />
        </DashCard>

        <DashCard
          id="dov-actions"
          title={L("ທາງລັດ", "Quick actions")}
          description={L("ເລີ່ມວຽກໄດ້ໃນຄລິກດຽວ", "Start a task in one click")}
        >
          <QuickActions actions={quickActions} />
        </DashCard>
      </div>

      {/* 5. Recent activity + 6. Recent documents */}
      <div className="dov-grid">
        <DashCard
          id="dov-activity"
          title={L("ການເຄື່ອນໄຫວລ່າສຸດ", "Recent activity")}
        >
          <RecentActivity
            locale={locale}
            items={stats.recent_activity || []}
            emptyAction={addDocumentButton}
          />
        </DashCard>

        <DashCard
          id="dov-docs"
          className="dov-span-2"
          title={L("ເອກະສານລ່າສຸດ", "Recent documents")}
          action={
            <Link href={`/${locale}/admin/documents`} className="section-link">
              {L("ເບິ່ງທັງໝົດ", "View all")} →
            </Link>
          }
        >
          {documents ? (
            <RecentDocuments
              locale={locale}
              docs={documents}
              emptyAction={addDocumentButton}
            />
          ) : (
            <LoadingState label={t(locale, "loading")} />
          )}
        </DashCard>
      </div>

      {/* Staff access (admins and owners): the same permission management as before */}
      {isAdminPlus ? (
        <DashCard
          id="dov-staff"
          title={t(locale, "backendStaff")}
          description={L(
            "ຜູ້ທີ່ມີສິດທິເຂົ້າເຖິງ ແລະ ຈັດການຫຼັງບ້ານ",
            "Members with staff access to the admin area",
          )}
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(true)}
            >
              + {t(locale, "addBackendPermission")}
            </button>
          }
        >
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{L("ສະມາຊິກ", "Member")}</th>
                  <th>{t(locale, "backendPermission")}</th>
                  <th className="text-right">{L("ຈັດການສິດທິ", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-muted">
                      {t(locale, "noMembers")}
                    </td>
                  </tr>
                ) : (
                  staffList.map((row) => {
                    const isSelf = row.id === currentUser.id;
                    const isRowOwner = row.staff_role === "owner";
                    const canModify =
                      isAdminPlus && !isSelf && (!isRowOwner || isOwner);
                    const roleLabel =
                      row.staff_role === "owner"
                        ? t(locale, "roleOwner")
                        : row.staff_role === "admin"
                          ? t(locale, "roleAdmin")
                          : t(locale, "roleEditor");

                    return (
                      <tr key={row.id}>
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
                                  <span className="dash-tag-self">
                                    {L("ທ່ານ", "You")}
                                  </span>
                                ) : null}
                              </strong>
                              <span className="dash-user-cell-email">
                                {row.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`dash-role-chip dash-role-chip--${row.staff_role}`}
                          >
                            {roleLabel}
                          </span>
                        </td>
                        <td className="text-right">
                          {canModify ? (
                            <select
                              className="dash-table-select"
                              disabled={busyMemberId === row.id}
                              value={row.staff_role}
                              onChange={(e) =>
                                handleRoleChange(row.id, e.target.value)
                              }
                              aria-label={`${t(locale, "backendPermission")}: ${row.name || row.email}`}
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
                              {isSelf
                                ? L("ຜູ້ໃຊ້ປັດຈຸບັນ", "Current user")
                                : L("ປ້ອງກັນ", "Protected")}
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
        </DashCard>
      ) : null}

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
