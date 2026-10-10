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

export type DocumentFileMeta = {
  id: string;
  label: string;
  file_name: string;
  mime: string;
  size_bytes: number;
  language: string;
  version: string;
  download_access: "member" | "vip";
  sort_order: number;
};

export type DocumentListItem = {
  id: string;
  document_number: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  read_access: "public" | "member" | "vip";
  status: "draft" | "published" | "archived";
  year: number;
  tags: string;
  published_at?: string | null;
  effective_date?: string | null;
  updated_at?: string;
  title: string;
  slug: string;
  summary: string;
  body_html?: string;
  body_available?: boolean;
  seo_title?: string;
  seo_description?: string;
  files: DocumentFileMeta[];
  translations?: Array<{
    locale: string;
    title: string;
    slug: string;
    summary: string;
    body_html: string;
    seo_title?: string;
    seo_description?: string;
  }>;
};

export type DocumentListResponse = {
  items: DocumentListItem[];
  total: number;
  page: number;
  per_page: number;
};

export function getDocuments(
  locale: Locale,
  opts?: {
    q?: string;
    category?: string;
    year?: number;
    page?: number;
    per_page?: number;
  },
) {
  const params = new URLSearchParams({ locale });
  if (opts?.q) params.set("q", opts.q);
  if (opts?.category) params.set("category", opts.category);
  if (opts?.year) params.set("year", String(opts.year));
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.per_page) params.set("per_page", String(opts.per_page));
  return apiFetch<DocumentListResponse>(`/documents?${params}`);
}

export function getDocument(
  locale: Locale,
  slug: string,
  opts?: { cookie?: string },
) {
  return apiFetch<DocumentListItem>(
    `/documents/${encodeURIComponent(slug)}?locale=${locale}`,
    { cookie: opts?.cookie },
  );
}

export type QuizListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | string;
  pass_percent: number;
  question_count: number;
};

export type QuizDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  pass_percent: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

export type QuizSubmitResult = {
  slug: string;
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  pass_percent: number;
  details: Array<{
    question_id: string;
    prompt: string;
    selected_id: string;
    correct_id: string;
    is_correct: boolean;
    explanation: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

export function getQuizzes(locale: Locale) {
  return apiFetch<{ items: QuizListItem[] }>(`/quizzes?locale=${locale}`);
}

export function getQuiz(locale: Locale, slug: string) {
  return apiFetch<QuizDetail>(
    `/quizzes/${encodeURIComponent(slug)}?locale=${locale}`,
  );
}

export function submitQuiz(
  locale: Locale,
  slug: string,
  answers: Record<string, string>,
) {
  return apiFetch<QuizSubmitResult>(
    `/quizzes/${encodeURIComponent(slug)}/submit?locale=${locale}`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
  );
}
