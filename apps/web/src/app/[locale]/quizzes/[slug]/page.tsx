import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import { getQuiz as getQuizApi, type Locale } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { getQuiz as getQuizDemo, type QuizDifficulty } from "@/lib/quizzes";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(locale)) return {};
  const apiQuiz = await getQuizApi(locale, slug).catch(() => null);
  const quiz = apiQuiz || getQuizDemo(locale, slug);
  const localized = apiQuiz?.translations?.find(
    (translation) => translation.locale === locale,
  );
  const fallbackTranslation = apiQuiz?.translations?.find((translation) =>
    isLocale(translation.locale),
  );
  const canonicalLocale = localized
    ? locale
    : fallbackTranslation
      ? (fallbackTranslation.locale as Locale)
      : locale;
  const canonicalSlug =
    localized?.slug || fallbackTranslation?.slug || quiz?.slug || slug;
  const alternatePaths: Partial<Record<Locale, string>> = {};
  if (apiQuiz?.translations?.length) {
    for (const translation of apiQuiz.translations) {
      if (isLocale(translation.locale) && translation.slug) {
        alternatePaths[translation.locale] =
          `/quizzes/${encodeURIComponent(translation.slug)}`;
      }
    }
  } else if (quiz) {
    alternatePaths.lo = `/quizzes/${encodeURIComponent(canonicalSlug)}`;
    alternatePaths.en = `/quizzes/${encodeURIComponent(canonicalSlug)}`;
  }
  alternatePaths[canonicalLocale] =
    `/quizzes/${encodeURIComponent(canonicalSlug)}`;
  return pageMetadata(
    canonicalLocale,
    `/quizzes/${encodeURIComponent(canonicalSlug)}`,
    quiz?.title || t(locale, "quizzes"),
    quiz?.description || undefined,
    { alternatePaths },
  );
}

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  if (!isLocale(raw)) notFound();

  const apiQuiz = await getQuizApi(raw, slug).catch(() => null);
  const localized = apiQuiz?.translations?.find(
    (translation) => translation.locale === raw,
  );
  if (localized && localized.slug !== slug) {
    redirect(`/${raw}/quizzes/${encodeURIComponent(localized.slug)}`);
  }
  if (apiQuiz?.translations?.length && !localized) {
    const fallback = apiQuiz.translations.find((translation) =>
      isLocale(translation.locale),
    );
    if (fallback) {
      redirect(
        `/${fallback.locale}/quizzes/${encodeURIComponent(fallback.slug)}`,
      );
    }
  }
  const demoQuiz = getQuizDemo(raw, slug);

  if (!apiQuiz && !demoQuiz) notFound();

  const quiz = apiQuiz
    ? {
        slug: apiQuiz.slug,
        title: apiQuiz.title,
        description: apiQuiz.description,
        category: apiQuiz.category,
        difficulty: apiQuiz.difficulty as QuizDifficulty,
        passPercent: apiQuiz.pass_percent,
        questions: apiQuiz.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          correctOptionId: "",
          explanation: "",
        })),
        fromApi: true as const,
      }
    : {
        ...demoQuiz!,
        fromApi: false as const,
      };

  return (
    <div className="page-listing page-quiz-detail">
      <div className="page-listing-inner page-quiz-detail-inner">
        <header className="quiz-detail-head">
          <div className="quiz-detail-row">
            <Link href={`/${raw}/quizzes`} className="quiz-detail-eyebrow">
              <svg
                className="quiz-detail-back-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              {t(raw, "backToQuizzes")}
            </Link>
            <p className="quiz-detail-meta">
              {quiz.questions.length} {t(raw, "questions")}
            </p>
          </div>
          <div className="quiz-detail-row quiz-detail-row--main">
            <h1 className="quiz-detail-title">{quiz.title}</h1>
            <ul className="quiz-detail-pills">
              {quiz.category ? <li>{quiz.category}</li> : null}
              <li>
                {t(raw, "difficulty")}: {t(raw, quiz.difficulty)}
              </li>
              <li>
                {t(raw, "passScore")} {quiz.passPercent}%
              </li>
            </ul>
          </div>
          {quiz.description ? (
            <p className="quiz-detail-lead">{quiz.description}</p>
          ) : null}
        </header>
        <QuizPlayer locale={raw} quiz={quiz} />
      </div>
    </div>
  );
}
