import type { Locale } from "@/lib/api";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizOption = { id: string; label: string };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
};

export type Quiz = {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  passPercent: number;
  questions: QuizQuestion[];
};

type LocMeta = { title: string; description: string; category: string };

type QuizDef = {
  slug: string;
  difficulty: QuizDifficulty;
  passPercent: number;
  lo: LocMeta;
  en: LocMeta;
  questions: QuizQuestion[];
  trueFalse?: boolean;
};

const CATALOG: QuizDef[] = [
  {
    slug: "tax-basics",
    difficulty: "easy",
    passPercent: 60,
    lo: {
      title: "\u0e9e\u0eb2\u0eaa\u0eb5\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99",
      description: "\u0e84\u0eb3\u0e96\u0eb2\u0ea1\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99\u0e81\u0ec8\u0ebd\u0ea7\u0e81\u0eb1\u0e9a\u0e9e\u0eb2\u0eaa\u0eb5",
      category: "\u0e9e\u0eb2\u0eaa\u0eb5",
    },
    en: {
      title: "Tax basics",
      description: "Basic questions about tax types and filing.",
      category: "Tax",
    },
    questions: [
      {
        id: "t1",
        prompt: "Which tax is charged on business profits?",
        options: [
          { id: "a", label: "Value-added tax" },
          { id: "b", label: "Profit tax" },
          { id: "c", label: "Import duty" },
          { id: "d", label: "Land tax" },
        ],
        correctOptionId: "b",
        explanation: "Profit tax applies to business profits from operations.",
      },
      {
        id: "t2",
        prompt: "You should keep basic documents before filing tax.",
        options: [
          { id: "a", label: "__TRUE__" },
          { id: "b", label: "__FALSE__" },
        ],
        correctOptionId: "a",
        explanation: "Supporting documents help prove figures in a filing.",
      },
      {
        id: "t3",
        prompt: "Who usually announces official tax deadlines?",
        options: [
          { id: "a", label: "Tax authority" },
          { id: "b", label: "Banks" },
          { id: "c", label: "Market vendors" },
          { id: "d", label: "Website visitors" },
        ],
        correctOptionId: "a",
        explanation: "Tax deadlines are set by the tax authority under the law.",
      },
      {
        id: "t4",
        prompt: "Missing the legal filing deadline is always allowed.",
        options: [
          { id: "a", label: "__TRUE__" },
          { id: "b", label: "__FALSE__" },
        ],
        correctOptionId: "b",
        explanation: "Filing on time is required by law.",
      },
    ],
  },
  {
    slug: "accounting-basics",
    difficulty: "easy",
    passPercent: 60,
    lo: {
      title: "\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99",
      description: "\u0e84\u0eb3\u0e96\u0eb2\u0ea1\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99\u0e81\u0ec8\u0ebd\u0ea7\u0e81\u0eb1\u0e9a\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
      category: "\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
    },
    en: {
      title: "Accounting basics",
      description: "Basic accounting equation, income, and records.",
      category: "Accounting",
    },
    questions: [
      {
        id: "a1",
        prompt: "What is the basic accounting equation?",
        options: [
          { id: "a", label: "Assets = Liabilities + Equity" },
          { id: "b", label: "Assets = Revenue - Debt" },
          { id: "c", label: "Revenue = Assets + Liabilities" },
          { id: "d", label: "Debt = Assets - Revenue" },
        ],
        correctOptionId: "a",
        explanation: "The fundamental equation is Assets = Liabilities + Equity.",
      },
      {
        id: "a2",
        prompt: "Revenue is income earned from main business activity.",
        options: [
          { id: "a", label: "__TRUE__" },
          { id: "b", label: "__FALSE__" },
        ],
        correctOptionId: "a",
        explanation: "Revenue comes from core selling or service activity.",
      },
      {
        id: "a3",
        prompt: "Why keep accounting documents?",
        options: [
          { id: "a", label: "To record financial transactions" },
          { id: "b", label: "To decorate the office" },
          { id: "c", label: "To sell to tax officers" },
          { id: "d", label: "They are never needed" },
        ],
        correctOptionId: "a",
        explanation: "Documents support accurate bookkeeping.",
      },
    ],
  },
  {
    slug: "business-law-basics",
    difficulty: "medium",
    passPercent: 70,
    lo: {
      title: "\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d\u0e97\u0eb8\u0ea5\u0eb0\u0e81\u0eb4\u0e94\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99",
      description: "\u0e84\u0eb3\u0e96\u0eb2\u0ea1\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99\u0e81\u0ec8\u0ebd\u0ea7\u0e81\u0eb1\u0e9a\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
      category: "\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
    },
    en: {
      title: "Business law basics",
      description: "Basic questions about business setup and contracts.",
      category: "Law",
    },
    questions: [
      {
        id: "l1",
        prompt: "Business registration should follow the related laws.",
        options: [
          { id: "a", label: "__TRUE__" },
          { id: "b", label: "__FALSE__" },
        ],
        correctOptionId: "a",
        explanation: "Registering under the law keeps the business compliant.",
      },
      {
        id: "l2",
        prompt: "What is a binding contract?",
        options: [
          { id: "a", label: "Any informal chat" },
          { id: "b", label: "An agreement with legal effect" },
          { id: "c", label: "Something with no rules" },
          { id: "d", label: "Only used for marketing" },
        ],
        correctOptionId: "b",
        explanation: "A binding contract has legal force between parties.",
      },
      {
        id: "l3",
        prompt: "Tax law allows every business to skip filing forever.",
        options: [
          { id: "a", label: "__TRUE__" },
          { id: "b", label: "__FALSE__" },
        ],
        correctOptionId: "b",
        explanation: "Tax law requires filing on time, not skipping forever.",
      },
    ],
  },
];

const TRUE_LO = "\u0e96\u0eb7\u0e81";
const FALSE_LO = "\u0e9c\u0eb4\u0e94";

function localizeOptions(locale: Locale, options: QuizOption[]): QuizOption[] {
  return options.map((o) => {
    if (o.label === "__TRUE__") {
      return { ...o, label: locale === "lo" ? TRUE_LO : "True" };
    }
    if (o.label === "__FALSE__") {
      return { ...o, label: locale === "lo" ? FALSE_LO : "False" };
    }
    return o;
  });
}

function localize(def: QuizDef, locale: Locale): Quiz {
  const meta = locale === "lo" ? def.lo : def.en;
  return {
    slug: def.slug,
    difficulty: def.difficulty,
    passPercent: def.passPercent,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    questions: def.questions.map((q) => ({
      ...q,
      options: localizeOptions(locale, q.options),
    })),
  };
}

export function listQuizzes(locale: Locale): Quiz[] {
  return CATALOG.map((q) => localize(q, locale));
}

export function getQuiz(locale: Locale, slug: string): Quiz | null {
  const entry = CATALOG.find((q) => q.slug === slug);
  return entry ? localize(entry, locale) : null;
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, string>) {
  const details = quiz.questions.map((q) => {
    const selectedId = answers[q.id] ?? null;
    return {
      questionId: q.id,
      selectedId,
      correctId: q.correctOptionId,
      isCorrect: selectedId === q.correctOptionId,
    };
  });
  const correct = details.filter((d) => d.isCorrect).length;
  const total = quiz.questions.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return {
    correct,
    total,
    percent,
    passed: percent >= quiz.passPercent,
    details,
  };
}
