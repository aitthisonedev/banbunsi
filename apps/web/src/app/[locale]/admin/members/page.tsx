"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  clientListAdminMembers,
  clientMe,
  clientPatchAdminMember,
  clientPatchAdminMemberVip,
  type AdminMember,
} from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

export default function AdminMembersPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [items, setItems] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState("");

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
    load(q).catch((err) =>
      setError(err instanceof Error ? err.message : t(locale, "loadError")),
    );
  }

  if (error && !items) return <ErrorState title={error} />;
  if (!items) return <LoadingState label={t(locale, "loading")} />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="admin-page-head">
        <div>
          <p>{t(locale, "adminMembersLead")}</p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
      ) : null}

      <form className="mb-6 flex flex-wrap gap-3" onSubmit={onSearch}>
        <input
          className="input max-w-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(locale, "search")}
        />
        <button className="btn-secondary" type="submit">
          {t(locale, "search")}
        </button>
      </form>

      <div className="surface-panel overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState title={t(locale, "noMembers")} />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t(locale, "name")}</th>
                <th>{t(locale, "staffRole")}</th>
                <th>{t(locale, "membershipLevel")}</th>
                <th>{t(locale, "accountStatus")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold">{row.name}</div>
                    <div className="text-xs text-bb-text-muted">
                      {row.email}
                    </div>
                  </td>
                  <td>
                    <select
                      className="input"
                      disabled={busyId === row.id}
                      value={row.staff_role}
                      onChange={(e) => patchRole(row.id, e.target.value)}
                    >
                      <option value="member">member</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge muted={row.membership_tier !== "vip"}>
                        {row.membership_tier}
                      </Badge>
                      {row.membership_ends_at ? (
                        <span className="text-xs text-bb-text-muted">
                          {new Date(
                            row.membership_ends_at,
                          ).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <Badge muted={row.account_status !== "active"}>
                      {row.account_status}
                    </Badge>
                  </td>
                  <td>
                    <div className="admin-actions-row justify-end">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
