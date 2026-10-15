"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  clientPatchAdminMemberVip,
  type AdminMember,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";
import { MemberAvatar } from "@/components/member-avatar";
import { Select } from "@/components/ui/select";
import { btn } from "@/components/admin-documents-ui";
import { AdminPagination, usePagination } from "@/components/admin-pagination";
import type { Locale } from "@/lib/api";
import { formatDate } from "@/lib/dashboard-stats";

// Dictionary keys for the API's membership tiers and account statuses (apps/api models.go).
const TIER_LABEL: Record<string, string> = {
  member: "badgeMember",
  vip: "badgeVip",
};
const STATUS_LABEL: Record<string, string> = {
  active: "active",
  suspended: "accountSuspended",
};

/** Label for a known code in the page language; an unknown code is shown as sent. */
function codeLabel(
  locale: Locale,
  labels: Record<string, string>,
  code: string,
) {
  return labels[code] ? t(locale, labels[code]) : code;
}

type MemberFilter = "all" | "staff" | "vip";
type MemberSort = "newest" | "oldest" | "name-asc" | "name-desc";

// Labels are dictionary keys, translated when rendered.
const FILTER_TABS: Array<{ value: MemberFilter; label: string }> = [
  { value: "all", label: "allMembers" },
  { value: "staff", label: "staffOnly" },
  { value: "vip", label: "vipOnly" },
];
const SORT_OPTIONS: Array<{ value: MemberSort; label: string }> = [
  { value: "newest", label: "sortNewest" },
  { value: "oldest", label: "sortOldest" },
  { value: "name-asc", label: "sortNameAsc" },
  { value: "name-desc", label: "sortNameDesc" },
];

/** Orders the loaded members by join date (created_at) or name; returns a new array. */
function sortMembers(rows: AdminMember[], sort: MemberSort, locale: Locale) {
  const joined = (row: AdminMember) =>
    row.created_at ? new Date(row.created_at).getTime() : 0;
  const name = (row: AdminMember) => (row.name || row.email || "").trim();
  return [...rows].sort((a, b) => {
    if (sort === "oldest") return joined(a) - joined(b);
    if (sort === "newest") return joined(b) - joined(a);
    const order = name(a).localeCompare(name(b), locale, {
      sensitivity: "base",
      numeric: true,
    });
    return sort === "name-asc" ? order : -order;
  });
}

/** Most users the members API returns in one list (apps/api admin_members.go). */
const MEMBER_LIST_LIMIT = 200;

