import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import { Reveal } from "@/components/reveal";
import { getQuiz as getQuizApi } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import {
  getQuiz as getQuizDemo,
  type QuizDifficulty,
} from "@/lib/quizzes";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();

  const apiQuiz = await getQuizApi(raw, slug).catch(() => null);
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
    <div className="detail-page">
      <div className="detail-shell detail-shell--quiz">
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href={`/${raw}`} className="detail-breadcrumb-link">
            {t(raw, "home")}
          </Link>
          <span className="detail-breadcrumb-sep" aria-hidden>
            /
          </span>
          <Link href={`/${raw}/quizzes`} className="detail-breadcrumb-link">
            {t(raw, "quizzes")}
          </Link>
          {quiz.category ? (
            <>
              <span className="detail-breadcrumb-sep" aria-hidden>
                /
              </span>
              <span className="detail-breadcrumb-current">{quiz.category}</span>
            </>
          ) : null}
        </nav>

        <Reveal as="section" className="detail-hero">
          <div className="detail-hero-meta">
            <div className="detail-hero-meta-main">
              {quiz.category ? (
                <span className="detail-hero-cat">{quiz.category}</span>
              ) : null}
              <span className="detail-hero-year">
                · {quiz.questions.length} {t(raw, "questions")}
              </span>
            </div>
            <Link href={`/${raw}/quizzes`} className="detail-back-link">
              {t(raw, "backToQuizzes")} →
            </Link>
          </div>

          <h1 className="detail-hero-title">{quiz.title}</h1>

          {quiz.description ? (
            <p className="detail-hero-lead">{quiz.description}</p>
          ) : null}

          <div className="detail-stat-row">
            <span className="detail-stat">
              <strong>{quiz.questions.length}</strong>
              <span>{t(raw, "questions")}</span>
            </span>
            <span className="detail-stat">
              <strong>{t(raw, quiz.difficulty)}</strong>
              <span>{t(raw, "difficulty")}</span>
            </span>
            <span className="detail-stat">
              <strong>{quiz.passPercent}%</strong>
              <span>{t(raw, "passScore")}</span>
            </span>
          </div>
        </Reveal>

        <Reveal as="section" className="detail-panel detail-panel--quiz" delay={50}>
          <QuizPlayer locale={raw} quiz={quiz} />
        </Reveal>
      </div>
    </div>
  );
}
