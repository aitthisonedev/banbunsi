import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizzes } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { listQuizzes } from "@/lib/quizzes";

export default async function QuizzesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const api = await getQuizzes(raw).catch(() => null);
  const quizzes =
    api?.items?.length
      ? api.items.map((q) => ({
          slug: q.slug,
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty,
          questionCount: q.question_count,
        }))
      : listQuizzes(raw).map((q) => ({
          slug: q.slug,
          title: q.title,
          description: q.description,
          category: q.category,
          difficulty: q.difficulty,
          questionCount: q.questions.length,
        }));

  return (
    <div className="page-listing page-quizzes">
      <div className="page-listing-inner">
        <div className="page-listing-head">
          <h1 className="page-listing-title">{t(raw, "quizzes")}</h1>
          <Link href={`/${raw}/documents`} className="section-link">
            {t(raw, "viewAllDocuments")}
          </Link>
        </div>
        <p className="page-listing-meta">{t(raw, "quizzesLead")}</p>

        {quizzes.length === 0 ? (
          <p className="page-listing-meta">{t(raw, "noQuizzes")}</p>
        ) : (
          <ul className="quiz-card-grid">
            {quizzes.map((quiz) => (
              <li key={quiz.slug}>
                <Link href={`/${raw}/quizzes/${quiz.slug}`} className="quiz-card">
                  <span className="quiz-card-cat">{quiz.category}</span>
                  <span className="quiz-card-title">{quiz.title}</span>
                  <span className="quiz-card-desc">{quiz.description}</span>
                  <span className="quiz-card-meta">
                    <span>
                      {quiz.questionCount} {t(raw, "questions")}
                    </span>
                    <span>
                      {t(raw, "difficulty")}: {t(raw, quiz.difficulty)}
                    </span>
                  </span>
                  <span className="quiz-card-cta">{t(raw, "startQuiz")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
