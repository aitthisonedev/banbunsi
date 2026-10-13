import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizzes } from "@/lib/api";
import { isLocale, t } from "@/lib/i18n";
import { listQuizzes, type QuizDifficulty } from "@/lib/quizzes";

const COVER_BY_TOPIC: Array<{ match: RegExp; src: string }> = [
  { match: /tax|phasi|ພາສີ/i, src: "/brand/categories/cat-tax.jpg" },
  {
    match: /account|banchi|ບັນຊີ/i,
    src: "/brand/categories/cat-accounting.jpg",
  },
  { match: /law|kotmai|ກົດ/i, src: "/brand/categories/cat-law.jpg" },
  { match: /financ|ເງິນ/i, src: "/brand/categories/cat-finance.jpg" },
];

const COVER_FALLBACK = [
  "/brand/categories/cat-accounting.jpg",
  "/brand/categories/cat-finance.jpg",
  "/brand/categories/cat-tax.jpg",
  "/brand/categories/cat-law.jpg",
] as const;

function coverFor(slug: string, category: string, index: number) {
  const key = `${slug} ${category}`;
  for (const row of COVER_BY_TOPIC) {
    if (row.match.test(key)) return row.src;
  }
  return COVER_FALLBACK[index % COVER_FALLBACK.length];
}

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
          difficulty: q.difficulty as QuizDifficulty,
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
          <Link href={`/${raw}/categories`} className="section-link">
            {t(raw, "viewAllCategories")}
          </Link>
        </div>
        <p className="page-listing-meta">{t(raw, "quizzesLead")}</p>

        {quizzes.length === 0 ? (
          <p className="page-listing-meta">{t(raw, "noQuizzes")}</p>
        ) : (
          <ul className="quiz-card-grid">
            {quizzes.map((quiz, index) => (
              <li key={quiz.slug}>
                <Link
                  href={`/${raw}/quizzes/${quiz.slug}`}
                  className="category-card category-card--image"
                >
                  <span className="category-card-media">
                    <Image
                      src={coverFor(quiz.slug, quiz.category, index)}
                      alt={quiz.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="category-card-img"
                      priority={index < 3}
                    />
                    <span className="category-card-media-shade" aria-hidden />
                    <span className="category-card-title-on-image">
                      {quiz.title}
                    </span>
                  </span>
                  <span className="category-card-body">
                    <span className="quiz-card-cat">{quiz.category}</span>
                    {quiz.description ? (
                      <span className="category-card-desc">
                        {quiz.description}
                      </span>
                    ) : null}
                    <span className="category-card-meta">
                      <span>
                        {quiz.questionCount} {t(raw, "questions")} ·{" "}
                        {t(raw, quiz.difficulty)}
                      </span>
                      <span className="category-card-arrow" aria-hidden>
                        →
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
