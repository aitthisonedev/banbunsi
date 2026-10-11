"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  avatarSrc,
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  clientPatchAdminMemberVip,
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

export default function AdminMembersPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [items, setItems] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<"all" | "staff">("all");

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

  async function patchVip(
    id: string,
    action: "approve" | "renew" | "cancel",
  ) {
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
    load(q).catch((err) =>
      setError(err instanceof Error ? err.message : t(locale, "loadError")),
    );
  }

  if (error && !items) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  const visible = items.filter((row) =>
    filter === "staff" ? row.staff_role !== "member" : true,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="admin-page-head">
        <div>
          <p>{t(locale, "adminMembersLead")}</p>
        </div>
      </div>

      <section className="admin-perm-legend" aria-label={t(locale, "staffAccess")}>
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
        <div className="admin-filter-tabs" role="tablist">
          <button
            type="button"
            className={`admin-filter-tab${filter === "all" ? " is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t(locale, "allMembers")}
          </button>
          <button
            type="button"
            className={`admin-filter-tab${filter === "staff" ? " is-active" : ""}`}
            onClick={() => setFilter("staff")}
          >
            {t(locale, "staffOnly")}
          </button>
        </div>
      </div>

      <div className="admin-member-list">
        {visible.length === 0 ? (
          <EmptyState title={t(locale, "noMembers")} />
        ) : (
          visible.map((row) => {
            const photo = avatarSrc(row.avatar_url);
            return (
              <article key={row.id} className="admin-member-card">
                <div className="admin-member-identity">
                  <span className="admin-profile-avatar">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        width={44}
                        height={44}
                        className="admin-profile-avatar-img"
                      />
                    ) : (
                      <span className="admin-profile-avatar-initials">
                        {memberInitials(row.name, row.email)}
                      </span>
                    )}
                  </span>
                  <div>
                    <h3>{row.name}</h3>
                    <p>{row.email}</p>
                    <div className="admin-member-badges">
                      <Badge muted={row.membership_tier !== "vip"}>
                        {row.membership_tier}
                      </Badge>
                      <Badge muted={row.account_status !== "active"}>
                        {row.account_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <label className="admin-member-role">
                  <span>{t(locale, "backendPermission")}</span>
                  <select
                    className="input"
                    disabled={busyId === row.id}
                    value={row.staff_role}
                    onChange={(e) => patchRole(row.id, e.target.value)}
                  >
                    <option value="member">{t(locale, "roleMember")}</option>
                    <option value="editor">{t(locale, "roleEditor")}</option>
                    <option value="admin">{t(locale, "roleAdmin")}</option>
                    <option value="owner">{t(locale, "roleOwner")}</option>
                  </select>
                </label>

                <div className="admin-actions-row">
                  {row.account_status === "active" ? (
                    <button
                      type="button"
                      className="admin-danger"
                      disabled={busyId === row.id}
                      onClick={() => patchStatus(row.id, "suspended")}
                    >
                      {t(locale, "suspend")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="section-link"
                      disabled={busyId === row.id}
                      onClick={() => patchStatus(row.id, "active")}
                    >
                      {t(locale, "activateAccount")}
                    </button>
                  )}
                  {row.membership_tier === "vip" ? (
                    <>
                      <button
                        type="button"
                        className="section-link"
                        disabled={busyId === row.id}
                        onClick={() => patchVip(row.id, "renew")}
                      >
                        {t(locale, "renewVip")}
                      </button>
                      <button
                        type="button"
                        className="admin-danger"
                        disabled={busyId === row.id}
                        onClick={() => patchVip(row.id, "cancel")}
                      >
                        {t(locale, "cancelVip")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="section-link"
                      disabled={busyId === row.id}
                      onClick={() => patchVip(row.id, "approve")}
                    >
                      {t(locale, "approveVip")}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
