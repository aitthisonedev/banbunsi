"use client";

import { useState } from "react";
import type { Locale } from "@/lib/api";
import type { AdminQuizQuestion } from "@/lib/client-api";

export type QuizQuestions = Record<string, AdminQuizQuestion[]>;

const QUESTION_LOCALES = ["lo", "en"] as const;
const MAX_OPTIONS = 6;
const OPTION_IDS = "abcdefghijklmnopqrstuvwxyz".split("");

const TEXT = {
  lo: {
    heading: "ຄຳຖາມ",
    intro:
      "ເພີ່ມຄຳຖາມ, ຕົວເລືອກ ແລະ ໝາຍຄຳຕອບທີ່ຖືກ. ຄຳອະທິບາຍຈະສະແດງຫຼັງຜູ້ໃຊ້ສົ່ງຄຳຕອບ.",
    question: "ຄຳຖາມ",
    prompt: "ຄຳຖາມ",
    promptPlaceholder: "ພິມຄຳຖາມ…",
    options: "ຕົວເລືອກຄຳຕອບ",
    optionsHint: "ເລືອກປຸ່ມວົງມົນ ເພື່ອໝາຍຄຳຕອບທີ່ຖືກ.",
    optionPlaceholder: "ຕົວເລືອກ",
    correct: "ຄຳຕອບທີ່ຖືກ",
    addOption: "+ ເພີ່ມຕົວເລືອກ",
    removeOption: "ລຶບຕົວເລືອກ",
    explanation: "ຄຳອະທິບາຍ (ບໍ່ບັງຄັບ)",
    explanationPlaceholder: "ເປັນຫຍັງຄຳຕອບນີ້ຈຶ່ງຖືກ?",
    addQuestion: "+ ເພີ່ມຄຳຖາມ",
    moveUp: "ຍ້າຍຂຶ້ນ",
    moveDown: "ຍ້າຍລົງ",
    duplicate: "ສຳເນົາ",
    remove: "ລຶບ",
    confirmRemove: "ລຶບຄຳຖາມນີ້ບໍ?",
    empty: "ຍັງບໍ່ມີຄຳຖາມໃນພາສານີ້.",
    copyFrom: (name: string) => `ສຳເນົາຄຳຖາມຈາກ${name} ເພື່ອແປ`,
    countMismatch: (a: string, an: number, b: string, bn: number) =>
      `${a} ມີ ${an} ຄຳຖາມ ແຕ່ ${b} ມີ ${bn} ຄຳຖາມ.`,
    advanced: "ຂັ້ນສູງ: ແກ້ໄຂແບບ JSON",
    advancedHint: "ວາງ JSON ເພື່ອນຳເຂົ້າຄຳຖາມຫຼາຍຂໍ້ພ້ອມກັນ.",
    apply: "ນຳໃຊ້ JSON",
    invalidJson: "JSON ບໍ່ຖືກຕ້ອງ. ກວດສອບວົງເລັບ ແລະ ເຄື່ອງໝາຍຈຸດ.",
    applied: "ນຳເຂົ້າແລ້ວ.",
    langName: { lo: "ລາວ", en: "ອັງກິດ" },
  },
  en: {
    heading: "Questions",
    intro:
      "Add questions and answer options, then mark the correct answer. The explanation is shown after the user submits.",
    question: "Question",
    prompt: "Question",
    promptPlaceholder: "Type the question…",
    options: "Answer options",
    optionsHint: "Select the circle next to the correct answer.",
    optionPlaceholder: "Option",
    correct: "Correct answer",
    addOption: "+ Add option",
    removeOption: "Remove option",
    explanation: "Explanation (optional)",
    explanationPlaceholder: "Why is this the correct answer?",
    addQuestion: "+ Add question",
    moveUp: "Move up",
    moveDown: "Move down",
    duplicate: "Duplicate",
    remove: "Delete",
    confirmRemove: "Delete this question?",
    empty: "No questions in this language yet.",
    copyFrom: (name: string) => `Copy questions from ${name} to translate`,
    countMismatch: (a: string, an: number, b: string, bn: number) =>
      `${a} has ${an} questions but ${b} has ${bn}.`,
    advanced: "Advanced: edit as JSON",
    advancedHint: "Paste JSON to import many questions at once.",
    apply: "Apply JSON",
    invalidJson: "Invalid JSON. Check brackets and commas.",
    applied: "Imported.",
    langName: { lo: "Lao", en: "English" },
  },
} as const;

