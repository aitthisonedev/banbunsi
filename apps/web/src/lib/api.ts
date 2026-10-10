const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export type Locale = "lo" | "en";

export type PublicSettings = {
  site_name_lo: string;
  site_name_en: string;
  timezone: string;
  contact_email: string;
  whatsapp_number: string;
  facebook_url: string;
  tiktok_url: string;
  default_meta_description_lo: string;
  default_meta_description_en: string;
};

export type CategoryNode = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  children: CategoryNode[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  staff_role: "member" | "editor" | "admin" | "owner";
  account_status: "active" | "suspended";
  membership_tier: "member" | "vip" | "none";
};

export function whatsappLink(e164: string) {
  const digits = e164.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { cookie?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.cookie) {
    headers.set("Cookie", init.cookie);
  }
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getPublicSettings() {
  return apiFetch<PublicSettings>("/settings/public");
}

export function getCategories(locale: Locale) {
  return apiFetch<{ items: CategoryNode[] }>(`/categories?locale=${locale}`);
}

export function login(email: string, password: string) {
  return apiFetch<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetch<User>("/auth/me");
}

export function verifyEmail(token: string) {
  return apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function getAdminDashboard() {
  return apiFetch<{
    articles: number;
    documents: number;
    members: number;
    active_vip: number;
    pending_review: number;
    download_requests: number;
  }>("/admin/dashboard");
}

export function getAdminSettings() {
  return apiFetch<
    PublicSettings & {
      default_seo_title_lo: string;
      default_seo_title_en: string;
    }
  >("/admin/settings");
}

export function patchAdminSettings(body: Record<string, string>) {
  return apiFetch("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getAdminCategories(locale: Locale) {
  return apiFetch<{ items: CategoryNode[] }>(
    `/admin/categories?locale=${locale}`,
  );
}