export default function AdminMembersPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const roleOptions = [
    { value: "member", label: t(locale, "roleMember") },
    { value: "editor", label: t(locale, "roleEditor") },
    { value: "admin", label: t(locale, "roleAdmin") },
    { value: "owner", label: t(locale, "roleOwner") },
  ];
  const [items, setItems] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  // The search that produced the current list (q is only what is being typed).
  const [searched, setSearched] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [sort, setSort] = useState<MemberSort>("newest");

  async function load(query = q) {
    const data = await clientListAdminMembers(query);
    setItems(data.items);
  }

  useEffect(() => {
    clientMe()
      .then(async (u) => {
        if (!["admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}/admin`);
          return;
        }
        await load("");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t(locale, "loadError")),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  async function patchRole(id: string, staff_role: string) {
    setBusyId(id);
    setError("");
    try {
      await clientPatchAdminMember(id, { staff_role });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusyId("");
    }
  }

  async function patchStatus(id: string, account_status: string) {
    setBusyId(id);
    setError("");
    try {
      await clientPatchAdminMember(id, { account_status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusyId("");
    }
  }

  async function patchVip(id: string, action: "approve" | "renew" | "cancel") {
    setBusyId(id);
    setError("");
    try {
      const ends = new Date();
      ends.setFullYear(ends.getFullYear() + 1);
      await clientPatchAdminMemberVip(id, {
        action,
        ends_at: action === "cancel" ? undefined : ends.toISOString(),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setBusyId("");
    }
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    pager.setPage(1);
    setSearched(q.trim());
    load(q).catch((err) =>
      setError(err instanceof Error ? err.message : t(locale, "loadError")),
    );
  }

  // Before the early returns: hooks must run on every render.
  const visible = sortMembers(
    (items || []).filter((row) =>
      filter === "staff"
        ? row.staff_role !== "member"
        : filter === "vip"
          ? row.membership_tier === "vip"
          : true,
    ),
    sort,
    locale,
  );
  const pager = usePagination(visible);
  const listTop = useRef<HTMLDivElement>(null);

  if (error && !items) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  // Counts what is listed: all users, staff only, or search results. The API returns at most
  // MEMBER_LIST_LIMIT users and no total, so a full list is shown as "200+".
  const countKey = searched
    ? "memberFoundCount"
    : filter === "staff"
      ? "staffCount"
      : filter === "vip"
        ? "vipCount"
        : "memberCount";
  const countLabel = t(
    locale,
    `${countKey}${visible.length === 1 ? "One" : ""}`,
    {
      count:
        items.length >= MEMBER_LIST_LIMIT && filter === "all"
          ? `${MEMBER_LIST_LIMIT}+`
          : visible.length,
    },
  );

  return (
    <div className="w-full">
      <div className="admin-page-head">
        <div>
          <h1 className="text-2xl font-bold">{t(locale, "adminMembers")}</h1>
          <p>{t(locale, "adminMembersLead")}</p>
        </div>
        <span className="admin-count-pill" aria-live="polite">
          {countLabel}
        </span>
      </div>

      <section
        className="admin-perm-legend"
        aria-label={t(locale, "staffAccess")}
      >
        <h2>{t(locale, "staffAccess")}</h2>
        <p>{t(locale, "staffAccessLead")}</p>
        <ul className="admin-perm-grid">
          <li>
            <strong>editor</strong>
            <span>{t(locale, "roleEditorDesc")}</span>
          </li>
          <li>
            <strong>admin</strong>
            <span>{t(locale, "roleAdminDesc")}</span>
          </li>
          <li>
            <strong>owner</strong>
            <span>{t(locale, "roleOwnerDesc")}</span>
          </li>
        </ul>
      </section>

      {error ? (
        <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
      ) : null}

      <div className="admin-toolbar">
        <form className="admin-toolbar-search" onSubmit={onSearch}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(locale, "search")}
          />
          <button className="btn-secondary" type="submit">
            {t(locale, "search")}
          </button>
        </form>
        <div className="admin-toolbar-controls">
          <div className="admin-filter-tabs" role="tablist">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={`admin-filter-tab${filter === tab.value ? " is-active" : ""}`}
                onClick={() => {
                  setFilter(tab.value);
                  pager.setPage(1);
                }}
              >
                {t(locale, tab.label)}
              </button>
            ))}
          </div>
          <div className="admin-sort">
            <Select
              aria-label={t(locale, "sortBy")}
              value={sort}
              onChange={(value) => {
                setSort(value as MemberSort);
                pager.setPage(1);
              }}
              options={SORT_OPTIONS.map((option) => ({
                value: option.value,
                label: `${t(locale, "sortBy")}: ${t(locale, option.label)}`,
              }))}
            />
          </div>
        </div>
      </div>

      <div ref={listTop} className="admin-member-list">
        {visible.length === 0 ? (
          <EmptyState title={t(locale, "noMembers")} />
        ) : (
          pager.rows.map((row, index) => {
            return (
              <article key={row.id} className="admin-member-card">
                <div className="admin-member-identity">
                  {/* Position in the filtered list (not the database id), continuing across pages. */}
                  <span
                    className="admin-member-number"
                    title={t(locale, "rowNumber")}
                  >
                    {pager.offset + index + 1}
                  </span>
                  <span className="admin-profile-avatar">
                    <MemberAvatar avatarUrl={row.avatar_url} size={44} />
                  </span>
                  <div className="admin-member-text">
                    {/* Compact: badges only for states that stand out (VIP, suspended); the
                        default member/active states need no badge. */}
                    <div className="admin-member-name">
                      <h3>{row.name}</h3>
                      {row.membership_tier === "vip" ? (
                        <Badge>
                          {codeLabel(locale, TIER_LABEL, row.membership_tier)}
                        </Badge>
                      ) : null}
                      {row.account_status !== "active" ? (
                        <Badge muted>
                          {codeLabel(locale, STATUS_LABEL, row.account_status)}
                        </Badge>
                      ) : null}
                    </div>
                    <p>
                      {row.email}
                      {row.created_at ? (
                        <span className="admin-member-joined">
                          {" · "}
                          {t(locale, "joinedOn", {
                            date: formatDate(locale, row.created_at),
                          })}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="admin-member-role">
                  <span>{t(locale, "backendPermission")}</span>
                  <Select
                    aria-label={`${t(locale, "backendPermission")}: ${row.name}`}
                    disabled={busyId === row.id}
                    value={row.staff_role}
                    onChange={(value) => patchRole(row.id, value)}
                    searchable
                    searchPlaceholder={t(locale, "selectSearch")}
                    noResultsText={t(locale, "selectNoResults")}
                    options={roleOptions}
                  />
                </div>

                {/* VIP actions first; the account action (suspend/activate) always sits last. */}
                <div className="admin-member-actions">
                  {row.membership_tier === "vip" ? (
                    <>
                      <button
                        type="button"
                        className={btn.secondarySm}
                        disabled={busyId === row.id}
                        onClick={() => patchVip(row.id, "renew")}
                      >
                        {t(locale, "renewVip")}
                      </button>
                      <button
                        type="button"
                        className={btn.dangerOutlineSm}
                        disabled={busyId === row.id}
                        onClick={() => patchVip(row.id, "cancel")}
                      >
                        {t(locale, "cancelVip")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={btn.secondarySm}
                      disabled={busyId === row.id}
                      onClick={() => patchVip(row.id, "approve")}
                    >
                      {t(locale, "approveVip")}
                    </button>
                  )}
                  {row.account_status === "active" ? (
                    <button
                      type="button"
                      className={btn.dangerOutlineSm}
                      disabled={busyId === row.id}
                      onClick={() => patchStatus(row.id, "suspended")}
                    >
                      {t(locale, "suspend")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={btn.secondarySm}
                      disabled={busyId === row.id}
                      onClick={() => patchStatus(row.id, "active")}
                    >
                      {t(locale, "activateAccount")}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
      <AdminPagination
        locale={locale}
        page={pager.page}
        pageCount={pager.pageCount}
        total={pager.total}
        onPageChange={pager.setPage}
        scrollTarget={listTop}
        className="mt-2"
      />
    </div>
  );
}
