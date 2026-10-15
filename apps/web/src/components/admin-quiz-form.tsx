"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, SuccessBanner } from "@/components/ui";
import type { AdminQuiz, AdminQuizPayload } from "@/lib/client-api";
import { clientCreateAdminQuiz, clientUpdateAdminQuiz } from "@/lib/client-api";
import type { Locale } from "@/lib/api";
import { slugsFromNames } from "@/lib/form-defaults";
import { t } from "@/lib/i18n";
import {
  cleanQuestions,
  questionErrors,
  QuizQuestionsEditor,
} from "@/components/quiz-questions-editor";

/** Guidance shown with each part of the form, in the admin's language. */
const GUIDE = {
  lo: {
    settings: "ການຕັ້ງຄ່າແບບທົດສອບ",
    settingsIntro:
      "ຄ່າເລີ່ມຕົ້ນຖືກຕື່ມໃຫ້ແລ້ວ: ລະດັບງ່າຍ, ຜ່ານ 60% ແລະ ລຳດັບຕໍ່ຈາກແບບທົດສອບທີ່ມີ.",
    code: "ລະຫັດພາຍໃນ (ໂຕພິມນ້ອຍ, ບໍ່ມີຍະຫວ່າງ). ຕື່ມໃຫ້ຈາກຊື່ພາສາອັງກິດ.",
    difficulty: "ຊ່ວຍໃຫ້ຜູ້ໃຊ້ເລືອກແບບທົດສອບທີ່ເໝາະສົມ.",
    pass: "ເປີເຊັນຄຳຕອບຖືກທີ່ຕ້ອງການເພື່ອຜ່ານ (ແນະນຳ 60–80%).",
    sort: "ເລກນ້ອຍສະແດງກ່ອນ. ແບບທົດສອບໃໝ່ຖືກວາງໄວ້ທ້າຍສຸດ.",
    published: "ສະແດງໃນເວັບໄຊ. ປ່ອຍວ່າງໄວ້ຈົນກວ່າຄຳຖາມຈະພ້ອມ.",
    draftOnly: "ຜູ້ດູແລລະບົບຈະເຜີຍແຜ່ເມື່ອພ້ອມ.",
    blockIntro: "ຂໍ້ມູນທີ່ຜູ້ໃຊ້ເຫັນໃນພາສານີ້.",
    title: "ຊື່ທີ່ສັ້ນ ແລະ ຊັດເຈນ ທີ່ສະແດງໃນລາຍການແບບທົດສອບ.",
    titlePlaceholder: { lo: "ເຊັ່ນ: ພື້ນຖານພາສີ", en: "e.g. Tax basics" },
    slug: "ສ່ວນຂອງທີ່ຢູ່ເວັບ. ຕື່ມໃຫ້ຈາກຊື່; ໃຊ້ໂຕອັກສອນ, ຕົວເລກ ແລະ ຂີດ (-).",
    category: "ປ້າຍຫົວຂໍ້ທີ່ສະແດງເທິງບັດແບບທົດສອບ.",
    categoryPlaceholder: { lo: "ເຊັ່ນ: ພາສີ", en: "e.g. Tax" },
    description: "1–2 ປະໂຫຍກ: ແບບທົດສອບນີ້ກວດສອບຄວາມຮູ້ຫຍັງ.",
    descriptionPlaceholder: {
      lo: "ເຊັ່ນ: ຄຳຖາມພື້ນຖານກ່ຽວກັບປະເພດພາສີ ແລະ ການແຈ້ງພາສີ.",
      en: "e.g. Basic questions about tax types and filing.",
    },
    langName: { lo: "ພາສາລາວ", en: "ພາສາອັງກິດ" },
  },
  en: {
    settings: "Quiz settings",
    settingsIntro:
      "Defaults are filled in: Easy, 60% to pass, and placed after the existing quizzes.",
    code: "Internal identifier (lowercase, no spaces). Filled from the English title.",
    difficulty: "Helps users pick a quiz at the right level.",
    pass: "Percentage of correct answers needed to pass (60–80% is typical).",
    sort: "Lower numbers appear first. New quizzes are placed last.",
    published:
      "Show on the website. Leave unticked until the questions are ready.",
    draftOnly: "An admin publishes it when it is ready.",
    blockIntro: "What users see in this language.",
    title: "A short, clear title shown in the quiz list.",
    titlePlaceholder: { lo: "ເຊັ່ນ: ພື້ນຖານພາສີ", en: "e.g. Tax basics" },
    slug: "Part of the web address. Filled from the title; letters, numbers and hyphens only.",
    category: "Topic label shown on the quiz card.",
    categoryPlaceholder: { lo: "ເຊັ່ນ: ພາສີ", en: "e.g. Tax" },
    description: "One or two sentences on what the quiz tests.",
    descriptionPlaceholder: {
      lo: "ເຊັ່ນ: ຄຳຖາມພື້ນຖານກ່ຽວກັບປະເພດພາສີ ແລະ ການແຈ້ງພາສີ.",
      en: "e.g. Basic questions about tax types and filing.",
    },
    langName: { lo: "Lao", en: "English" },
  },
} as const;

function blankQuestion() {
  return {
    id: "q1",
    prompt: "",
    options: [
      { id: "a", label: "" },
      { id: "b", label: "" },
    ],
    correct_option_id: "",
    explanation: "",
  };
}

