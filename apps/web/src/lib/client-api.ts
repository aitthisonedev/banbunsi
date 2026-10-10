"use client";

import type { User } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
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
