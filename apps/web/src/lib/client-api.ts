"use client";

import type { User } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export function clientLogin(email: string, password: string) {
  return clientFetch<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function clientRegister(name: string, email: string, password: string) {
  return clientFetch<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function clientLogout() {
  return clientFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function clientMe() {
  return clientFetch<User>("/auth/me");
}

export function clientUpdateProfile(body: {
  first_name: string;
  last_name: string;
  phone: string;
}) {
  return clientFetch<User>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function clientUploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const res = await fetch(`${API_URL}/api/v1/account/avatar`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as User;
}

export function clientDeleteAvatar() {
  return clientFetch<User>("/account/avatar", { method: "DELETE" });
}

export function clientChangePassword(currentPassword: string, newPassword: string) {
  return clientFetch<{ message: string }>("/account/password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function avatarSrc(avatarUrl: string | undefined | null) {
  if (!avatarUrl) return "";
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return `${API_URL}${avatarUrl}`;
}

export function clientVerifyEmail(token: string) {
  return clientFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function clientForgotPassword(email: string) {
  return clientFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function clientResetPassword(token: string, password: string) {
  return clientFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function clientGetAdminSettings() {
  return clientFetch<Record<string, string>>("/admin/settings");
}

export function clientPatchAdminSettings(body: Record<string, string>) {
  return clientFetch("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clientGetAdminDashboard() {
  return clientFetch<{
    articles: number;
    documents: number;
    members: number;
    active_vip: number;
    pending_review: number;
    download_requests: number;
  }>("/admin/dashboard");
}

export type AdminDocumentPayload = {
  document_number: string;
  category_id: string;
  read_access: string;
  status: string;
  effective_date?: string | null;
  year: number;
  tags: string;
  translations: Array<{
    locale: string;
    title: string;
    slug: string;
    summary: string;
    body_html: string;
    seo_title?: string;
    seo_description?: string;
  }>;
  /** Omit on update to leave existing files unchanged. Never send [] unless clearing. */
  files?: Array<{
    label: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    language: string;
    version: string;
    download_access: string;
    sort_order: number;
  }>;
};

export function clientListAdminDocuments(locale: string, q = "") {
  const params = new URLSearchParams({ locale, per_page: "100" });
  if (q) params.set("q", q);
  return clientFetch<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/admin/documents?${params}`);
}

export function clientGetAdminDocument(id: string, locale: string) {
  return clientFetch<Record<string, unknown>>(
    `/admin/documents/${id}?locale=${locale}`,
  );
}

export function clientCreateAdminDocument(body: AdminDocumentPayload) {
  return clientFetch<Record<string, unknown>>("/admin/documents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function clientUpdateAdminDocument(
  id: string,
  body: AdminDocumentPayload,
) {
  return clientFetch<Record<string, unknown>>(`/admin/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clientDeleteAdminDocument(id: string) {
  return clientFetch<{ message: string }>(`/admin/documents/${id}`, {
    method: "DELETE",
  });
}
