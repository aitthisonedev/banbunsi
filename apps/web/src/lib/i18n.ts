import type { Locale } from "./api";

export const locales: Locale[] = ["lo", "en"];
export const defaultLocale: Locale = "lo";

export function isLocale(v: string): v is Locale {
  return v === "lo" || v === "en";
}

type Dict = Record<string, string>;

// Lao strings use Unicode escapes to avoid encoding corruption in tooling.
const lo: Dict = {
  brand: "BAN BUNSI",
  home: "\u0EAB\u0E99\u0EC9\u0EB2\u0EAB\u0EA5\u0EB1\u0E81",
  knowledge: "\u0E84\u0EA7\u0EB2\u0EA1\u0EAE\u0EB9\u0EC9",
  documents: "\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  quizzes: "\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  login: "\u0EC0\u0E82\u0EBB\u0EC9\u0EB2\u0EAA\u0EB9\u0EC8\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  register: "\u0ea5\u0ebb\u0e87\u0e97\u0eb0\u0e9a\u0ebd\u0e99",
  logout: "\u0EAD\u0EAD\u0E81\u0E88\u0EB2\u0E81\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  darkMode: "\u0ec2\u0edd\u0e94\u0ea1\u0eb7\u0e94",
  lightMode: "\u0ec2\u0edd\u0e94\u0eaa\u0eb0\u0eab\u0ea7\u0ec8\u0eb2\u0e87",
  language: "\u0e9e\u0eb2\u0eaa\u0eb2",
  account: "\u0E9A\u0EB1\u0E99\u0E8A\u0EB5\u0E82\u0EAD\u0E87\u0E82\u0EC9\u0EAD\u0E8D",
  admin: "\u0EAB\u0EA5\u0EB1\u0E87\u0E9A\u0EC9\u0EB2\u0E99",
  searchPlaceholder:
    "\u0e84\u0ebb\u0ec9\u0e99\u0eab\u0eb2\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99, \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d...",
  search: "\u0E84\u0EBB\u0EC9\u0E99\u0EAB\u0EB2",
  headline:
    "\u0eaa\u0eb9\u0e99\u0ea5\u0ea7\u0ea1\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99 \u0ec1\u0ea5\u0eb0 \u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0e94\u0ec9\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5, \u0e9e\u0eb2\u0eaa\u0eb5-\u0ead\u0eb2\u0e81\u0ead\u0e99, \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
  subhead:
    "\u0ead\u0ec8\u0eb2\u0e99\u0ec4\u0e94\u0ec9\u0e9f\u0ea3\u0eb5. \u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 \u0ec1\u0ea5\u0eb0 \u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e97\u0eb5\u0ec8\u0ead\u0eb1\u0e9a\u0ec0\u0e94\u0e94.",
  heroCta: "\u0ec0\u0ea5\u0eb5\u0e8d - \u0e8a\u0ead\u0e81\u0eab\u0eb2\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99",
  featureForms: "\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 & \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
  featureCalendar: "\u0e9b\u0eb0\u0e95\u0eb4\u0e97\u0eb4\u0e99\u0e9e\u0eb2\u0eaa\u0eb5",
  featureGuides: "\u0e9a\u0ebb\u0e94\u0e84\u0ea7\u0eb2\u0ea1 & \u0e84\u0eb3\u0ec1\u0e99\u0eb0\u0e99\u0eb3",
  latestDocuments: "\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99\u0EAB\u0EA5\u0EC9\u0EB2\u0EAA\u0EB8\u0E94",
  categories: "\u0EDC\u0EA7\u0E94\u0E84\u0EA7\u0EB2\u0EA1\u0EAE\u0EB9\u0EC9",
  viewAllCategories: "\u0EC0\u0E9A\u0EB4\u0EC8\u0E87\u0E97\u0EB8\u0E81\u0EDC\u0EA7\u0E94",
  contact: "\u0E95\u0EB4\u0E94\u0E95\u0ECD\u0EC8",
  about: "\u0E81\u0EC8\u0EB5\u0EBD\u0EA7\u0E81\u0EB1\u0E9A\u0E9E\u0EA7\u0E81\u0EC0\u0EAE\u0EBB\u0EB2",
  vip: "VIP",
  privacy: "\u0E99\u0EB0\u0EC2\u0E8D\u0E9A\u0EB2\u0E8D\u0E84\u0EA7\u0EB2\u0EA1\u0EC0\u0E9B\u0EB1\u0E99\u0EAA\u0EC8\u0EA7\u0E99\u0E95\u0EBB\u0EA7",
  email: "\u0EAD\u0EB5\u0EC0\u0EA1\u0EA7",
  password: "\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  name: "\u0E8A\u0EB7\u0EC8",
  submit: "\u0EAA\u0EBB\u0EC8\u0E87",
  forgotPassword: "\u0EA5\u0EB7\u0EA1\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99?",
  settings: "\u0E95\u0EB1\u0EC9\u0E87\u0E84\u0EC8\u0EB2",
  dashboard: "\u0EC1\u0E9C\u0E87\u0E84\u0EA7\u0E9A\u0E84\u0EB8\u0EA1",
  comingSoon: "\u0E88\u0EB0\u0EA1\u0EB2\u0EC3\u0E99\u0EC4\u0EA7\u0EC6\u0E99\u0EB5\u0EC9",
  footerBlurb:
    "\u0E9A\u0EB1\u0E99\u0E8A\u0EB5 \u0E81\u0EB2\u0E99\u0EC0\u0E87\u0EB4\u0E99 \u0E9E\u0EB2\u0EAA\u0EB5 \u0EAD\u0EB2\u0E81\u0EAD\u0E99 \u0E81\u0EB2\u0E99\u0E81\u0EA7\u0E94\u0EAA\u0EAD\u0E9A \u0EC1\u0EA5\u0EB0 \u0E81\u0EBB\u0E94\u0EDC\u0EB2\u0E8D. \u0EAD\u0EC8\u0EB2\u0E99\u0EC4\u0E94\u0EC9\u0E97\u0EBB\u0EC8\u0EA7\u0EC4\u0E9B \u0EC1\u0EA5\u0EC9\u0EA7\u0EC0\u0E82\u0EBB\u0EC9\u0EB2\u0EAA\u0EB9\u0EC8\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A\u0E81\u0EC8\u0EAD\u0E99\u0E94\u0EB2\u0EA7\u0EC2\u0EAB\u0EA5\u0E94\u0EC4\u0E9F\u0EA5\u0ECC.",
  usefulLinks: "\u0EA5\u0EB4\u0EC9\u0E87\u0E97\u0EB5\u0EC8\u0EC0\u0E9B\u0EB1\u0E99\u0E9B\u0EB0\u0EC2\u0E9F\u0E8D\u0E94",
  contactUs: "\u0E95\u0EB4\u0E94\u0E95\u0ECD\u0EC8\u0EC0\u0EAE\u0EBB\u0EB2",
  latestArticles: "\u0E9A\u0EBB\u0E94\u0E84\u0EA7\u0EB2\u0EA1\u0EAB\u0EA5\u0EC9\u0EB2\u0EAA\u0EB8\u0E94",
  faq: "\u0E84\u0EB3\u0E96\u0EB2\u0EA1\u0E97\u0EB5\u0EC8\u0E9E\u0EBB\u0E9A\u0EC0\u0EA5\u0EB7\u0EC9\u0EAD\u0E8D",
  vipBenefits: "\u0EAA\u0EB4\u0E94\u0E9B\u0EB0\u0EC2\u0E9F\u0E8D\u0E94 VIP",
  allRights: "\u0EAA\u0EB0\u0EAB\u0E87\u0EA7\u0E99\u0EA5\u0EB4\u0E82\u0EB0\u0EAA\u0EB4\u0E94\u0E97\u0EB1\u0E87\u0EDC\u0EBB\u0E94.",
};

