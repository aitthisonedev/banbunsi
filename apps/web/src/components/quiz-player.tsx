"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/api";
import { submitQuiz } from "@/lib/api";
import type { Quiz } from "@/lib/quizzes";
import { scoreQuiz } from "@/lib/quizzes";
import { t } from "@/lib/i18n";

type PlayableQuiz = Quiz & { fromApi?: boolean };

type ResultView = {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  passPercent: number;
  details: Array<{
    questionId: string;
    prompt: string;
    selectedId: string | null;
    correctId: string;
    isCorrect: boolean;
    explanation: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

const OPTION_LETTERS = "ABCDEFGH";

export function QuizPlayer({
  locale,
  quiz,
}: {
  locale: Locale;
  quiz: PlayableQuiz;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = quiz.questions[index];
  const answeredCount = quiz.questions.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === quiz.questions.length;
  const currentAnswered = Boolean(question && answers[question.id]);
  const progressPct = ((index + 1) / quiz.questions.length) * 100;

  function selectOption(optionId: string) {
    if (result || !question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  async function onSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (quiz.fromApi) {
        const res = await submitQuiz(locale, quiz.slug, answers);
        setResult({
          correct: res.correct,
          total: res.total,
          percent: res.percent,
          passed: res.passed,
          passPercent: res.pass_percent,
          details: res.details.map((d) => ({
            questionId: d.question_id,
            prompt: d.prompt,
            selectedId: d.selected_id || null,
            correctId: d.correct_id,
            isCorrect: d.is_correct,
            explanation: d.explanation,
            options: d.options,
          })),
        });
      } else {
        const scored = scoreQuiz(quiz, answers);
        setResult({
          ...scored,
          passPercent: quiz.passPercent,
          details: scored.details.map((d) => {
            const q = quiz.questions.find((qq) => qq.id === d.questionId)!;
            return {
              questionId: d.questionId,
              prompt: q.prompt,
              selectedId: d.selectedId,
              correctId: d.correctId,
              isCorrect: d.isCorrect,
              explanation: q.explanation,
              options: q.options,
            };
          }),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t(locale, "loadError"));
    } finally {
      setSubmitting(false);
    }
  }

  function onRetry() {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setError(null);
  }

  if (result) {
    return (
      <div className="quiz-result">
        <div className="quiz-result-head">
          <h2 className="quiz-result-title">{t(locale, "quizResult")}</h2>
          <p
            className={`quiz-result-badge${result.passed ? " is-pass" : " is-fail"}`}
          >
            {result.passed ? t(locale, "passed") : t(locale, "failed")}
          </p>
        </div>
        <p className="quiz-result-score">
          {t(locale, "scoreLabel")}:{" "}
          <strong>
            {result.correct}/{result.total}
          </strong>{" "}
          ({result.percent}%)
          <span className="quiz-result-passline">
            · {t(locale, "passScore")} {result.passPercent}%
          </span>
        </p>

        <ul className="quiz-review">
          {result.details.map((detail, i) => {
            const selected = detail.options.find(
              (o) => o.id === detail.selectedId,
            );
            const correct = detail.options.find(
              (o) => o.id === detail.correctId,
            );
            return (
              <li
                key={detail.questionId}
                className={`quiz-review-item${detail.isCorrect ? " is-correct" : " is-wrong"}`}
              >
                <p className="quiz-review-num">
                  {t(locale, "questions")} {i + 1}
                </p>
                <p className="quiz-review-prompt">{detail.prompt}</p>
                <p className="quiz-review-line">
                  <span>{t(locale, "yourAnswer")}:</span>{" "}
                  {selected?.label ?? "—"}
                </p>
                <p className="quiz-review-line">
                  <span>{t(locale, "correctAnswer")}:</span> {correct?.label}
                </p>
                {detail.explanation ? (
                  <p className="quiz-review-expl">
                    <span>{t(locale, "explanation")}:</span>{" "}
                    {detail.explanation}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="quiz-actions">
          <button type="button" className="btn-primary" onClick={onRetry}>
            {t(locale, "tryAgainQuiz")}
          </button>
          <Link href={`/${locale}/quizzes`} className="btn-secondary">
            {t(locale, "backToQuizzes")}
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="quiz-player">
      <div className="quiz-progress">
        <span>
          {t(locale, "questions")} {index + 1} / {quiz.questions.length}
        </span>
        <span>
          {answeredCount}/{quiz.questions.length}
        </span>
      </div>
      <div
        className="quiz-progress-bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={quiz.questions.length}
        aria-valuenow={index + 1}
        aria-label={`${index + 1} / ${quiz.questions.length}`}
      >
        <span style={{ width: `${progressPct}%` }} />
      </div>

      <h2 className="quiz-prompt">{question.prompt}</h2>
      <ul className="quiz-options">
        {question.options.map((opt, optIndex) => {
          const selected = answers[question.id] === opt.id;
          const letter = OPTION_LETTERS[optIndex] || String(optIndex + 1);
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={`quiz-option${selected ? " is-selected" : ""}`}
                onClick={() => selectOption(opt.id)}
                aria-pressed={selected}
              >
                <span className="quiz-option-key" aria-hidden>
                  {letter}
                </span>
                <span className="quiz-option-label">{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {error ? <p className="quiz-error">{error}</p> : null}

      <div className="quiz-actions">
        <button
          type="button"
          className="btn-secondary"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t(locale, "previous")}
        </button>
        {index < quiz.questions.length - 1 ? (
          <button
            type="button"
            className="btn-primary"
            disabled={!currentAnswered || submitting}
            onClick={() =>
              setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))
            }
          >
            {t(locale, "next")}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={!allAnswered || submitting}
            onClick={onSubmit}
          >
            {t(locale, "submitQuiz")}
          </button>
        )}
      </div>
    </div>
  );
}
