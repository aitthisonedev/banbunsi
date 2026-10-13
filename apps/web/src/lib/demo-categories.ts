import type { CategoryNode, Locale } from "@/lib/api";

type Loc = { name: string; slug: string; description: string };

/** Fallback demo categories when the API has no data (local preview). */
export function demoCategories(locale: Locale): CategoryNode[] {
  const rows: Array<{ code: string; lo: Loc; en: Loc }> = [
    {
      code: "accounting",
      lo: {
        name: "\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
        slug: "kan-banchi",
        description:
          "\u0e84\u0eb9\u0ec8\u0ea1\u0eb7\u0e9a\u0eb1\u0e99\u0e8a\u0eb5, \u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 \u0ec1\u0ea5\u0eb0 \u0eab\u0ebc\u0eb1\u0e81\u0e81\u0eb2\u0e99\u0e9e\u0eb7\u0ec9\u0e99\u0e96\u0eb2\u0e99\u0eaa\u0eb3\u0ea5\u0eb1\u0e9a\u0e97\u0eb8\u0ea5\u0eb0\u0e81\u0eb4\u0e94.",
      },
      en: {
        name: "Accounting",
        slug: "accounting",
        description: "Accounting guides, forms, and basics for SMEs.",
      },
    },
    {
      code: "finance",
      lo: {
        name: "\u0e81\u0eb2\u0e99\u0ec0\u0e87\u0eb4\u0e99",
        slug: "kan-ngen",
        description:
          "\u0e81\u0eb0\u0ec1\u0eaa\u0ec0\u0e87\u0eb4\u0e99\u0eaa\u0ebb\u0e94, \u0e81\u0eb2\u0e99\u0ea7\u0eb2\u0e87\u0ec1\u0e9c\u0e99\u0ec0\u0e87\u0eb4\u0e99 \u0ec1\u0ea5\u0eb0 \u0ec0\u0e84\u0eb7\u0ec8\u0ead\u0e87\u0ea1\u0eb7\u0e81\u0eb2\u0e99\u0ec0\u0e87\u0eb4\u0e99.",
      },
      en: {
        name: "Finance",
        slug: "finance",
        description: "Cash flow, planning, and practical finance tools.",
      },
    },
    {
      code: "tax",
      lo: {
        name: "\u0e9e\u0eb2\u0eaa\u0eb5",
        slug: "phasi",
        description:
          "\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1\u0e9e\u0eb2\u0eaa\u0eb5, \u0e84\u0eb3\u0ead\u0eb0\u0e97\u0eb4\u0e9a\u0eb2\u0e8d \u0ec1\u0ea5\u0eb0 \u0e81\u0eb3\u0e99\u0ebb\u0e94\u0ec0\u0ea7\u0ea5\u0eb2\u0eaa\u0eb3\u0e84\u0eb1\u0e99.",
      },
      en: {
        name: "Tax",
        slug: "tax",
        description: "Tax forms, explanations, and key filing dates.",
      },
    },
    {
      code: "duties",
      lo: {
        name: "\u0ead\u0eb2\u0e81\u0ead\u0e99",
        slug: "akon",
        description:
          "\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99\u0ead\u0eb2\u0e81\u0ead\u0e99, \u0e9e\u0eb1\u0e99\u0e97\u0eb0 \u0ec1\u0ea5\u0eb0 \u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e97\u0eb5\u0ec8\u0e81\u0ec8\u0ebd\u0ea7\u0e82\u0ec9\u0ead\u0e87.",
      },
      en: {
        name: "Duties",
        slug: "duties",
        description: "Duties, obligations, and related documents.",
      },
    },
    {
      code: "audit",
      lo: {
        name: "\u0e81\u0eb2\u0e99\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a",
        slug: "kan-kuatsop",
        description:
          "\u0e84\u0eb9\u0ec8\u0ea1\u0eb7\u0e81\u0eb2\u0e99\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a \u0ec1\u0ea5\u0eb0 \u0e81\u0eb2\u0e99\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a\u0e9e\u0eb2\u0e8d\u0ec3\u0e99.",
      },
      en: {
        name: "Auditing",
        slug: "auditing",
        description: "Audit guidance and internal review checklists.",
      },
    },
    {
      code: "law",
      lo: {
        name: "\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
        slug: "kotmai",
        description:
          "\u0eaa\u0eb0\u0eab\u0ea5\u0eb8\u0e9a\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d\u0ea7\u0eb4\u0eaa\u0eb2\u0eab\u0eb0\u0e81\u0eb4\u0e94 \u0ec1\u0ea5\u0eb0 \u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d.",
      },
      en: {
        name: "Law",
        slug: "law",
        description: "Enterprise law summaries and legal documents.",
      },
    },
    {
      code: "knowledge",
      lo: {
        name: "\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0ead\u0eb7\u0ec8\u0e99\u0ec6",
        slug: "khwamhu-un",
        description:
          "\u0e9a\u0ebb\u0e94\u0e84\u0ea7\u0eb2\u0ea1\u0020\u0ec1\u0ea5\u0eb0\u0020\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0e97\u0ebb\u0ec8\u0ea7\u0ec4\u0e9b\u0e97\u0eb5\u0ec8\u0ec0\u0e9b\u0eb1\u0e99\u0e9b\u0eb0\u0ec2\u0eab\u0e8d\u0e94\u002e",
      },
      en: {
        name: "Other Knowledge",
        slug: "other-knowledge",
        description: "Articles and general knowledge that help your work.",
      },
    },
    {
      code: "sme",
      lo: {
        name: "\u0e97\u0eb8\u0ea5\u0eb0\u0e81\u0eb4\u0e94\u0e82\u0eb0\u0edc\u0eb2\u0e94\u0e99\u0ec9\u0ead\u0e8d",
        slug: "thurakit-noy",
        description:
          "\u0e84\u0eb9\u0ec8\u0ea1\u0eb7\u0020\u0ec1\u0ea5\u0eb0\u0020\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0eaa\u0eb3\u0ea5\u0eb1\u0e9a\u0e97\u0eb8\u0ea5\u0eb0\u0e81\u0eb4\u0e94\u0e82\u0eb0\u0edc\u0eb2\u0e94\u0e99\u0ec9\u0ead\u0e8d\u002e",
      },
      en: {
        name: "Small Business",
        slug: "small-business",
        description: "Guides and documents for small businesses.",
      },
    },
  ];

  return rows.map((row, i) => {
    const loc = locale === "lo" ? row.lo : row.en;
    return {
      id: `demo-${row.code}`,
      code: row.code,
      slug: loc.slug,
      name: loc.name,
      description: loc.description,
      sort_order: i + 1,
      is_active: true,
      children: [],
    };
  });
}

function demoByCode(locale: Locale): Map<string, Loc> {
  const map = new Map<string, Loc>();
  for (const row of demoCategories(locale)) {
    map.set(row.code, {
      name: row.name,
      slug: row.slug,
      description: row.description,
    });
  }
  return map;
}

/** Prefer API categories; enrich thin descriptions; fall back to demo when empty. */
export function categoriesOrDemo(
  locale: Locale,
  items: CategoryNode[],
): { items: CategoryNode[]; isDemo: boolean } {
  if (items.length === 0) {
    return { items: demoCategories(locale), isDemo: true };
  }

  const demos = demoByCode(locale);
  const enriched = items.map((cat) => {
    const demo = demos.get(cat.code);
    if (!demo) return cat;
    const thinDesc =
      !cat.description ||
      cat.description.trim() === "" ||
      cat.description.trim() === cat.name.trim();
    const thinName = !cat.name || !cat.name.trim();
    return {
      ...cat,
      name: thinName ? demo.name : cat.name,
      description: thinDesc ? demo.description : cat.description,
      slug: cat.slug || demo.slug,
    };
  });

  return { items: enriched, isDemo: false };
}