function newQuestion(existing: AdminQuizQuestion[]): AdminQuizQuestion {
  const used = new Set(existing.map((q) => q.id));
  let n = existing.length + 1;
  while (used.has(`q${n}`)) n++;
  return {
    id: `q${n}`,
    prompt: "",
    options: [
      { id: "a", label: "" },
      { id: "b", label: "" },
    ],
    correct_option_id: "",
    explanation: "",
  };
}

/** Problems that would make a question unusable, keyed `${locale}:${index}`. */
export function questionErrors(questions: QuizQuestions, uiLocale: Locale) {
  const en = uiLocale === "en";
  const errors: Record<string, string[]> = {};
  for (const lang of QUESTION_LOCALES) {
    (questions[lang] || []).forEach((q, index) => {
      const list: string[] = [];
      if (!q.prompt.trim())
        list.push(en ? "Enter the question text." : "ໃສ່ຂໍ້ຄວາມຄຳຖາມ.");
      const filled = q.options.filter((o) => o.label.trim());
      if (filled.length < 2)
        list.push(
          en ? "Add at least two answer options." : "ເພີ່ມຢ່າງໜ້ອຍ 2 ຕົວເລືອກ.",
        );
      if (
        !q.options.some((o) => o.id === q.correct_option_id && o.label.trim())
      ) {
        list.push(en ? "Choose the correct answer." : "ເລືອກຄຳຕອບທີ່ຖືກ.");
      }
      if (list.length) errors[`${lang}:${index}`] = list;
    });
  }
  return errors;
}

/** Trims text and drops empty options before saving. */
export function cleanQuestions(questions: QuizQuestions): QuizQuestions {
  return Object.fromEntries(
    QUESTION_LOCALES.map((lang) => [
      lang,
      (questions[lang] || []).map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        explanation: q.explanation.trim(),
        options: q.options
          .filter((o) => o.label.trim())
          .map((o) => ({ ...o, label: o.label.trim() })),
      })),
    ]),
  );
}

