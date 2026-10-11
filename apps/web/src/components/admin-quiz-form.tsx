"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, SuccessBanner } from "@/components/ui";
import type { AdminQuiz, AdminQuizPayload } from "@/lib/client-api";
import { clientCreateAdminQuiz, clientUpdateAdminQuiz } from "@/lib/client-api";
import type { Locale } from "@/lib/api";
import { t } from "@/lib/i18n";

const SAMPLE_QUESTIONS = {
  lo: [
    {
      id: "q1",
      prompt: "Sample question (Lao)",
      options: [
        { id: "a", label: "Option A" },
        { id: "b", label: "Option B" },
      ],
      correct_option_id: "a",
      explanation: "Explanation",
    },
  ],
  en: [
    {
      id: "q1",
      prompt: "Sample question",
      options: [
        { id: "a", label: "Option A" },
        { id: "b", label: "Option B" },
      ],
      correct_option_id: "a",
      explanation: "Explanation",
    },
  ],
};

function emptyPayload(): AdminQuizPayload {
  return {
    code: "",
    difficulty: "easy",
    pass_percent: 60,
    sort_order: 0,
    is_published: false,
    questions: SAMPLE_QUESTIONS,
    translations: [
      {
        locale: "lo",
        title: "",
        description: "",
        category: "",
        slug: "",
      },
      {
        locale: "en",
        title: "",
        description: "",
        category: "",
        slug: "",
      },
    ],
  };
}

function fromQuiz(quiz: AdminQuiz): AdminQuizPayload {
  const byLocale = Object.fromEntries(
    quiz.translations.map((tr) => [tr.locale, tr]),
  );
  return {
    code: quiz.code,
    difficulty: quiz.difficulty || "easy",
    pass_percent: quiz.pass_percent || 60,
    sort_order: quiz.sort_order || 0,
    is_published: !!quiz.is_published,
    questions: quiz.questions || { lo: [], en: [] },
    translations: (["lo", "en"] as const).map((locale) => ({
      locale,
      title: byLocale[locale]?.title || "",
      description: byLocale[locale]?.description || "",
      category: byLocale[locale]?.category || "",
      slug: byLocale[locale]?.slug || "",
    })),
  };
}

export function AdminQuizForm({
  locale,
  initial,
  canPublish,
}: {
  locale: Locale;
  initial?: AdminQuiz;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminQuizPayload>(
    initial ? fromQuiz(initial) : emptyPayload(),
  );
  const [questionsText, setQuestionsText] = useState(
    JSON.stringify(initial?.questions || SAMPLE_QUESTIONS, null, 2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    let questions: AdminQuizPayload["questions"];
    try {
      questions = JSON.parse(questionsText) as AdminQuizPayload["questions"];
    } catch {
      setError("Invalid questions JSON");
      setLoading(false);
      return;
    }
    const body: AdminQuizPayload = {
      ...form,
      questions,
      is_published: canPublish ? form.is_published : false,
    };
    try {
      if (initial) {
        await clientUpdateAdminQuiz(initial.id, body);
        setMessage(t(locale, "saved"));
      } else {
        const created = await clientCreateAdminQuiz(body);
        router.push(`/${locale}/admin/quizzes/${created.id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "loadError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="admin-form-grid cols-2">
        <FormField label={t(locale, "quizCode")}>
          <input
            className="input"
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
        </FormField>
        <FormField label={t(locale, "difficulty")}>
          <select
            className="input"
            value={form.difficulty}
            onChange={(e) =>
              setForm((f) => ({ ...f, difficulty: e.target.value }))
            }
          >
            <option value="easy">{t(locale, "easy")}</option>
            <option value="medium">{t(locale, "medium")}</option>
            <option value="hard">{t(locale, "hard")}</option>
          </select>
        </FormField>
        <FormField label={t(locale, "passPercent")}>
          <input
            className="input"
            type="number"
            min={1}
            max={100}
            value={form.pass_percent}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                pass_percent: Number(e.target.value) || 60,
              }))
            }
          />
        </FormField>
        <FormField label={t(locale, "sortOrder")}>
          <input
            className="input"
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
            }
          />
        </FormField>
      </div>

      {canPublish ? (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_published: e.target.checked }))
            }
          />
          {t(locale, "published")}
        </label>
      ) : (
        <p className="text-sm text-bb-text-muted">{t(locale, "draft")}</p>
      )}

      {form.translations.map((tr, idx) => (
        <div key={tr.locale} className="admin-locale-block">
          <h3>{tr.locale.toUpperCase()}</h3>
          <FormField label={t(locale, "title")}>
            <input
              className="input"
              required
              value={tr.title}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = { ...translations[idx], title: value };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "slug")}>
            <input
              className="input"
              required
              value={tr.slug}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = { ...translations[idx], slug: value };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "categories")}>
            <input
              className="input"
              value={tr.category}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = {
                    ...translations[idx],
                    category: value,
                  };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
          <FormField label={t(locale, "description")}>
            <textarea
              className="input"
              rows={3}
              value={tr.description}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => {
                  const translations = [...f.translations];
                  translations[idx] = {
                    ...translations[idx],
                    description: value,
                  };
                  return { ...f, translations };
                });
              }}
            />
          </FormField>
        </div>
      ))}

      <FormField label={t(locale, "questionsJson")}>
        <textarea
          className="input font-mono text-sm"
          rows={16}
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          spellCheck={false}
        />
      </FormField>

      <div className="admin-actions-row">
        <button className="btn-primary" type="submit" disabled={loading}>
          {t(locale, "save")}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push(`/${locale}/admin/quizzes`)}
        >
          {t(locale, "cancel")}
        </button>
      </div>
    </form>
  );
}
