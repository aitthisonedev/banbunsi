"use client";

import type { DocumentFileMeta, PublicSettings, User } from "./api";
import { translateApiError } from "./i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// The current user is requested by several components at once (admin shell + page); they share
// one request, reused for a few seconds. Any change (POST/PATCH/PUT/DELETE) clears it.
const ME_REUSE_MS = 3000;
let currentUserRequest: { promise: Promise<User>; at: number } | null = null;

/** Error with the API's message, shown in the language of the current page (/lo/… or /en/…). */
function apiError(message: string) {
  const segment =
    typeof window === "undefined" ? "" : window.location.pathname.split("/")[1];
  return new Error(translateApiError(segment === "en" ? "en" : "lo", message));
}

async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (init?.method && init.method.toUpperCase() !== "GET")
    currentUserRequest = null;
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
    throw apiError(
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

export function clientRegister({
  firstName,
  lastName,
  email,
  password,
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const first_name = firstName.trim();
  const last_name = lastName.trim();
  return clientFetch<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      first_name,
      last_name,
      name: [first_name, last_name].filter(Boolean).join(" "),
      email: email.trim(),
      password,
    }),
  });
}

export function clientLogout() {
  return clientFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function clientMe() {
  const now = Date.now();
  if (currentUserRequest && now - currentUserRequest.at < ME_REUSE_MS) {
    return currentUserRequest.promise;
  }
  const promise = clientFetch<User>("/auth/me");
  currentUserRequest = { promise, at: now };
  promise.catch(() => {
    if (currentUserRequest?.promise === promise) currentUserRequest = null;
  });
  return promise;
}

export function clientGetPublicSettings() {
  return clientFetch<PublicSettings>("/settings/public");
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
  currentUserRequest = null;
  const res = await fetch(`${API_URL}/api/v1/account/avatar`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw apiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as User;
}

export function clientDeleteAvatar() {
  return clientFetch<User>("/account/avatar", { method: "DELETE" });
}

export function clientChangePassword(
  currentPassword: string | undefined,
  newPassword: string,
) {
  return clientFetch<{ message: string }>("/account/password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword || "",
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
  return clientFetch<Record<string, unknown>>("/admin/settings");
}

export function clientPatchAdminSettings(body: Record<string, unknown>) {
  return clientFetch("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function clientUploadAdminSettingsAsset(
  kind: "logo" | "login-logo" | "system-logo" | "favicon" | "default-cover",
  file: File,
) {
  const form = new FormData();
  form.append("asset", file);
  const res = await fetch(`${API_URL}/api/v1/admin/settings/assets/${kind}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw apiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as Record<string, unknown>;
}

export function clientDeleteAdminSettingsAsset(
  kind: "logo" | "login-logo" | "system-logo" | "favicon" | "default-cover",
) {
  return clientFetch<Record<string, unknown>>(
    `/admin/settings/assets/${kind}`,
    { method: "DELETE" },
  );
}

export type DashboardDayCount = { date: string; count: number };

export type DashboardActivity = {
  type: "document" | "category" | "quiz" | "member";
  title: string;
  user?: string;
  at: string;
  link?: string;
};

export type AdminDashboard = {
  articles: number;
  documents: number;
  members: number;
  active_vip: number;
  pending_review: number;
  download_requests: number;
  users?: number;
  quizzes?: number;
  categories?: number;
  downloads?: number;
  downloads_tracked_since?: string | null;
  timezone?: string;
  series?: Partial<
    Record<
      "documents" | "users" | "vip" | "quizzes" | "downloads",
      DashboardDayCount[]
    >
  >;
  recent_activity?: DashboardActivity[];
};

export function clientGetAdminDashboard(locale?: string) {
  return clientFetch<AdminDashboard>(
    `/admin/dashboard${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`,
  );
}

export type AdminDocumentPayload = {
  document_number: string;
  category_id: string;
  cover_image_url?: string;
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
    id?: string;
    label: string;
    file_name: string;
    mime: string;
    size_bytes: number;
    language: string;
    version: string;
    download_access: string;
    sort_order: number;
    file_data?: string;
  }>;
};

export type AdminDocumentFilters = {
  q?: string;
  category?: string;
  year?: string;
  status?: string;
  updated_after?: string;
  updated_before?: string;
};

export function clientListAdminDocuments(
  locale: string,
  filters: AdminDocumentFilters = {},
) {
  const params = new URLSearchParams({ locale, per_page: "100" });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
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

export async function clientUploadAdminDocumentCover(id: string, file: File) {
  const form = new FormData();
  form.append("cover", file);
  const res = await fetch(`${API_URL}/api/v1/admin/documents/${id}/cover`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw apiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  return data as { cover_image_url: string };
}

/**
 * Streams a document file to the API as multipart form data (no base64), reporting progress
 * from 0 to 100. Pass `file_id` to replace an existing file instead of adding one.
 */
export function clientUploadAdminDocumentFile(
  documentId: string,
  file: File,
  meta: {
    file_id?: string;
    label?: string;
    version?: string;
    download_access?: string;
    language?: string;
  },
  onProgress?: (percent: number) => void,
) {
  const form = new FormData();
  for (const [key, value] of Object.entries(meta)) {
    if (value) form.append(key, value);
  }
  form.append("file", file);
  return new Promise<DocumentFileMeta>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/v1/admin/documents/${documentId}/files`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: { error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        // Non-JSON error pages (e.g. a proxy rejecting the size) fall through to the status message.
      }
      if (xhr.status >= 200 && xhr.status < 300)
        return resolve(data as DocumentFileMeta);
      if (xhr.status === 413 && !data.error)
        return reject(
          apiError("The file is too large for the server to accept."),
        );
      reject(apiError(data.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () =>
      reject(
        apiError(
          "Network error during upload. Check your connection and try again.",
        ),
      );
    xhr.onabort = () => reject(apiError("Upload cancelled."));
    xhr.send(form);
  });
}

export function clientDeleteAdminDocumentCover(id: string) {
  return clientFetch<{ cover_image_url: string }>(
    `/admin/documents/${id}/cover`,
    { method: "DELETE" },
  );
}

export function clientDeleteAdminDocumentFile(
  documentId: string,
  fileId: string,
) {
  return clientFetch<{ message: string }>(
    `/admin/documents/${documentId}/files/${fileId}`,
    { method: "DELETE" },
  );
}

export type AdminCategoryTranslation = {
  locale: string;
  name: string;
  description: string;
  slug: string;
  seo_title?: string;
};

export type AdminCategoryPayload = {
  code: string;
  sort_order: number;
  is_active: boolean;
  translations: AdminCategoryTranslation[];
};

export type AdminCategory = AdminCategoryPayload & {
  id: string;
};

export function clientListAdminCategories(locale: string) {
  return clientFetch<{
    items: Array<{
      id: string;
      code: string;
      slug: string;
      name: string;
      description: string;
      sort_order: number;
      is_active: boolean;
      children: Array<Record<string, unknown>>;
    }>;
  }>(`/admin/categories?locale=${locale}`);
}

export function clientGetAdminCategory(id: string) {
  return clientFetch<AdminCategory>(`/admin/categories/${id}`);
}

export function clientCreateAdminCategory(body: AdminCategoryPayload) {
  return clientFetch<AdminCategory>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function clientUpdateAdminCategory(
  id: string,
  body: AdminCategoryPayload,
) {
  return clientFetch<AdminCategory>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clientDeleteAdminCategory(id: string) {
  return clientFetch<{ message: string }>(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export type AdminQuizTranslation = {
  locale: string;
  title: string;
  description: string;
  category: string;
  slug: string;
};

export type AdminQuizQuestion = {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correct_option_id: string;
  explanation: string;
};

export type AdminQuizPayload = {
  code: string;
  difficulty: string;
  pass_percent: number;
  sort_order: number;
  is_published: boolean;
  questions: Record<string, AdminQuizQuestion[]>;
  translations: AdminQuizTranslation[];
};

export type AdminQuiz = AdminQuizPayload & { id: string };

export function clientListAdminQuizzes(locale: string) {
  return clientFetch<{
    items: Array<{
      id: string;
      code: string;
      title: string;
      slug: string;
      difficulty: string;
      pass_percent: number;
      sort_order: number;
      is_published: boolean;
      question_count: number;
    }>;
  }>(`/admin/quizzes?locale=${locale}`);
}

export function clientGetAdminQuiz(id: string) {
  return clientFetch<AdminQuiz>(`/admin/quizzes/${id}`);
}

export function clientCreateAdminQuiz(body: AdminQuizPayload) {
  return clientFetch<AdminQuiz>("/admin/quizzes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function clientUpdateAdminQuiz(id: string, body: AdminQuizPayload) {
  return clientFetch<AdminQuiz>(`/admin/quizzes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clientDeleteAdminQuiz(id: string) {
  return clientFetch<{ message: string }>(`/admin/quizzes/${id}`, {
    method: "DELETE",
  });
}

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  staff_role: string;
  account_status: string;
  email_verified?: boolean;
  membership_tier: string;
  membership_ends_at?: string | null;
  created_at?: string;
};

export function clientListAdminMembers(q = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const qs = params.toString();
  return clientFetch<{ items: AdminMember[] }>(
    `/admin/members${qs ? `?${qs}` : ""}`,
  );
}

export function clientPatchAdminMember(
  id: string,
  body: { staff_role?: string; account_status?: string },
) {
  return clientFetch<AdminMember>(`/admin/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function clientPatchAdminMemberVip(
  id: string,
  body: {
    action: "approve" | "renew" | "cancel";
    starts_at?: string;
    ends_at?: string;
    notes?: string;
  },
) {
  return clientFetch<{
    id: string;
    membership_tier: string;
    membership_ends_at?: string | null;
  }>(`/admin/members/${id}/vip`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function clientUnlinkGoogle() {
  return clientFetch<User>("/account/unlink-google", {
    method: "POST",
  });
}

export function getGoogleAuthUrl(
  mode: "login" | "register" | "link" = "login",
  next?: string,
  locale?: string,
) {
  const params = new URLSearchParams();
  params.set("mode", mode);
  if (next) params.set("next", next);
  if (locale) params.set("locale", locale);
  return `${API_URL}/api/v1/auth/google?${params.toString()}`;
}

export function clientGoogleDevCallback(body: {
  state?: string;
  email: string;
  name: string;
  sub?: string;
  picture?: string;
}) {
  return clientFetch<void>("/auth/google/dev-callback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type DownloadHistoryItem = {
  at: string;
  file_id: string;
  file_label: string;
  file_name: string;
  document_title: string;
  /** Empty when the document is no longer published. */
  document_slug: string;
  document_number: string;
};

export type QuizHistoryItem = {
  at: string;
  quiz_title: string;
  /** Empty when the quiz is no longer published. */
  quiz_slug: string;
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
};

/** The signed-in user's recent downloads, newest first. */
export function clientAccountDownloads(locale: string) {
  return clientFetch<{ items: DownloadHistoryItem[] }>(
    `/account/downloads?locale=${locale}`,
  );
}

/** The signed-in user's recent quiz results, newest first. */
export function clientAccountQuizHistory(locale: string) {
  return clientFetch<{ items: QuizHistoryItem[] }>(
    `/account/quiz-history?locale=${locale}`,
  );
}

export type FavoriteItem = {
  at: string;
  document_id: string;
  document_title: string;
  /** Empty when the document is no longer published. */
  document_slug: string;
  document_number: string;
};

/** The signed-in user's saved documents, newest first. */
export function clientAccountFavorites(locale: string) {
  return clientFetch<{ items: FavoriteItem[] }>(
    `/account/favorites?locale=${locale}`,
  );
}

/** Save a published document to the signed-in user's favorites. */
export function clientAddFavorite(documentId: string) {
  return clientFetch<{ favorited: boolean }>(
    `/account/favorites/${encodeURIComponent(documentId)}`,
    { method: "POST" },
  );
}

/** Remove a document from the signed-in user's favorites. */
export function clientRemoveFavorite(documentId: string) {
  return clientFetch<{ favorited: boolean }>(
    `/account/favorites/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );
}