export function QuizQuestionsEditor({
  locale,
  value,
  onChange,
  errors,
}: {
  locale: Locale;
  value: QuizQuestions;
  onChange: (next: QuizQuestions) => void;
  errors: Record<string, string[]>;
}) {
  const text = TEXT[locale];
  const [active, setActive] = useState<(typeof QUESTION_LOCALES)[number]>(
    locale === "en" ? "en" : "lo",
  );
  const [jsonText, setJsonText] = useState("");
  const [jsonMessage, setJsonMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const questions = value[active] || [];
  const other = active === "lo" ? "en" : "lo";
  const otherQuestions = value[other] || [];

  const setList = (list: AdminQuizQuestion[]) =>
    onChange({ ...value, [active]: list });
  const updateQuestion = (index: number, patch: Partial<AdminQuizQuestion>) =>
    setList(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= questions.length) return;
    const list = [...questions];
    [list[index], list[target]] = [list[target], list[index]];
    setList(list);
  }

  function duplicate(index: number) {
    const copy = {
      ...questions[index],
      id: newQuestion(questions).id,
      options: questions[index].options.map((o) => ({ ...o })),
    };
    setList([
      ...questions.slice(0, index + 1),
      copy,
      ...questions.slice(index + 1),
    ]);
  }

  function addOption(index: number) {
    const q = questions[index];
    const used = new Set(q.options.map((o) => o.id));
    const id =
      OPTION_IDS.find((letter) => !used.has(letter)) ||
      `o${q.options.length + 1}`;
    updateQuestion(index, { options: [...q.options, { id, label: "" }] });
  }

  function removeOption(index: number, optionId: string) {
    const q = questions[index];
    updateQuestion(index, {
      options: q.options.filter((o) => o.id !== optionId),
      correct_option_id:
        q.correct_option_id === optionId ? "" : q.correct_option_id,
    });
  }

  function copyFromOther() {
    // Same structure and correct answers; texts are kept so they can be translated in place.
    setList(
      otherQuestions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      })),
    );
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText) as QuizQuestions;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      )
        throw new Error("shape");
      const next: QuizQuestions = { ...value };
      for (const lang of QUESTION_LOCALES) {
        if (!Array.isArray(parsed[lang])) continue;
        next[lang] = parsed[lang].map((q, i) => ({
          id: String(q.id || `q${i + 1}`),
          prompt: String(q.prompt || ""),
          options: Array.isArray(q.options)
            ? q.options.map((o, j) => ({
                id: String(o.id || OPTION_IDS[j]),
                label: String(o.label || ""),
              }))
            : [],
          correct_option_id: String(q.correct_option_id || ""),
          explanation: String(q.explanation || ""),
        }));
      }
      onChange(next);
      setJsonMessage({ ok: true, text: text.applied });
    } catch {
      setJsonMessage({ ok: false, text: text.invalidJson });
    }
  }

  const counts = { lo: (value.lo || []).length, en: (value.en || []).length };
  const errorCount = (lang: string) =>
    Object.keys(errors).filter((key) => key.startsWith(`${lang}:`)).length;

  return (
    <section className="space-y-4" aria-labelledby="quiz-questions-heading">
      <div>
        <h2 id="quiz-questions-heading" className="text-lg font-bold">
          {text.heading}
        </h2>
        <p className="mt-1 text-sm text-bb-text-muted">{text.intro}</p>
      </div>

      <div
        role="tablist"
        aria-label={text.heading}
        className="flex gap-1 rounded-lg bg-bb-muted p-1"
      >
        {QUESTION_LOCALES.map((lang) => (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={active === lang}
            onClick={() => setActive(lang)}
            className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${active === lang ? "bg-[var(--bb-surface)] text-[var(--bb-text)] shadow-sm" : "text-bb-text-muted hover:text-[var(--bb-text)]"}`}
          >
            {text.langName[lang]}
            <span className="rounded-full bg-bb-tint px-2 py-0.5 text-xs text-bb-blue">
              {counts[lang]}
            </span>
            {errorCount(lang) ? (
              <span
                className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700"
                aria-label={`${errorCount(lang)} errors`}
              >
                !
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {counts.lo !== counts.en && counts.lo > 0 && counts.en > 0 ? (
        <p
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          {text.countMismatch(
            text.langName.lo,
            counts.lo,
            text.langName.en,
            counts.en,
          )}
        </p>
      ) : null}

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bb-border p-6 text-center">
          <p className="text-sm text-bb-text-muted">{text.empty}</p>
          {otherQuestions.length ? (
            <button
              type="button"
              className="btn-secondary mt-3"
              onClick={copyFromOther}
            >
              {text.copyFrom(text.langName[other])}
            </button>
          ) : null}
        </div>
      ) : null}

      <ol className="space-y-4">
        {questions.map((q, index) => {
          const key = `${active}:${index}`;
          const problems = errors[key];
          const groupName = `${active}-${q.id}-${index}-correct`;
          return (
            <li
              key={key}
              className={`rounded-xl border bg-[var(--bb-surface)] p-4 sm:p-5 ${problems ? "border-rose-300 dark:border-rose-800" : "border-bb-border"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {text.question} {index + 1}
                </h3>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-bb-text-muted hover:bg-bb-muted disabled:opacity-40"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`${text.moveUp} ${index + 1}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-bb-text-muted hover:bg-bb-muted disabled:opacity-40"
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    aria-label={`${text.moveDown} ${index + 1}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-bb-text-muted hover:bg-bb-muted"
                    onClick={() => duplicate(index)}
                  >
                    {text.duplicate}
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    onClick={() => {
                      if (confirm(text.confirmRemove))
                        setList(questions.filter((_, i) => i !== index));
                    }}
                  >
                    {text.remove}
                  </button>
                </div>
              </div>

              <label className="mt-3 block text-sm">
                <span className="mb-1 block font-medium">{text.prompt}</span>
                <textarea
                  className="input min-h-20"
                  placeholder={text.promptPlaceholder}
                  value={q.prompt}
                  onChange={(event) =>
                    updateQuestion(index, { prompt: event.target.value })
                  }
                />
              </label>

              <fieldset className="mt-4">
                <legend className="text-sm font-medium">{text.options}</legend>
                <p className="text-xs text-bb-text-muted">{text.optionsHint}</p>
                <div className="mt-2 space-y-2">
                  {q.options.map((option, optionIndex) => {
                    const isCorrect = q.correct_option_id === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 rounded-lg border p-2 ${isCorrect ? "border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30" : "border-bb-border"}`}
                      >
                        <input
                          type="radio"
                          name={groupName}
                          className="h-5 w-5 shrink-0 accent-emerald-600"
                          checked={isCorrect}
                          onChange={() =>
                            updateQuestion(index, {
                              correct_option_id: option.id,
                            })
                          }
                          aria-label={`${text.correct}: ${option.label || `${text.optionPlaceholder} ${optionIndex + 1}`}`}
                        />
                        <span
                          className="w-5 shrink-0 text-center text-sm font-semibold uppercase text-bb-text-muted"
                          aria-hidden="true"
                        >
                          {option.id}
                        </span>
                        <input
                          className="min-h-10 w-full rounded-md border border-bb-border bg-[var(--bb-surface)] px-3 text-sm"
                          placeholder={`${text.optionPlaceholder} ${optionIndex + 1}`}
                          aria-label={`${text.optionPlaceholder} ${optionIndex + 1}`}
                          value={option.label}
                          onChange={(event) =>
                            updateQuestion(index, {
                              options: q.options.map((o) =>
                                o.id === option.id
                                  ? { ...o, label: event.target.value }
                                  : o,
                              ),
                            })
                          }
                        />
                        {isCorrect ? (
                          <span className="hidden shrink-0 text-xs font-semibold text-emerald-700 sm:inline dark:text-emerald-300">
                            ✓ {text.correct}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="shrink-0 rounded-md px-2 py-1 text-bb-text-muted hover:bg-bb-muted disabled:opacity-30"
                          onClick={() => removeOption(index, option.id)}
                          disabled={q.options.length <= 2}
                          aria-label={`${text.removeOption} ${optionIndex + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                {q.options.length < MAX_OPTIONS ? (
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-bb-blue hover:underline"
                    onClick={() => addOption(index)}
                  >
                    {text.addOption}
                  </button>
                ) : null}
              </fieldset>

              <label className="mt-4 block text-sm">
                <span className="mb-1 block font-medium">
                  {text.explanation}
                </span>
                <textarea
                  className="input min-h-16"
                  placeholder={text.explanationPlaceholder}
                  value={q.explanation}
                  onChange={(event) =>
                    updateQuestion(index, { explanation: event.target.value })
                  }
                />
              </label>

              {problems ? (
                <ul
                  className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-rose-700 dark:text-rose-300"
                  role="alert"
                >
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => setList([...questions, newQuestion(questions)])}
      >
        {text.addQuestion}
      </button>

      <details
        className="rounded-lg border border-bb-border px-3 py-2"
        onToggle={(event) => {
          if ((event.currentTarget as HTMLDetailsElement).open) {
            setJsonText(JSON.stringify(value, null, 2));
            setJsonMessage(null);
          }
        }}
      >
        <summary className="cursor-pointer text-sm font-medium text-bb-text-muted">
          {text.advanced}
        </summary>
        <p className="mt-2 text-xs text-bb-text-muted">{text.advancedHint}</p>
        <textarea
          className="input mt-2 min-h-48 font-mono text-xs"
          spellCheck={false}
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          aria-label={text.advanced}
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" className="btn-secondary" onClick={applyJson}>
            {text.apply}
          </button>
          {jsonMessage ? (
            <span
              className={`text-sm ${jsonMessage.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
              role="status"
            >
              {jsonMessage.text}
            </span>
          ) : null}
        </div>
      </details>
    </section>
  );
}
