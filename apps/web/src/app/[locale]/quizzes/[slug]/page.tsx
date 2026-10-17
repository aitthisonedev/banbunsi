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
        <div className="page-listing-head">
          <div>
            <p className="quiz-detail-cat">{quiz.category}</p>
            <h1 className="page-listing-title">{quiz.title}</h1>
          </div>
          <Link href={`/${raw}/quizzes`} className="section-link">
            {t(raw, "backToQuizzes")}
          </Link>
        </div>
        {quiz.description ? (
          <p className="quiz-detail-lead">{quiz.description}</p>
        ) : null}
        <p className="quiz-detail-meta">
          <span>
            {quiz.questions.length} {t(raw, "questions")}
          </span>
          <span>
            {t(raw, "difficulty")}: {t(raw, quiz.difficulty)}
          </span>
          <span>
            {t(raw, "passScore")} {quiz.passPercent}%
          </span>
        </p>
        <QuizPlayer locale={raw} quiz={quiz} />
      </div>
    </div>
  );
}