const en: Dict = {
  brand: "BAN BUNSI",
  home: "Home",
  knowledge: "Knowledge",
  documents: "Documents",
  quizzes: "Quizzes",
  login: "Sign in",
  register: "Register",
  logout: "Sign out",
  darkMode: "Dark mode",
  lightMode: "Light mode",
  language: "Language",
  account: "My account",
  admin: "Admin",
  searchPlaceholder: "Search documents, laws...",
  search: "Search",
  headline: "A complete center for accounting, tax-duties, and Lao law knowledge",
  subhead: "Read for free. Sign in to download current forms and documents.",
  heroCta: "Start — search documents",
  featureForms: "Download forms & laws",
  featureCalendar: "Tax calendar",
  featureGuides: "Articles & guides",
  latestDocuments: "Latest documents",
  categories: "Knowledge categories",
  viewAllCategories: "View all categories",
  contact: "Contact",
  about: "About us",
  vip: "VIP",
  privacy: "Privacy policy",
  email: "Email",
  password: "Password",
  name: "Name",
  submit: "Submit",
  forgotPassword: "Forgot password?",
  settings: "Settings",
  dashboard: "Dashboard",
  comingSoon: "Coming soon",
  footerBlurb:
    "Accounting, finance, tax, duties, auditing, and law. Browse public content, then sign in before downloading files.",
  usefulLinks: "Useful links",
  contactUs: "Contact us",
  latestArticles: "Latest articles",
  faq: "FAQ",
  vipBenefits: "VIP benefits",
  allRights: "All rights reserved.",
};

const dictionaries: Record<Locale, Dict> = { lo, en };

export function t(locale: Locale, key: string) {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
