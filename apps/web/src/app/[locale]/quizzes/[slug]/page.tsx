import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
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
        <p className="page-listing-meta">
          {quiz.questions.length} {t(raw, "questions")} · {t(raw, "difficulty")}:{" "}
          {t(raw, quiz.difficulty)} · {t(raw, "passScore")} {quiz.passPercent}%
        </p>
        <QuizPlayer locale={raw} quiz={quiz} />
      </div>
    </div>
  );
}