function emptyPayload(sortOrder: number): AdminQuizPayload {
  return {
    code: "",
    difficulty: "easy",
    pass_percent: 60,
    sort_order: sortOrder,
    is_published: false,
    questions: { lo: [blankQuestion()], en: [blankQuestion()] },
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
  nextSortOrder = 1,
}: {
  locale: Locale;
  initial?: AdminQuiz;
  canPublish: boolean;
  /** Sort position for a new quiz (after the existing ones). */
  nextSortOrder?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminQuizPayload>(
    initial ? fromQuiz(initial) : emptyPayload(nextSortOrder),
  );
  const guide = GUIDE[locale];
  // New quizzes fill code and slugs from the titles until the admin edits them; existing ones never change automatically.
  const [auto, setAuto] = useState({
    code: !initial,
    lo: !initial,
    en: !initial,
  });

  function updateTranslation(
    idx: number,
    patch: Partial<AdminQuizPayload["translations"][number]>,
  ) {
    setForm((f) => {
      const translations = [...f.translations];
      translations[idx] = { ...translations[idx], ...patch };
      if (!("title" in patch)) return { ...f, translations };
      const slugs = slugsFromNames({
        lo: translations.find((tr) => tr.locale === "lo")?.title || "",
        en: translations.find((tr) => tr.locale === "en")?.title || "",
      });
      return {
        ...f,
        code: auto.code ? slugs.en.slice(0, 64) : f.code,
        translations: translations.map((tr) =>
          auto[tr.locale as "lo" | "en"]
            ? { ...tr, slug: slugs[tr.locale as "lo" | "en"] }
            : tr,
        ),
      };
    });
  }

  // Question problems are shown after the first save attempt, then update live as they are fixed.
  const [showQuestionErrors, setShowQuestionErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const problems = questionErrors(form.questions, locale);
    if (Object.keys(problems).length) {
      setShowQuestionErrors(true);
      setError(
        locale === "en"
          ? `${Object.keys(problems).length} question(s) need attention before saving. They are marked in red below.`
          : `ມີ ${Object.keys(problems).length} ຄຳຖາມທີ່ຕ້ອງແກ້ໄຂກ່ອນບັນທຶກ. ໝາຍສີແດງຢູ່ດ້ານລຸ່ມ.`,
      );
      setLoading(false);
      return;
    }
    const body: AdminQuizPayload = {
      ...form,
      questions: cleanQuestions(form.questions),
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
    <form onSubmit={onSubmit} className="w-full space-y-5">
      {message ? <SuccessBanner>{message}</SuccessBanner> : null}
      {error ? (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      ) : null}

      <section className="space-y-3" aria-labelledby="quiz-settings-heading">
        <div>
          <h2 id="quiz-settings-heading" className="text-lg font-bold">
            {guide.settings}
          </h2>
          <p className="text-sm text-bb-text-muted">{guide.settingsIntro}</p>
        </div>
        <div className="admin-form-grid cols-2">
          <FormField label={t(locale, "quizCode")} hint={guide.code}>
            <input
              className="input"
              required
              placeholder="tax-basics"
              value={form.code}
              onChange={(e) => {
                setAuto((a) => ({ ...a, code: false }));
                setForm((f) => ({
                  ...f,
                  code: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                }));
              }}
            />
          </FormField>
          <FormField label={t(locale, "difficulty")} hint={guide.difficulty}>
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
          <FormField label={t(locale, "passPercent")} hint={guide.pass}>
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
          <FormField label={t(locale, "sortOrder")} hint={guide.sort}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sort_order: Number(e.target.value) || 0,
                }))
              }
            />
          </FormField>
        </div>

        {canPublish ? (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.is_published}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
            />
            <span>
              <span className="font-semibold">{t(locale, "published")}</span>
              <span className="block text-bb-text-muted">
                {guide.published}
              </span>
            </span>
          </label>
        ) : (
          <p className="text-sm text-bb-text-muted">
            {t(locale, "draft")} — {guide.draftOnly}
          </p>
        )}
      </section>

      {form.translations.map((tr, idx) => {
        const lang = tr.locale as "lo" | "en";
        return (
          <div key={tr.locale} className="admin-locale-block">
            <h3>{guide.langName[lang]}</h3>
            <p className="-mt-1 mb-2 text-sm text-bb-text-muted">
              {guide.blockIntro}
            </p>
            <FormField label={t(locale, "title")} hint={guide.title}>
              <input
                className="input"
                required
                placeholder={guide.titlePlaceholder[lang]}
                value={tr.title}
                onChange={(e) =>
                  updateTranslation(idx, { title: e.target.value })
                }
              />
            </FormField>
            <FormField label={t(locale, "slug")} hint={guide.slug}>
              <input
                className="input"
                required
                placeholder="tax-basics"
                value={tr.slug}
                onChange={(e) => {
                  setAuto((a) => ({ ...a, [lang]: false }));
                  updateTranslation(idx, { slug: e.target.value });
                }}
              />
            </FormField>
            <FormField label={t(locale, "categories")} hint={guide.category}>
              <input
                className="input"
                placeholder={guide.categoryPlaceholder[lang]}
                value={tr.category}
                onChange={(e) =>
                  updateTranslation(idx, { category: e.target.value })
                }
              />
            </FormField>
            <FormField
              label={t(locale, "description")}
              hint={guide.description}
            >
              <textarea
                className="input"
                rows={3}
                placeholder={guide.descriptionPlaceholder[lang]}
                value={tr.description}
                onChange={(e) =>
                  updateTranslation(idx, { description: e.target.value })
                }
              />
            </FormField>
          </div>
        );
      })}

      <QuizQuestionsEditor
        locale={locale}
        value={form.questions}
        onChange={(questions) => setForm((f) => ({ ...f, questions }))}
        errors={
          showQuestionErrors ? questionErrors(form.questions, locale) : {}
        }
      />

      {error ? (
        <p className="text-sm font-semibold text-red-600" role="alert">
          {error}
        </p>
      ) : null}

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
