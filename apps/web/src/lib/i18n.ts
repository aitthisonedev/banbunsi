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
  home: "\u0edc\u0ec9\u0eb2\u0eab\u0ebc\u0eb1\u0e81",
  knowledge: "\u0E84\u0EA7\u0EB2\u0EA1\u0EAE\u0EB9\u0EC9",
  documents: "\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  quizzes: "\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  login:
    "\u0EC0\u0E82\u0EBB\u0EC9\u0EB2\u0EAA\u0EB9\u0EC8\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  register: "\u0ea5\u0ebb\u0e87\u0e97\u0eb0\u0e9a\u0ebd\u0e99",
  logout: "\u0EAD\u0EAD\u0E81\u0E88\u0EB2\u0E81\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  darkMode: "\u0ec2\u0edd\u0e94\u0ea1\u0eb7\u0e94",
  lightMode: "\u0ec2\u0edd\u0e94\u0eaa\u0eb0\u0eab\u0ea7\u0ec8\u0eb2\u0e87",
  language: "\u0e9e\u0eb2\u0eaa\u0eb2",
  account:
    "\u0E9A\u0EB1\u0E99\u0E8A\u0EB5\u0E82\u0EAD\u0E87\u0E82\u0EC9\u0EAD\u0E8D",
  admin: "\u0eab\u0ebc\u0eb1\u0e87\u0e9a\u0ec9\u0eb2\u0e99",
  searchPlaceholder:
    "\u0e84\u0ebb\u0ec9\u0e99\u0eab\u0eb2\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99, \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d...",
  search: "\u0E84\u0EBB\u0EC9\u0E99\u0EAB\u0EB2",
  headline:
    "\u0eaa\u0eb9\u0e99\u0ea5\u0ea7\u0ea1\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99 \u0ec1\u0ea5\u0eb0 \u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0e94\u0ec9\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5, \u0e9e\u0eb2\u0eaa\u0eb5\u0ead\u0eb2\u0e81\u0ead\u0e99 \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d\u0ea5\u0eb2\u0ea7",
  subhead:
    "\u0ead\u0ec8\u0eb2\u0e99\u0ec4\u0e94\u0ec9\u0e9f\u0ea3\u0eb5. \u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 \u0ec1\u0ea5\u0eb0 \u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e97\u0eb5\u0ec8\u0ead\u0eb1\u0e9a\u0ec0\u0e94\u0e94.",
  heroCta:
    "\u0EC0\u0EA5\u0EB5\u0EC8\u0EA1\u0E95\u0EBB\u0EC9\u0E99\u0020\u2014\u0020\u0E84\u0EBB\u0EC9\u0E99\u0EAB\u0EB2\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  featureForms:
    "\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
  featureCalendar:
    "\u0e9b\u0eb0\u0e95\u0eb4\u0e97\u0eb4\u0e99\u0e9e\u0eb2\u0eaa\u0eb5",
  featureGuides:
    "\u0e9a\u0ebb\u0e94\u0e84\u0ea7\u0eb2\u0ea1 \u0ec1\u0ea5\u0eb0 \u0e84\u0eb9\u0ec8\u0ea1\u0eb7",
  latestDocuments:
    "\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0eab\u0ebc\u0ec9\u0eb2\u0eaa\u0eb8\u0e94",
  categories: "\u0edd\u0ea7\u0e94\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9",
  viewAllCategories:
    "\u0ec0\u0e9a\u0eb4\u0ec8\u0e87\u0e97\u0eb8\u0e81\u0edd\u0ea7\u0e94",
  contact: "\u0E95\u0EB4\u0E94\u0E95\u0ECD\u0EC8",
  about:
    "\u0e81\u0ec8\u0ebd\u0ea7\u0e81\u0eb1\u0e9a\u0e9e\u0ea7\u0e81\u0ec0\u0eae\u0ebb\u0eb2",
  vip: "VIP",
  privacy:
    "\u0E99\u0EB0\u0EC2\u0E8D\u0E9A\u0EB2\u0E8D\u0E84\u0EA7\u0EB2\u0EA1\u0EC0\u0E9B\u0EB1\u0E99\u0EAA\u0EC8\u0EA7\u0E99\u0E95\u0EBB\u0EA7",
  email: "\u0EAD\u0EB5\u0EC0\u0EA1\u0EA7",
  password: "\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  confirmPassword:
    "\u0EA2\u0EB7\u0E99\u0EA2\u0EB1\u0E99\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  name: "\u0E8A\u0EB7\u0EC8",
  submit: "\u0EAA\u0EBB\u0EC8\u0E87",
  forgotPassword:
    "\u0EA5\u0EB7\u0EA1\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99?",
  resetPassword:
    "\u0e95\u0eb1\u0ec9\u0e87\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0e9c\u0ec8\u0eb2\u0e99\u0ec3\u0edd\u0ec8",
  verifyEmail:
    "\u0EA2\u0EB7\u0E99\u0EA2\u0EB1\u0E99\u0EAD\u0EB5\u0EC0\u0EA1\u0EA7",
  settings: "\u0E95\u0EB1\u0EC9\u0E87\u0E84\u0EC8\u0EB2",
  dashboard: "\u0EC1\u0E9C\u0E87\u0E84\u0EA7\u0E9A\u0E84\u0EB8\u0EA1",
  comingSoon:
    "\u0E88\u0EB0\u0EA1\u0EB2\u0EC3\u0E99\u0EC4\u0EA7\u0EC6\u0E99\u0EB5\u0EC9",
  footerBlurb:
    "\u0e9a\u0eb1\u0e99\u0e8a\u0eb5, \u0e81\u0eb2\u0e99\u0ec0\u0e87\u0eb4\u0e99, \u0e9e\u0eb2\u0eaa\u0eb5, \u0ead\u0eb2\u0e81\u0ead\u0e99, \u0e81\u0eb2\u0e99\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d. \u0ead\u0ec8\u0eb2\u0e99\u0ec0\u0e99\u0eb7\u0ec9\u0ead\u0eab\u0eb2\u0eaa\u0eb2\u0e97\u0eb2\u0ea5\u0eb0\u0e99\u0eb0\u0ec4\u0e94\u0ec9 \u0ec1\u0ea5\u0eb0 \u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0e81\u0ec8\u0ead\u0e99\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e9f\u0ea5\u0ecc.",
  usefulLinks:
    "\u0ea5\u0eb4\u0ec9\u0e87\u0e97\u0eb5\u0ec8\u0ec0\u0e9b\u0eb1\u0e99\u0e9b\u0eb0\u0ec2\u0eab\u0e8d\u0e94",
  contactUs: "\u0E95\u0EB4\u0E94\u0E95\u0ECD\u0EC8\u0EC0\u0EAE\u0EBB\u0EB2",
  latestArticles:
    "\u0e9a\u0ebb\u0e94\u0e84\u0ea7\u0eb2\u0ea1\u0eab\u0ebc\u0ec9\u0eb2\u0eaa\u0eb8\u0e94",
  faq: "\u0e84\u0eb3\u0e96\u0eb2\u0ea1\u0e97\u0eb5\u0ec8\u0e9e\u0ebb\u0e9a\u0ec0\u0ea5\u0eb7\u0ec9\u0ead\u0e8d\u0ec6",
  vipBenefits: "\u0eaa\u0eb4\u0e94\u0e9b\u0eb0\u0ec2\u0eab\u0e8d\u0e94 VIP",
  allRights:
    "\u0eaa\u0eb0\u0eab\u0e87\u0ea7\u0e99\u0ea5\u0eb4\u0e82\u0eb0\u0eaa\u0eb4\u0e94\u0e97\u0eb1\u0e87\u0edd\u0ebb\u0e94.",
  viewAllDocuments:
    "\u0ec0\u0e9a\u0eb4\u0ec8\u0e87\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e97\u0eb1\u0e87\u0edd\u0ebb\u0e94",
  documentsLead:
    "\u0e84\u0ebb\u0ec9\u0e99\u0eab\u0eb2, \u0e81\u0eb1\u0ec8\u0e99\u0e95\u0ead\u0e87 \u0ec1\u0ea5\u0eb0 \u0ead\u0ec8\u0eb2\u0e99\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0eaa\u0eb2\u0e97\u0eb2\u0ea5\u0eb0\u0e99\u0eb0.",
  allCategories: "\u0edd\u0ea7\u0e94\u0e97\u0eb1\u0e87\u0edd\u0ebb\u0e94",
  year: "\u0E9B\u0EB5",
  filter: "\u0e81\u0eb1\u0ec8\u0e99\u0e95\u0ead\u0e87",
  clearFilters:
    "\u0ea5\u0ec9\u0eb2\u0e87\u0e95\u0ebb\u0ea7\u0e81\u0eb1\u0ec8\u0e99\u0e95\u0ead\u0e87",
  noDocuments:
    "\u0E9A\u0ECD\u0EC8\u0E9E\u0EBB\u0E9A\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  badgePublic: "\u0eaa\u0eb2\u0e97\u0eb2\u0ea5\u0eb0\u0e99\u0eb0",
  badgeMember: "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81",
  badgeVip: "VIP",
  bodyGated:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0ead\u0ec8\u0eb2\u0e99\u0ec0\u0e99\u0eb7\u0ec9\u0ead\u0eab\u0eb2\u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0ec0\u0e95\u0eb1\u0ea1.",
  files: "\u0EC4\u0E9F\u0EA5\u0ECC",
  downloadLogin:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94",
  noFiles: "\u0E9A\u0ECD\u0EC8\u0EA1\u0EB5\u0EC4\u0E9F\u0EA5\u0ECC",
  searchHint:
    "\u0e9e\u0eb4\u0ea1\u0e84\u0eb3\u0e84\u0ebb\u0ec9\u0e99\u0eab\u0eb2\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0ec0\u0ea5\u0eb5\u0ec8\u0ea1\u0e95\u0ebb\u0ec9\u0e99.",
  adminDocuments:
    "\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  newDocument: "\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0ec3\u0edd\u0ec8",
  editDocument:
    "\u0EC1\u0E81\u0EC9\u0EC4\u0E82\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  edit: "\u0EC1\u0E81\u0EC9\u0EC4\u0E82",
  delete: "\u0EA5\u0EB6\u0E9A",
  save: "\u0E9A\u0EB1\u0E99\u0E97\u0EB6\u0E81",
  cancel: "\u0e8d\u0ebb\u0e81\u0ec0\u0ea5\u0eb5\u0e81",
  title: "\u0eab\u0ebb\u0ea7\u0e82\u0ecd\u0ec9",
  status: "\u0eaa\u0eb0\u0e96\u0eb2\u0e99\u0eb0",
  loading: "\u0e81\u0eb3\u0ea5\u0eb1\u0e87\u0ec2\u0eab\u0ebc\u0e94...",
  menu: "\u0EC0\u0EA1\u0E99\u0EB9",
  previous: "\u0e81\u0ec8\u0ead\u0e99\u0edc\u0ec9\u0eb2",
  next: "\u0E96\u0EB1\u0E94\u0EC4\u0E9B",
  perPage: "\u0E95\u0ECD\u0EC8\u0EDC\u0EC9\u0EB2",
  loadError:
    "\u0ec2\u0eab\u0ebc\u0e94\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99\u0e9a\u0ecd\u0ec8\u0eaa\u0eb3\u0ec0\u0ea5\u0eb1\u0e94",
  tryAgain:
    "\u0e81\u0eb0\u0ea5\u0eb8\u0e99\u0eb2\u0ea5\u0ead\u0e87\u0ead\u0eb5\u0e81\u0e84\u0eb1\u0ec9\u0e87",
  passwordMismatch:
    "\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0e9c\u0ec8\u0eb2\u0e99\u0e9a\u0ecd\u0ec8\u0e81\u0ebb\u0e87\u0e81\u0eb1\u0e99",
  staffSignInRequired:
    "\u0e81\u0eb0\u0ea5\u0eb8\u0e99\u0eb2\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0e94\u0ec9\u0ea7\u0e8d\u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99.",
  backToSite:
    "\u0e81\u0eb1\u0e9a\u0ec4\u0e9b\u0edc\u0ec9\u0eb2\u0ec0\u0ea7\u0eb1\u0e9a",
  saved: "\u0E9A\u0EB1\u0E99\u0E97\u0EB6\u0E81\u0EC1\u0EA5\u0EC9\u0EA7",
  deleteConfirm:
    "\u0EA5\u0EB6\u0E9A\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99\u0E99\u0EB5\u0EC9\u0E9A\u0ECD\u0EC8?",
  documentNumber:
    "\u0ec0\u0ea5\u0e81\u0e97\u0eb5\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99",
  readAccess:
    "\u0eaa\u0eb4\u0e94\u0ec3\u0e99\u0e81\u0eb2\u0e99\u0ead\u0ec8\u0eb2\u0e99",
  effectiveDate:
    "\u0ea7\u0eb1\u0e99\u0e97\u0eb5\u0ea1\u0eb5\u0e9c\u0ebb\u0e99\u0e9a\u0eb1\u0e87\u0e84\u0eb1\u0e9a\u0ec3\u0e8a\u0ec9",
  tags: "\u0e9b\u0ec9\u0eb2\u0e8d\u0e81\u0eb3\u0e81\u0eb1\u0e9a",
  aboutBody:
    "BAN BUNSI \u0ec0\u0e9b\u0eb1\u0e99\u0eaa\u0eb9\u0e99\u0ea5\u0ea7\u0ea1\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0e94\u0ec9\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5, \u0e81\u0eb2\u0e99\u0ec0\u0e87\u0eb4\u0e99, \u0e9e\u0eb2\u0eaa\u0eb5, \u0ead\u0eb2\u0e81\u0ead\u0e99, \u0e81\u0eb2\u0e99\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d\u0ea5\u0eb2\u0ea7.",
  vipBody:
    "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81 VIP \u0eaa\u0eb2\u0ea1\u0eb2\u0e94\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec0\u0e96\u0eb4\u0e87\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e9e\u0eb4\u0ec0\u0eaa\u0e94\u0ec4\u0e94\u0ec9. \u0e95\u0eb4\u0e94\u0e95\u0ecd\u0ec8\u0ec0\u0e88\u0ebb\u0ec9\u0eb2\u0e82\u0ead\u0e87\u0ec0\u0ea7\u0eb1\u0e9a\u0ec4\u0e8a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e82\u0ecd\u0eaa\u0eb4\u0e94\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec0\u0e96\u0eb4\u0e87. \u0e81\u0eb2\u0e99\u0e8a\u0eb3\u0ea5\u0eb0\u0ec0\u0e87\u0eb4\u0e99\u0ead\u0ead\u0e99\u0ea5\u0eb2\u0e8d\u0e8d\u0eb1\u0e87\u0e9a\u0ecd\u0ec8\u0ea1\u0eb5\u0ec3\u0e99\u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0e99\u0eb5\u0ec9.",
  privacyBody:
    "\u0ec0\u0e88\u0ebb\u0ec9\u0eb2\u0e82\u0ead\u0e87\u0ec0\u0ea7\u0eb1\u0e9a\u0ec4\u0e8a\u0e88\u0eb0\u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8\u0ea5\u0eb2\u0e8d\u0ea5\u0eb0\u0ead\u0ebd\u0e94\u0e99\u0eb0\u0ec2\u0e8d\u0e9a\u0eb2\u0e8d\u0e84\u0ea7\u0eb2\u0ea1\u0ec0\u0e9b\u0eb1\u0e99\u0eaa\u0ec8\u0ea7\u0e99\u0e95\u0ebb\u0ea7. \u0e9e\u0ea7\u0e81\u0ec0\u0eae\u0ebb\u0eb2\u0ec3\u0e8a\u0ec9\u0eaa\u0eb0\u0ec0\u0e9e\u0eb2\u0eb0\u0e82\u0ecd\u0ec9\u0ea1\u0eb9\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e97\u0eb5\u0ec8\u0e88\u0eb3\u0ec0\u0e9b\u0eb1\u0e99\u0eaa\u0eb3\u0ea5\u0eb1\u0e9a\u0e81\u0eb2\u0e99\u0ec3\u0eab\u0ec9\u0e9a\u0ecd\u0ea5\u0eb4\u0e81\u0eb2\u0e99\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81\u0ec0\u0e97\u0ebb\u0ec8\u0eb2\u0e99\u0eb1\u0ec9\u0e99.",
  contactLead:
    "\u0E95\u0EB4\u0E94\u0E95\u0ECD\u0EC8\u0E97\u0EB5\u0EA1 BAN BUNSI \u0E9C\u0EC8\u0EB2\u0E99\u0E8A\u0EC8\u0EAD\u0E87\u0E97\u0EB2\u0E87\u0E99\u0EB5\u0EC9.",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  statsDocuments: "\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  statsMembers: "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81",
  statsVip:
    "VIP \u0e97\u0eb5\u0ec8\u0e8d\u0eb1\u0e87\u0ec3\u0e8a\u0ec9\u0e87\u0eb2\u0e99",
  statsPending:
    "\u0ea5\u0ecd\u0e96\u0ec9\u0eb2\u0e9e\u0eb4\u0e88\u0eb2\u0ea5\u0eb0\u0e99\u0eb2",
  statsArticles: "\u0E9A\u0EBB\u0E94\u0E84\u0EA7\u0EB2\u0EA1",
  statsDownloads:
    "\u0e84\u0eb3\u0e82\u0ecd\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94",
  noCategories: "\u0e9a\u0ecd\u0ec8\u0e9e\u0ebb\u0e9a\u0edd\u0ea7\u0e94",

  quizzesLead:
    "\u0ec0\u0ea5\u0eb7\u0ead\u0e81\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e97\u0ebb\u0e9a\u0e97\u0ea7\u0e99\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9",
  startQuiz:
    "\u0ec0\u0ea5\u0eb5\u0ec8\u0ea1\u0ec0\u0eae\u0eb1\u0e94\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a",
  questions: "\u0e84\u0eb3\u0e96\u0eb2\u0ea1",
  difficulty:
    "\u0ea5\u0eb0\u0e94\u0eb1\u0e9a\u0e84\u0ea7\u0eb2\u0ea1\u0e8d\u0eb2\u0e81",
  easy: "\u0e87\u0ec8\u0eb2\u0e8d",
  medium: "\u0e9b\u0eb2\u0e99\u0e81\u0eb2\u0e87",
  hard: "\u0e8d\u0eb2\u0e81",
  submitQuiz: "\u0eaa\u0ebb\u0ec8\u0e87\u0e84\u0eb3\u0e95\u0ead\u0e9a",
  quizResult:
    "\u0e9c\u0ebb\u0e99\u0e81\u0eb2\u0e99\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a",
  scoreLabel: "\u0e84\u0eb0\u0ec1\u0e99\u0e99",
  passed: "\u0e9c\u0ec8\u0eb2\u0e99",
  failed: "\u0e9a\u0ecd\u0ec8\u0e9c\u0ec8\u0eb2\u0e99",
  tryAgainQuiz:
    "\u0ec0\u0eae\u0eb1\u0e94\u0ead\u0eb5\u0e81\u0e84\u0eb1\u0ec9\u0e87",
  backToQuizzes:
    "\u0e81\u0eb1\u0e9a\u0ec4\u0e9b\u0edc\u0ec9\u0eb2\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a",
  explanation: "\u0e84\u0eb3\u0ead\u0eb0\u0e97\u0eb4\u0e9a\u0eb2\u0e8d",
  correctAnswer:
    "\u0e84\u0eb3\u0e95\u0ead\u0e9a\u0e97\u0eb5\u0ec8\u0e96\u0eb7\u0e81\u0e95\u0ec9\u0ead\u0e87",
  yourAnswer:
    "\u0e84\u0eb3\u0e95\u0ead\u0e9a\u0e82\u0ead\u0e87\u0e97\u0ec8\u0eb2\u0e99",
  noQuizzes:
    "\u0e8d\u0eb1\u0e87\u0e9a\u0ecd\u0ec8\u0ea1\u0eb5\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a",
  passScore: "\u0e84\u0eb0\u0ec1\u0e99\u0e99\u0e9c\u0ec8\u0eb2\u0e99",
  browseCategory:
    "\u0EC0\u0E9A\u0EB4\u0EC8\u0E87\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99",
  homeDocsLead:
    "\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e97\u0eb5\u0ec8\u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8\u0eab\u0ebc\u0ec9\u0eb2\u0eaa\u0eb8\u0e94. \u0ead\u0ec8\u0eb2\u0e99\u0ec4\u0e94\u0ec9\u0e9f\u0ea3\u0eb5 \u0ec1\u0ea5\u0eb0 \u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e94\u0ec9\u0eab\u0ebc\u0eb1\u0e87\u0e88\u0eb2\u0e81\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a.",
  homeCatsLead:
    "\u0EC0\u0EA5\u0EB7\u0EAD\u0E81\u0EDD\u0EA7\u0E94\u0EC0\u0E9E\u0EB7\u0EC8\u0EAD\u0EAB\u0EB2\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99\u0EC4\u0E94\u0EC9\u0EC4\u0EA7\u002E",
  homePromoTitle:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e9f\u0ea5\u0ecc \u0ec1\u0ea5\u0eb0 \u0ead\u0ec8\u0eb2\u0e99\u0ec0\u0e99\u0eb7\u0ec9\u0ead\u0eab\u0eb2\u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0ec0\u0e95\u0eb1\u0ea1",
  homePromoLead:
    "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81 VIP \u0eaa\u0eb2\u0ea1\u0eb2\u0e94\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec0\u0e96\u0eb4\u0e87\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0e9e\u0eb4\u0ec0\u0eaa\u0e94\u0ec4\u0e94\u0ec9.",
  featureFormsDesc:
    "\u0EC1\u0E9A\u0E9A\u0E9F\u0EAD\u0EA1\u0020\u0EC1\u0EA5\u0EB0\u0020\u0EC0\u0EAD\u0E81\u0EB0\u0EAA\u0EB2\u0E99\u0E81\u0EBB\u0E94\u0EDD\u0EB2\u0E8D",
  featureCalendarDesc:
    "\u0ec0\u0e9a\u0eb4\u0ec8\u0e87\u0edd\u0ea7\u0e94\u0e9e\u0eb2\u0eaa\u0eb5 \u0ec1\u0ea5\u0eb0 \u0e81\u0eb3\u0e99\u0ebb\u0e94\u0ec0\u0ea7\u0ea5\u0eb2",
  featureGuidesDesc:
    "\u0EAD\u0EC8\u0EB2\u0E99\u0E84\u0EB3\u0EC1\u0E99\u0EB0\u0E99\u0EB3\u0E95\u0EB2\u0EA1\u0EDD\u0EA7\u0E94",
  authAsideLead:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e9f\u0ea5\u0ecc \u0ec1\u0ea5\u0eb0 \u0ead\u0ec8\u0eb2\u0e99\u0ec0\u0e99\u0eb7\u0ec9\u0ead\u0eab\u0eb2\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0ec0\u0e95\u0eb1\u0ea1.",
  loginLead:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1 \u0ec1\u0ea5\u0eb0 \u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99.",
  registerLead:
    "\u0eaa\u0ec9\u0eb2\u0e87\u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94 \u0ec1\u0ea5\u0eb0 \u0e99\u0eb3\u0ec3\u0e8a\u0ec9\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99\u0eaa\u0eb2\u0e97\u0eb2\u0ea5\u0eb0\u0e99\u0eb0.",
  noAccountYet:
    "\u0E8D\u0EB1\u0E87\u0E9A\u0ECD\u0EC8\u0EA1\u0EB5\u0E9A\u0EB1\u0E99\u0E8A\u0EB5?",
  haveAccount:
    "\u0EA1\u0EB5\u0E9A\u0EB1\u0E99\u0E8A\u0EB5\u0EC1\u0EA5\u0EC9\u0EA7?",
  backHome:
    "\u0e81\u0eb1\u0e9a\u0ec4\u0e9b\u0edc\u0ec9\u0eb2\u0eab\u0ebc\u0eb1\u0e81",
  welcomeBack:
    "\u0E8D\u0EB4\u0E99\u0E94\u0EB5\u0E95\u0EC9\u0EAD\u0E99\u0EAE\u0EB1\u0E9A\u0E81\u0EB1\u0E9A\u0E84\u0EB7\u0E99",
  createAccount:
    "\u0EAA\u0EC9\u0EB2\u0E87\u0E9A\u0EB1\u0E99\u0E8A\u0EB5\u0EC3\u0EDD\u0EC8",
  rememberMe: "\u0E88\u0EB7\u0EC8\u0E82\u0EC9\u0EAD\u0E8D\u0EC4\u0EA7\u0EC9",
  showPassword:
    "\u0EAA\u0EB0\u0EC1\u0E94\u0E87\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  hidePassword:
    "\u0EC0\u0E8A\u0EB7\u0EC8\u0EAD\u0E87\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  passwordMinChars:
    "\u0EA2\u0EC8\u0EB2\u0E87\u0EDC\u0EC9\u0EAD\u0E8D 8 \u0E95\u0EBB\u0EA7\u0EAD\u0EB1\u0E81\u0EAA\u0EAD\u0E99",
  passwordsMatch:
    "\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99\u0E81\u0EBB\u0E87\u0E81\u0EB1\u0E99",
  passwordsDoNotMatch:
    "\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99\u0E9A\u0ECD\u0EC8\u0E81\u0EBB\u0E87\u0E81\u0EB1\u0E99",
  termsNotice:
    "\u0EC2\u0E94\u0E8D\u0E81\u0EB2\u0E99\u0EA5\u0EBB\u0E87\u0E97\u0EB0\u0E9A\u0EBD\u0E99, \u0E97\u0EC8\u0EB2\u0E99\u0EC0\u0EAB\u0EB1\u0E99\u0E94\u0EB5\u0E81\u0EB1\u0E9A",
  termsOfService:
    "\u0EC0\u0E87\u0EB7\u0EC8\u0EAD\u0E99\u0EC4\u0E82\u0E81\u0EB2\u0E99\u0E99\u0EB3\u0EC3\u0E8A\u0EC9",
  and: "\u0EC1\u0EA5\u0EB0",
  privacyPolicy:
    "\u0E99\u0EB0\u0EC2\u0E8D\u0E9A\u0EB2\u0E8D\u0E84\u0EA7\u0EB2\u0EA1\u0EC0\u0E9B\u0EB1\u0E99\u0EAA\u0EC8\u0EA7\u0E99\u0E95\u0EBB\u0EA7",
  feature1Title:
    "\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99 \u0ec1\u0ea5\u0eb0 \u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1\u0e97\u0eb2\u0e87\u0e81\u0eb2\u0e99",
  feature1Desc:
    "\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec0\u0e96\u0eb4\u0e87\u0ec1\u0e9a\u0e9a\u0e9f\u0ead\u0ea1\u0e9e\u0eb2\u0eaa\u0eb5\u0ead\u0eb2\u0e81\u0ead\u0e99, \u0ea5\u0eb0\u0e9a\u0ebd\u0e9a\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5 \u0ec1\u0ea5\u0eb0 \u0e94\u0eb3\u0ea5\u0eb1\u0e94\u0e97\u0eb2\u0e87\u0e81\u0eb2\u0e99",
  feature2Title:
    "\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e9f\u0ea5\u0ecc\u0ec4\u0e94\u0ec9\u0ea7\u0ec8\u0ead\u0e87\u0ec4\u0ea7",
  feature2Desc:
    "\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94\u0ec4\u0e9f\u0ea5\u0ecc Word, Excel \u0ec1\u0ea5\u0eb0 PDF \u0e97\u0eb5\u0ec8\u0e81\u0ea7\u0e94\u0eaa\u0ead\u0e9a\u0ec1\u0ea5\u0ec9\u0ea7\u0ec4\u0e94\u0ec9\u0ec2\u0e94\u0e8d\u0e9a\u0ecd\u0ec8\u0e88\u0eb3\u0e81\u0eb1\u0e94",
  feature3Title:
    "\u0ead\u0eb1\u0e9a\u0ec0\u0e94\u0e94\u0ea2\u0ec8\u0eb2\u0e87\u0e95\u0ecd\u0ec8\u0ec0\u0e99\u0eb7\u0ec8\u0ead\u0e87",
  feature3Desc:
    "\u0e95\u0eb4\u0e94\u0e95\u0eb2\u0ea1\u0e81\u0eb3\u0e99\u0ebb\u0e94\u0ec0\u0ea7\u0ea5\u0eb2\u0ec1\u0e88\u0ec9\u0e87\u0e9e\u0eb2\u0eaa\u0eb5\u0ead\u0eb2\u0e81\u0ead\u0e99 \u0ec1\u0ea5\u0eb0 \u0e81\u0eb2\u0e99\u0e9b\u0ec8\u0ebd\u0e99\u0ec1\u0e9b\u0e87\u0ea5\u0eb0\u0e9a\u0ebd\u0e9a\u0e81\u0eb2\u0e99\u0eab\u0ebc\u0ec9\u0eb2\u0eaa\u0eb8\u0e94",
  trustBadge:
    "\u0eaa\u0eb9\u0e99\u0ea5\u0ea7\u0ea1\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0e94\u0ec9\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5 \u0ec1\u0ea5\u0eb0 \u0e81\u0ebb\u0e94\u0edd\u0eb2\u0e8d",
  trustMembers:
    "\u0ec4\u0e94\u0ec9\u0eae\u0eb1\u0e9a\u0e84\u0ea7\u0eb2\u0ea1\u0ec4\u0ea7\u0ec9\u0ea7\u0eb2\u0e87\u0ec3\u0e88\u0e88\u0eb2\u0e81\u0e9c\u0eb9\u0ec9\u0e8a\u0ec8\u0ebd\u0ea7\u0e8a\u0eb2\u0e99\u0e94\u0ec9\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5 \u0ec1\u0ea5\u0eb0 \u0e81\u0eb2\u0e99\u0ec0\u0e87\u0eb4\u0e99",
  signInNow:
    "\u0EC0\u0E82\u0EBB\u0EC9\u0EB2\u0EAA\u0EB9\u0EC8\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A\u0E94\u0EBD\u0EA7\u0E99\u0EB5\u0EC9",
  registrationSuccessful:
    "\u0EA5\u0EBB\u0E87\u0E97\u0EB0\u0E9A\u0EBD\u0E99\u0EAA\u0EB3\u0EC0\u0EA5\u0EB1\u0E94\u0EC1\u0EA5\u0EC9\u0EA7!",
  firstName: "\u0E8A\u0EB7\u0EC8",
  lastName: "\u0E99\u0EB2\u0EA1\u0EAA\u0EB0\u0E81\u0EB8\u0E99",
  phone: "\u0EC0\u0E9A\u0EB5\u0EC2\u0E97",
  address: "ທີ່ຢູ່",
  website: "ເວັບໄຊທ໌",
  profileTab: "\u0EC2\u0E9B\u0EA3\u0EC4\u0E9F\u0EA5\u0ECC",
  securityTab: "\u0E84\u0EA7\u0EB2\u0EA1\u0E9B\u0EAD\u0E94\u0EC4\u0E9E",
  loginMethodsTab:
    "\u0ea7\u0eb4\u0e97\u0eb5\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a",
  membershipTab: "\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81\u0E9E\u0EB2\u0E9A",
  favoritesTab:
    "\u0EA5\u0EB2\u0E8D\u0E81\u0EB2\u0E99\u0E97\u0EB5\u0EC8\u0EA1\u0EB1\u0E81",
  downloadsTab:
    "\u0e9b\u0eb0\u0eab\u0ea7\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94",
  quizHistoryTab:
    "\u0E9B\u0EB0\u0EAB\u0EA7\u0EB1\u0E94\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  changePhoto: "\u0E9B\u0EC8\u0EBD\u0E99\u0EAE\u0EB9\u0E9A",
  removePhoto: "\u0EA5\u0EB6\u0E9A\u0EAE\u0EB9\u0E9A",
  currentPassword:
    "\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99\u0E9B\u0EB1\u0E94\u0E88\u0EB8\u0E9A\u0EB1\u0E99",
  newPassword:
    "\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0e9c\u0ec8\u0eb2\u0e99\u0ec3\u0edd\u0ec8",
  changePassword:
    "\u0E9B\u0EC8\u0EBD\u0E99\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99",
  passwordChanged:
    "\u0E9B\u0EC8\u0EBD\u0E99\u0EA5\u0EB0\u0EAB\u0EB1\u0E94\u0E9C\u0EC8\u0EB2\u0E99\u0EAA\u0EB3\u0EC0\u0EA5\u0EB1\u0E94\u0EC1\u0EA5\u0EC9\u0EA7",
  profileSaved:
    "\u0E9A\u0EB1\u0E99\u0E97\u0EB6\u0E81\u0EC2\u0E9B\u0EA3\u0EC4\u0E9F\u0EA5\u0ECC\u0EAA\u0EB3\u0EC0\u0EA5\u0EB1\u0E94\u0EC1\u0EA5\u0EC9\u0EA7",
  membershipLevel:
    "\u0EA5\u0EB0\u0E94\u0EB1\u0E9A\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81",
  membershipExpires: "\u0edd\u0ebb\u0e94\u0ead\u0eb2\u0e8d\u0eb8",
  noExpiry:
    "\u0e9a\u0ecd\u0ec8\u0ea1\u0eb5\u0ea7\u0eb1\u0e99\u0edd\u0ebb\u0e94\u0ead\u0eb2\u0e8d\u0eb8",
  emailConnected:
    "\u0ec0\u0e8a\u0eb7\u0ec8\u0ead\u0ea1\u0e95\u0ecd\u0ec8\u0ead\u0eb5\u0ec0\u0ea1\u0ea7\u0ec1\u0ea5\u0ec9\u0ea7",
  connected:
    "\u0ec0\u0e8a\u0eb7\u0ec8\u0ead\u0ea1\u0e95\u0ecd\u0ec8\u0ec1\u0ea5\u0ec9\u0ea7",
  notConnected:
    "\u0E8D\u0EB1\u0E87\u0E9A\u0ECD\u0EC8\u0EC0\u0E8A\u0EB7\u0EC8\u0EAD\u0EA1\u0E95\u0ECD\u0EC8",
  emptyFavorites:
    "\u0E8D\u0EB1\u0E87\u0E9A\u0ECD\u0EC8\u0EA1\u0EB5\u0EA5\u0EB2\u0E8D\u0E81\u0EB2\u0E99\u0E97\u0EB5\u0EC8\u0EA1\u0EB1\u0E81",
  emptyDownloads:
    "\u0e8d\u0eb1\u0e87\u0e9a\u0ecd\u0ec8\u0ea1\u0eb5\u0e9b\u0eb0\u0eab\u0ea7\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e94\u0eb2\u0ea7\u0ec2\u0eab\u0ebc\u0e94",
  emptyQuizHistory:
    "\u0E8D\u0EB1\u0E87\u0E9A\u0ECD\u0EC8\u0EA1\u0EB5\u0E9B\u0EB0\u0EAB\u0EA7\u0EB1\u0E94\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  stubHint:
    "\u0EAA\u0EC8\u0EA7\u0E99\u0E99\u0EB5\u0EC9\u0E88\u0EB0\u0EC0\u0E9E\u0EB5\u0EC8\u0EA1\u0EC0\u0E95\u0EB5\u0EA1\u0EC3\u0E99\u0EC4\u0EA7\u0EC6\u0E99\u0EB5\u0EC9",
  accountLead:
    "\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0E82\u0ECD\u0EC9\u0EA1\u0EB9\u0E99\u0E9A\u0EB1\u0E99\u0E8A\u0EB5 \u0E84\u0EA7\u0EB2\u0EA1\u0E9B\u0EAD\u0E94\u0EC4\u0E9E \u0EC1\u0EA5\u0EB0 \u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81\u0E9E\u0EB2\u0E9A\u0E82\u0EAD\u0E87\u0E97\u0EC8\u0EB2\u0E99",
  avatarHint:
    "JPEG, PNG \u0eab\u0ebc\u0eb7 WebP \u0e82\u0eb0\u0edc\u0eb2\u0e94\u0eaa\u0eb9\u0e87\u0eaa\u0eb8\u0e94 2MB",
  verified: "\u0EA2\u0EB7\u0E99\u0EA2\u0EB1\u0E99\u0EC1\u0EA5\u0EC9\u0EA7",
  unverified:
    "\u0E8D\u0EB1\u0E87\u0E9A\u0ECD\u0EC8\u0EA2\u0EB7\u0E99\u0EA2\u0EB1\u0E99",
  adminCategories: "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0edd\u0ea7\u0e94",
  adminQuizzes:
    "\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  adminMembers:
    "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81",
  newCategory: "\u0edd\u0ea7\u0e94\u0ec3\u0edd\u0ec8",
  editCategory: "\u0ec1\u0e81\u0ec9\u0ec4\u0e82\u0edd\u0ea7\u0e94",
  newQuiz:
    "\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a\u0ec3\u0edd\u0ec8",
  editQuiz:
    "\u0EC1\u0E81\u0EC9\u0EC4\u0E82\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A",
  categoryCode: "\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0edd\u0ea7\u0e94",
  quizCode:
    "\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a",
  // "Display order" in Lao, so it is not confused with the row-number column (rowNumber).
  sortOrder: "ລຳດັບການສະແດງ",
  active: "\u0ec0\u0e9b\u0eb5\u0e94\u0ec3\u0e8a\u0ec9\u0e87\u0eb2\u0e99",
  inactive: "\u0e9b\u0eb4\u0e94\u0ec3\u0e8a\u0ec9\u0e87\u0eb2\u0e99",
  published:
    "\u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8\u0ec1\u0ea5\u0ec9\u0ea7",
  draft: "\u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0eae\u0ec8\u0eb2\u0e87",
  description: "\u0e84\u0eb3\u0ead\u0eb0\u0e97\u0eb4\u0e9a\u0eb2\u0e8d",
  slug: "ຊື່ສຳລັບ URL",
  seoTitle: "\u0eab\u0ebb\u0ea7\u0e82\u0ecd\u0ec9 SEO",
  deleteCategoryConfirm:
    "\u0EA5\u0EB6\u0E9A\u0edd\u0ea7\u0e94\u0e99\u0eb5\u0ec9\u0e9a\u0ecd\u0ec8?",
  deleteQuizConfirm:
    "\u0EA5\u0EB6\u0E9A\u0EC1\u0E9A\u0E9A\u0E97\u0EBB\u0E94\u0EAA\u0EAD\u0E9A\u0E99\u0EB5\u0EC9\u0E9A\u0ECD\u0EC8?",
  staffRole:
    "\u0e9a\u0ebb\u0e94\u0e9a\u0eb2\u0e94\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99",
  accountStatus:
    "\u0eaa\u0eb0\u0e96\u0eb2\u0e99\u0eb0\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
  approveVip: "\u0ead\u0eb0\u0e99\u0eb8\u0ea1\u0eb1\u0e94 VIP",
  renewVip: "\u0e95\u0ecd\u0ec8\u0ead\u0eb2\u0e8d\u0eb8 VIP",
  cancelVip: "\u0e8d\u0ebb\u0e81\u0ec0\u0ea5\u0eb5\u0e81 VIP",
  suspend: "\u0ea5\u0eb0\u0e87\u0eb1\u0e9a\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
  activateAccount:
    "\u0ec0\u0e9b\u0eb5\u0e94\u0ec3\u0e8a\u0ec9\u0e87\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5",
  noMembers:
    "\u0e9a\u0ecd\u0ec8\u0e9e\u0ebb\u0e9a\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81",
  questionsJson: "\u0E84\u0EB3\u0E96\u0EB2\u0EA1 (JSON)",
  passPercent:
    "\u0ec0\u0e9b\u0eb5\u0ec0\u0e8a\u0eb1\u0e99\u0e84\u0eb0\u0ec1\u0e99\u0e99\u0e9c\u0ec8\u0eb2\u0e99",
  adminDocsLead:
    "\u0eaa\u0ec9\u0eb2\u0e87, \u0ec1\u0e81\u0ec9\u0ec4\u0e82 \u0ec1\u0ea5\u0eb0 \u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99.",
  adminCatsLead:
    "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0edd\u0ea7\u0e94\u0e84\u0ea7\u0eb2\u0ea1\u0eae\u0eb9\u0ec9\u0eaa\u0ead\u0e87\u0e9e\u0eb2\u0eaa\u0eb2.",
  adminQuizzesLead:
    "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a, \u0e84\u0eb3\u0e96\u0eb2\u0ea1 \u0ec1\u0ea5\u0eb0 \u0eaa\u0eb0\u0e96\u0eb2\u0e99\u0eb0\u0e81\u0eb2\u0e99\u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8.",
  adminMembersLead:
    "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e9a\u0ebb\u0e94\u0e9a\u0eb2\u0e94, \u0eaa\u0eb0\u0e96\u0eb2\u0e99\u0eb0\u0e9a\u0eb1\u0e99\u0e8a\u0eb5 \u0ec1\u0ea5\u0eb0 VIP.",
  staffAccess:
    "\u0eaa\u0eb4\u0e94\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec3\u0e8a\u0ec9\u0eab\u0ebc\u0eb1\u0e87\u0e9a\u0ec9\u0eb2\u0e99",
  staffAccessLead:
    "\u0e81\u0eb3\u0e99\u0ebb\u0e94\u0e9a\u0ebb\u0e94\u0e9a\u0eb2\u0e94\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99\u0ec3\u0eab\u0ec9\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81\u0ec0\u0e9e\u0eb7\u0ec8\u0ead\u0ec3\u0eab\u0ec9\u0eaa\u0eb2\u0ea1\u0eb2\u0e94\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0eab\u0ebc\u0eb1\u0e87\u0e9a\u0ec9\u0eb2\u0e99\u0ec4\u0e94\u0ec9.",
  backendPermission:
    "\u0eaa\u0eb4\u0e94\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0eab\u0ebc\u0eb1\u0e87\u0e9a\u0ec9\u0eb2\u0e99",
  roleMember:
    "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81 (\u0e9a\u0ecd\u0ec8\u0ea1\u0eb5\u0eaa\u0eb4\u0e94\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0ec3\u0e8a\u0ec9\u0eab\u0ebc\u0eb1\u0e87\u0e9a\u0ec9\u0eb2\u0e99)",
  roleEditor: "ບັນນາທິການ",
  roleAdmin: "ຜູ້ດູແລລະບົບ",
  roleOwner: "ເຈົ້າຂອງ",
  selectSearch: "ຄົ້ນຫາ…",
  registerNameRequired: "ກະລຸນາໃສ່ຊື່ ແລະ ນາມສະກຸນ",
  navGroupOverview: "ພາບລວມ",
  navGroupContent: "ເນື້ອຫາ",
  navGroupAdministration: "ການຈັດການລະບົບ",
  selectNoResults: "ບໍ່ພົບລາຍການທີ່ກົງກັນ",
  roleEditorDesc:
    "\u0eaa\u0ec9\u0eb2\u0e87 \u0ec1\u0ea5\u0eb0 \u0ec1\u0e81\u0ec9\u0ec4\u0e82\u0ec0\u0ead\u0e81\u0eb0\u0eaa\u0eb2\u0e99 \u0ec1\u0ea5\u0eb0 \u0eaa\u0eb0\u0e9a\u0eb1\u0e9a\u0eae\u0ec8\u0eb2\u0e87\u0ec1\u0e9a\u0e9a\u0e97\u0ebb\u0e94\u0eaa\u0ead\u0e9a.",
  roleAdminDesc:
    "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e97\u0eb8\u0e81\u0eaa\u0ec8\u0ea7\u0e99, \u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81, VIP, \u0e81\u0eb2\u0e99\u0e95\u0eb1\u0ec9\u0e87\u0e84\u0ec8\u0eb2, \u0e81\u0eb2\u0e99\u0ec0\u0e9c\u0eb5\u0e8d\u0ec1\u0e9c\u0ec8 \u0ec1\u0ea5\u0eb0 \u0e81\u0eb2\u0e99\u0EA5\u0EB6\u0E9A.",
  roleOwnerDesc:
    "\u0ea1\u0eb5\u0eaa\u0eb4\u0e94\u0ec0\u0e97\u0ebb\u0ec8\u0eb2\u0e81\u0eb1\u0e9a\u0e9c\u0eb9\u0ec9\u0e94\u0eb9\u0ec1\u0ea5\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a \u0ec1\u0ea5\u0eb0 \u0eaa\u0eb2\u0ea1\u0eb2\u0e94\u0ec1\u0e95\u0ec8\u0e87\u0e95\u0eb1\u0ec9\u0e87\u0ec0\u0e88\u0ebb\u0ec9\u0eb2\u0e82\u0ead\u0e87\u0ec4\u0e94\u0ec9.",
  allMembers:
    "\u0eaa\u0eb0\u0ea1\u0eb2\u0e8a\u0eb4\u0e81\u0e97\u0eb1\u0e87\u0edd\u0ebb\u0e94",
  staffOnly:
    "\u0eaa\u0eb0\u0ec0\u0e9e\u0eb2\u0eb0\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99",
  addBackendPermission:
    "\u0EC0\u0E9E\u0EB5\u0EC8\u0EA1\u0EAA\u0EB4\u0E94\u0E97\u0EB4\u0EAB\u0EBC\u0EB1\u0E87\u0E9A\u0EC9\u0EB2\u0E99",
  backendStaff:
    "\u0E9C\u0EB9\u0EC9\u0EA1\u0EB5\u0EAA\u0EB4\u0E94\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0EAB\u0EBC\u0EB1\u0E87\u0E9A\u0EC9\u0EB2\u0E99",
  searchMemberToAdd:
    "\u0E84\u0EBB\u0EC9\u0E99\u0EAB\u0EB2\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81\u0EC0\u0E9E\u0EB7\u0EC8\u0EAD\u0EC0\u0E9E\u0EB5\u0EC8\u0EA1\u0EAA\u0EB4\u0E94\u0E97\u0EB4",
  selectRole:
    "\u0ec0\u0ea5\u0eb7\u0ead\u0e81\u0e9a\u0ebb\u0e94\u0e9a\u0eb2\u0e94",
  grantPermission: "\u0EA1\u0EAD\u0E9A\u0EAA\u0EB4\u0E94\u0E97\u0EB4",
  permissionGranted:
    "\u0EAD\u0EB1\u0E9A\u0EC0\u0E94\u0E94\u0EAA\u0EB4\u0E94\u0E97\u0EB4\u0EAA\u0EB3\u0EC0\u0EA5\u0EB1\u0E94",
  currentAdminProfile:
    "\u0EC2\u0E9B\u0EA3\u0EC4\u0E9F\u0EA5\u0ECC\u0E9C\u0EB9\u0EC9\u0E94\u0EB9\u0EC1\u0EA5\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  activeStaffCount:
    "\u0E9C\u0EB9\u0EC9\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0EAB\u0EBC\u0EB1\u0E87\u0E9A\u0EC9\u0EB2\u0E99",
  quickActions: "\u0EC0\u0EA1\u0E99\u0EB9\u0E94\u0EC8\u0EA7\u0E99",
  systemOverview:
    "\u0E9E\u0EB2\u0E9A\u0EA5\u0EA7\u0EA1\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A",
  manageAllMembers:
    "\u0E88\u0EB1\u0E94\u0E81\u0EB2\u0E99\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81\u0E97\u0EB1\u0E87\u0EDD\u0EBB\u0E94",
  revokePermission: "\u0E96\u0EAD\u0E99\u0EAA\u0EB4\u0E94\u0E97\u0EB4",
  permissionLevel:
    "\u0EA5\u0EB0\u0E94\u0EB1\u0E9A\u0EAA\u0EB4\u0E94\u0E97\u0EB4",
  searchUserPlaceholder:
    "\u0E9E\u0EB4\u0EA1\u0E8A\u0EB7\u0EC8 \u0EAB\u0EBC\u0EB7 \u0EAD\u0EB5\u0EC0\u0EA1\u0EA7\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81...",
  noUsersFound:
    "\u0E9A\u0ECD\u0EC8\u0E9E\u0EBB\u0E9A\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81\u0E97\u0EB5\u0EC8\u0E81\u0EBB\u0E87\u0E81\u0EB1\u0E99",
  confirmGrant:
    "\u0ea2\u0eb7\u0e99\u0ea2\u0eb1\u0e99\u0e81\u0eb2\u0e99\u0ea1\u0ead\u0e9a\u0eaa\u0eb4\u0e94\u0e97\u0eb4",
  close: "\u0E9B\u0EB4\u0E94",
  rolePromotionHelp:
    "\u0EC0\u0EA5\u0EB7\u0EAD\u0E81\u0EAA\u0EB0\u0EA1\u0EB2\u0E8A\u0EB4\u0E81 \u0EC1\u0EA5\u0EB0 \u0E81\u0EB3\u0E99\u0EBB\u0E94\u0E9A\u0EBB\u0E94\u0E9A\u0EB2\u0E94\u0EC0\u0E9E\u0EB7\u0EC8\u0EAD\u0EC3\u0EAB\u0EC9\u0EC0\u0E82\u0EBB\u0EC9\u0EB2\u0EC0\u0E96\u0EB4\u0E87\u0EA5\u0EB0\u0E9A\u0EBB\u0E9A\u0EAB\u0EBC\u0EB1\u0E87\u0E9A\u0EC9\u0EB2\u0E99",
  myPermissions:
    "\u0EAA\u0EB4\u0E94\u0E97\u0EB4\u0E82\u0EAD\u0E87\u0E97\u0EC8\u0EB2\u0E99",
  onlineStatus: "\u0EAD\u0EAD\u0E99\u0EA5\u0EB2\u0E8D",
  quickStaffAdd:
    "\u0ec0\u0e9e\u0eb5\u0ec8\u0ea1\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99",
  all: "ທັງໝົດ",
  category: "ໝວດ",
  archived: "ເກັບໄວ້ໃນຄັງ",
  accessMembers: "ສະມາຊິກ",
  allStatuses: "ທຸກສະຖານະ",
  dismiss: "ປິດ",
  retry: "ລອງອີກຄັ້ງ",
  remove: "ລຶບ",
  removing: "ກຳລັງລຶບ…",
  deleting: "ກຳລັງລຶບ…",
  saving: "ກຳລັງບັນທຶກ…",
  download: "ດາວໂຫຼດ",
  details: "ລາຍລະອຽດ",
  summary: "ສະຫຼຸບ",
  created: "ສ້າງເມື່ອ",
  lastUpdated: "ອັບເດດລ່າສຸດ",
  searchDocuments: "ຄົ້ນຫາເອກະສານ",
  clearSearch: "ລ້າງຄຳຄົ້ນຫາ",
  moreFilters: "ຕົວກັ່ນຕອງເພີ່ມເຕີມ",
  yearPlaceholder: "ເຊັ່ນ: 2026",
  updatedFrom: "ອັບເດດຕັ້ງແຕ່",
  updatedUntil: "ອັບເດດຮອດ",
  filterByAccess: "ກັ່ນຕອງຕາມສິດອ່ານ",
  colDocument: "ເອກະສານ",
  colUpdated: "ອັບເດດ",
  colActions: "ຈັດການ",
  docCount: "ເອກະສານ {count} ລາຍການ",
  docCountOne: "ເອກະສານ {count} ລາຍການ",
  docMatchCount: "ພົບ {count} ເອກະສານທີ່ກົງກັບຕົວກັ່ນຕອງ",
  docMatchCountOne: "ພົບ {count} ເອກະສານທີ່ກົງກັບຕົວກັ່ນຕອງ",
  fileCount: "{count} ໄຟລ໌",
  fileCountOne: "{count} ໄຟລ໌",
  updatedOn: "ອັບເດດ {date}",
  openItem: "ເປີດ {title}",
  untitledDocument: "ເອກະສານບໍ່ມີຊື່",
  documentDeleted: "ລຶບເອກະສານແລ້ວ.",
  documentDeleteFailed: "ບໍ່ສາມາດລຶບເອກະສານໄດ້.",
  documentsLoadFailed: "ບໍ່ສາມາດໂຫຼດເອກະສານໄດ້",
  noDocumentsMatch: "ບໍ່ມີເອກະສານທີ່ກົງກັບຕົວກັ່ນຕອງ",
  noDocumentsMatchHint: "ລອງໃຊ້ຄຳຄົ້ນຫາອື່ນ ຫຼື ລ້າງຕົວກັ່ນຕອງ.",
  noDocumentsYet: "ຍັງບໍ່ມີເອກະສານ",
  noDocumentsYetHint: "ສ້າງເອກະສານທຳອິດຂອງທ່ານເພື່ອເລີ່ມຕົ້ນ.",
  loadingDocuments: "ກຳລັງໂຫຼດເອກະສານ",
  noCoverImage: "ບໍ່ມີຮູບໜ້າປົກ",
  coverOf: "ໜ້າປົກ: {title}",
  documentLoadFailed: "ບໍ່ສາມາດໂຫຼດເອກະສານນີ້ໄດ້",
  backToDocuments: "ກັບໄປລາຍການເອກະສານ",
  backToDocument: "ກັບໄປໜ້າເອກະສານ",
  viewOnSite: "ເບິ່ງໃນເວັບໄຊ",
  showingDefaultCover: "ກຳລັງສະແດງໜ້າປົກເລີ່ມຕົ້ນ.",
  showingCategoryImage: "ກຳລັງສະແດງຮູບຂອງໝວດ.",
  uploadCover: "ອັບໂຫຼດໜ້າປົກ",
  manageFiles: "ຈັດການໄຟລ໌",
  vipDownload: "ດາວໂຫຼດສະເພາະ VIP",
  membersDownload: "ດາວໂຫຼດສະເພາະສະມາຊິກ",
  noFilesYet: "ຍັງບໍ່ມີໄຟລ໌ແນບ.",
  removeFileConfirm: 'ລຶບ "{name}" ອອກຈາກເອກະສານນີ້ບໍ່?',
  fileRemoveFailed: "ບໍ່ສາມາດລຶບໄຟລ໌ໄດ້.",
  formLoadFailed: "ບໍ່ສາມາດໂຫຼດແບບຟອມໄດ້",
  editLoadFailed: "ບໍ່ສາມາດເປີດເອກະສານນີ້ເພື່ອແກ້ໄຂໄດ້",
  categoriesLoadFailed: "ບໍ່ສາມາດໂຫຼດໝວດໄດ້",
  requiredFieldsLead: "ຕື່ມຂໍ້ມູນລຸ່ມນີ້. ຊ່ອງທີ່ມີເຄື່ອງໝາຍ * ແມ່ນຈຳເປັນ.",
  basicInformation: "ຂໍ້ມູນພື້ນຖານ",
  tagsHint: "ແຍກປ້າຍກຳກັບດ້ວຍເຄື່ອງໝາຍຈຸດ (,), ເຊັ່ນ: ພາສີ, 2026, VAT",
  publishing: "ການເຜີຍແຜ່",
  onlyAdminsChangeStatus: "ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນທີ່ປ່ຽນສະຖານະໄດ້.",
  readAccessHint: "ກຳນົດວ່າໃຜສາມາດອ່ານເອກະສານນີ້ໃນເວັບໄຊໄດ້.",
  coverImage: "ຮູບໜ້າປົກ",
  coverImageHint:
    "JPG, PNG ຫຼື WebP, ບໍ່ເກີນ 2 MB. ຂະໜາດທີ່ເໝາະສົມ: 1200 × 1600 px.",
  coverInvalid: "ກະລຸນາເລືອກຮູບ JPG, PNG ຫຼື WebP ຂະໜາດບໍ່ເກີນ 2 MiB.",
  coverPreviewAlt: "ຕົວຢ່າງໜ້າປົກເອກະສານ",
  defaultCoverAlt: "ຕົວຢ່າງໜ້າປົກເລີ່ມຕົ້ນ",
  defaultImage: "ຮູບເລີ່ມຕົ້ນ",
  addImagePrompt: "ກະລຸນາເພີ່ມຮູບພາບ",
  coverUsedAsDocumentCover: "ຮູບນີ້ຈະເປັນໜ້າປົກຂອງເອກະສານ.",
  previewUnavailable: "ບໍ່ສາມາດສະແດງຕົວຢ່າງໄດ້",
  noCover: "ບໍ່ມີໜ້າປົກ",
  notSavedYet: "ຍັງບໍ່ໄດ້ບັນທຶກ",
  replaceImage: "ປ່ຽນຮູບ",
  chooseImage: "ເລືອກຮູບ",
  coverRemovedOnSave: "ໜ້າປົກຈະຖືກລຶບເມື່ອທ່ານບັນທຶກ.",
  noCoverUploadedYet:
    "ຍັງບໍ່ໄດ້ອັບໂຫຼດໜ້າປົກ. ເວັບໄຊຈະສະແດງຮູບເລີ່ມຕົ້ນນີ້ຈົນກວ່າທ່ານຈະເລືອກຮູບ.",
  attachment: "ໄຟລ໌ແນບ",
  allowedFilesHint: "ອະນຸຍາດ: {types} · ບໍ່ເກີນ {size} MB",
  currentFile: "ໄຟລ໌ປັດຈຸບັນ:",
  uploadReplacement: "ອັບໂຫຼດໄຟລ໌ໃໝ່ແທນ",
  uploadFile: "ອັບໂຫຼດໄຟລ໌",
  displayName: "ຊື່ທີ່ສະແດງ",
  displayNamePlaceholder: "ເຊັ່ນ: ເອກະສານສະບັບເຕັມ (PDF)",
  version: "ສະບັບ",
  whoCanDownload: "ຜູ້ທີ່ດາວໂຫຼດໄດ້",
  advancedFileDetails: "ລາຍລະອຽດໄຟລ໌ຂັ້ນສູງ",
  autoFilledOnUpload: "ຈະຖືກຕື່ມອັດຕະໂນມັດເມື່ອທ່ານອັບໂຫຼດໄຟລ໌.",
  fileName: "ຊື່ໄຟລ໌",
  fileType: "ປະເພດໄຟລ໌",
  sizeBytes: "ຂະໜາດ (bytes)",
  contentLao: "ເນື້ອຫາ — ພາສາລາວ",
  contentEnglish: "ເນື້ອຫາ — ພາສາອັງກິດ",
  summaryHint: "ຄຳອະທິບາຍສັ້ນໆ ທີ່ສະແດງໃນລາຍການເອກະສານ.",
  body: "ເນື້ອຫາ",
  bodyHint:
    "ເນື້ອຫາເຕັມທີ່ຜູ້ອ່ານເຫັນໃນໜ້າເອກະສານ. ໃຊ້ຫົວຂໍ້ ແລະ ລາຍການເພື່ອຈັດລຽງເນື້ອຫາ.",
  webAddressOptional: "ທີ່ຢູ່ເວັບ (ບໍ່ບັງຄັບ)",
  urlSlug: "ຊື່ສຳລັບ URL",
  slugHint: "ປ່ອຍຫວ່າງໄວ້ເພື່ອສ້າງຈາກຫົວຂໍ້ອັດຕະໂນມັດ.",
  fileTypeNotAllowed: "ບໍ່ອະນຸຍາດໄຟລ໌ປະເພດ .{ext}.",
  fileTooLarge:
    "ໄຟລ໌ນີ້ມີຂະໜາດ {size}; ຂະໜາດສູງສຸດທີ່ກຳນົດໃນການຕັ້ງຄ່າແມ່ນ {limit}.",
  uploadFailed: "ອັບໂຫຼດບໍ່ສຳເລັດ",
  coverUploadFailedAfterSave:
    "ບັນທຶກເອກະສານແລ້ວ, ແຕ່ອັບໂຫຼດໜ້າປົກບໍ່ສຳເລັດ: {reason}",
  fileUploadFailedAfterSave:
    "ບັນທຶກເອກະສານແລ້ວ, ແຕ່ອັບໂຫຼດໄຟລ໌ບໍ່ສຳເລັດ: {reason}",
  saveFailed: "ບັນທຶກບໍ່ສຳເລັດ",
  uploadingFile: "ກຳລັງອັບໂຫຼດໄຟລ໌…",
  uploadProgress: "ຄວາມຄືບໜ້າການອັບໂຫຼດ",
  uploadingPercent: "ກຳລັງອັບໂຫຼດ… {percent}%",
  saveChanges: "ບັນທຶກການປ່ຽນແປງ",
  createDocument: "ສ້າງເອກະສານ",
  closeMenu: "ປິດເມນູ",
  adminNavigation: "ເມນູຫຼັງບ້ານ",
  notifications: "ການແຈ້ງເຕືອນ",
  mainNavigation: "ເມນູຫຼັກ",
  mobileNavigation: "ເມນູມືຖື",
  pagination: "ການແບ່ງໜ້າ",
  breadcrumb: "ເສັ້ນທາງນຳທາງ",
  rowNumber: "ລຳດັບ",
  accountSuspended: "ຖືກລະງັບ",
  backToTop: "ກັບຂຶ້ນເທິງສຸດ",
  newNotifications: "ມີການແຈ້ງເຕືອນໃໝ່",
  viewDashboard: "ເບິ່ງແຜງຄວບຄຸມ",
  vipDownloadOnly: "ສະເພາະສະມາຊິກ VIP",
  fileNotAvailable: "ໄຟລ໌ຍັງບໍ່ພ້ອມ",
  noFileUploaded: "ຍັງບໍ່ໄດ້ອັບໂຫຼດໄຟລ໌",
  emptyDownloadsHint: "ໄຟລ໌ທີ່ທ່ານດາວໂຫຼດ ຈະສະແດງຢູ່ບ່ອນນີ້.",
  emptyQuizHistoryHint: "ຜົນແບບທົດສອບທີ່ທ່ານສົ່ງ ຈະສະແດງຢູ່ບ່ອນນີ້.",
  quizScore: "{correct}/{total} ຂໍ້ ({percent}%)",
  yearHint: "ໃຊ້ກັ່ນຕອງເອກະສານຕາມປີ ໃນໜ້າເອກະສານ.",
  effectiveDateHint: "ວັນທີທີ່ເອກະສານເລີ່ມມີຜົນບັງຄັບໃຊ້ (ບໍ່ບັງຄັບ).",
  displayNameHint: "ຊື່ທີ່ຜູ້ອ່ານເຫັນໃນລາຍການໄຟລ໌ ຂອງໜ້າເອກະສານ.",
  versionHint: "ເຊັ່ນ 1.0; ສະແດງຄູ່ກັບຊື່ໄຟລ໌.",
  whoCanDownloadHint:
    "ສະມາຊິກ: ທຸກຄົນທີ່ເຂົ້າສູ່ລະບົບ. VIP: ສະເພາະສະມາຊິກ VIP.",
  emailReadonlyHint: "ໃຊ້ເຂົ້າສູ່ລະບົບ; ບໍ່ສາມາດປ່ຽນໄດ້ຢູ່ບ່ອນນີ້.",
  sortBy: "ຮຽງຕາມ",
  sortNewest: "ເຂົ້າຮ່ວມລ່າສຸດ",
  sortOldest: "ເຂົ້າຮ່ວມກ່ອນ",
  sortNameAsc: "ຊື່ ກ–ຮ",
  sortNameDesc: "ຊື່ ຮ–ກ",
  vipOnly: "ສະເພາະ VIP",
  vipCount: "ສະມາຊິກ VIP {count} ຄົນ",
  vipCountOne: "ສະມາຊິກ VIP {count} ຄົນ",
  joinedOn: "ເຂົ້າຮ່ວມ {date}",
  categoryCount: "ໝວດທັງໝົດ {count} ໝວດ",
  categoryCountOne: "ໝວດທັງໝົດ {count} ໝວດ",
  quizCount: "ແບບທົດສອບທັງໝົດ {count} ຊຸດ",
  quizCountOne: "ແບບທົດສອບທັງໝົດ {count} ຊຸດ",
  memberCount: "ສະມາຊິກທັງໝົດ {count} ຄົນ",
  memberCountOne: "ສະມາຊິກທັງໝົດ {count} ຄົນ",
  staffCount: "ພະນັກງານ {count} ຄົນ",
  staffCountOne: "ພະນັກງານ {count} ຄົນ",
  memberFoundCount: "ພົບ {count} ຄົນ",
  memberFoundCountOne: "ພົບ {count} ຄົນ",
  fiveStarRating: "ຄະແນນ 5 ດາວ",
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
  headline:
    "A complete center for accounting, tax-duties, and Lao law knowledge",
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
  confirmPassword: "Confirm password",
  name: "Name",
  submit: "Submit",
  forgotPassword: "Forgot password?",
  resetPassword: "Reset password",
  verifyEmail: "Email verification",
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
  viewAllDocuments: "View all documents",
  documentsLead: "Search, filter, and read public documents.",
  allCategories: "All categories",
  year: "Year",
  filter: "Filter",
  clearFilters: "Clear filters",
  noDocuments: "No documents found",
  badgePublic: "Public",
  badgeMember: "Member",
  badgeVip: "VIP",
  bodyGated: "Sign in to read the full content.",
  files: "Files",
  downloadLogin: "Sign in to download",
  noFiles: "No files",
  searchHint: "Enter a search term to begin.",
  adminDocuments: "Manage documents",
  newDocument: "New document",
  editDocument: "Edit document",
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  title: "Title",
  status: "Status",
  loading: "Loading…",
  menu: "Menu",
  previous: "Previous",
  next: "Next",
  perPage: "Per page",
  loadError: "Could not load content",
  tryAgain: "Please try again",
  passwordMismatch: "Passwords do not match",
  staffSignInRequired: "Please sign in with a staff account.",
  backToSite: "Back to site",
  saved: "Saved",
  deleteConfirm: "Delete this document?",
  documentNumber: "Document number",
  readAccess: "Read access",
  effectiveDate: "Effective date",
  tags: "Tags",
  aboutBody:
    "BAN BUNSI is a knowledge center for accounting, finance, tax, duties, auditing, and Lao law.",
  vipBody:
    "VIP membership unlocks premium documents. Contact the owner to request access. Online payment is not available in this release.",
  privacyBody:
    "Privacy policy details will be published by the site owner. We only use account data needed to operate the membership service.",
  contactLead: "Reach BAN BUNSI through the channels below.",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  statsDocuments: "Documents",
  statsMembers: "Members",
  statsVip: "Active VIP",
  statsPending: "Pending review",
  statsArticles: "Articles",
  statsDownloads: "Download requests",
  noCategories: "No categories found",
  browseCategory: "Browse documents",

  quizzesLead: "Pick a quiz to practice your knowledge.",
  startQuiz: "Start quiz",
  questions: "Questions",
  difficulty: "Difficulty",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  submitQuiz: "Submit answers",
  quizResult: "Quiz result",
  scoreLabel: "Score",
  passed: "Passed",
  failed: "Not passed",
  tryAgainQuiz: "Try again",
  backToQuizzes: "Back to quizzes",
  explanation: "Explanation",
  correctAnswer: "Correct answer",
  yourAnswer: "Your answer",
  noQuizzes: "No quizzes yet",
  passScore: "Pass score",
  homeDocsLead:
    "Newest published documents. Read free, download after sign-in.",
  homeCatsLead: "Pick a category to find documents faster.",
  homePromoTitle: "Sign in to download files and read full content",
  homePromoLead: "VIP unlocks premium document access.",
  featureFormsDesc: "Forms and legal documents",
  featureCalendarDesc: "Browse tax categories and deadlines",
  featureGuidesDesc: "Read guides by topic",
  authAsideLead: "Sign in to download files and read full document content.",
  loginLead: "Sign in to download forms and documents.",
  registerLead: "Create an account to download and use public documents.",
  noAccountYet: "No account yet?",
  haveAccount: "Already have an account?",
  backHome: "Back to home",
  welcomeBack: "Welcome back",
  createAccount: "Create account",
  rememberMe: "Remember me",
  showPassword: "Show password",
  hidePassword: "Hide password",
  passwordMinChars: "At least 8 characters",
  passwordsMatch: "Passwords match",
  passwordsDoNotMatch: "Passwords do not match",
  termsNotice: "By creating an account, you agree to our",
  termsOfService: "Terms of Use",
  and: "and",
  privacyPolicy: "Privacy Policy",
  feature1Title: "Official Documents & Forms",
  feature1Desc:
    "Access tax forms, accounting regulations, and official decrees",
  feature2Title: "Fast File Downloads",
  feature2Desc: "Download verified Word, Excel, and PDF files without limits",
  feature3Title: "Always Up to Date",
  feature3Desc: "Stay ahead with latest tax deadlines and regulatory changes",
  trustBadge: "Accounting & Legal Hub",
  trustMembers: "Trusted by accounting and finance professionals",
  signInNow: "Sign in now",
  registrationSuccessful: "Registration successful!",
  firstName: "First name",
  lastName: "Last name",
  phone: "Phone",
  address: "Address",
  website: "Website",
  profileTab: "Profile",
  securityTab: "Security",
  loginMethodsTab: "Login methods",
  membershipTab: "Membership",
  favoritesTab: "Favorites",
  downloadsTab: "Downloads",
  quizHistoryTab: "Quiz history",
  changePhoto: "Change photo",
  removePhoto: "Remove photo",
  currentPassword: "Current password",
  newPassword: "New password",
  changePassword: "Change password",
  passwordChanged: "Password updated",
  profileSaved: "Profile saved",
  membershipLevel: "Membership level",
  membershipExpires: "Expires",
  noExpiry: "No expiry date",
  emailConnected: "Email connected",
  connected: "Connected",
  notConnected: "Not connected",
  emptyFavorites: "No favorites yet",
  emptyDownloads: "No download history yet",
  emptyQuizHistory: "No quiz history yet",
  stubHint: "This section will be available in a later update.",
  accountLead: "Manage your profile, security, and membership.",
  avatarHint: "JPEG, PNG, or WebP up to 2MB",
  verified: "Verified",
  unverified: "Not verified",
  adminCategories: "Categories",
  adminQuizzes: "Quizzes",
  adminMembers: "Members",
  newCategory: "New category",
  editCategory: "Edit category",
  newQuiz: "New quiz",
  editQuiz: "Edit quiz",
  categoryCode: "Category code",
  quizCode: "Quiz code",
  sortOrder: "Sort order",
  active: "Active",
  inactive: "Inactive",
  published: "Published",
  draft: "Draft",
  description: "Description",
  slug: "Slug",
  seoTitle: "SEO title",
  deleteCategoryConfirm: "Delete this category?",
  deleteQuizConfirm: "Delete this quiz?",
  staffRole: "Staff role",
  accountStatus: "Account status",
  approveVip: "Approve VIP",
  renewVip: "Renew VIP",
  cancelVip: "Cancel VIP",
  suspend: "Suspend",
  activateAccount: "Activate",
  noMembers: "No members found",
  questionsJson: "Questions (JSON)",
  passPercent: "Pass percent",
  adminDocsLead: "Create, edit, and publish documents.",
  adminCatsLead: "Manage bilingual knowledge categories.",
  adminQuizzesLead: "Manage quizzes, questions, and publish state.",
  adminMembersLead: "Manage roles, account status, and VIP.",
  staffAccess: "Backend access",
  staffAccessLead:
    "Promote a member to a staff role so they can manage the admin CMS.",
  backendPermission: "Backend permission",
  roleMember: "Member (no access)",
  roleEditor: "Editor",
  roleAdmin: "Admin",
  roleOwner: "Owner",
  selectSearch: "Search…",
  registerNameRequired: "Please enter your first and last name.",
  navGroupOverview: "Overview",
  navGroupContent: "Content",
  navGroupAdministration: "Administration",
  selectNoResults: "No matching options",
  roleEditorDesc: "Create/edit documents and quiz drafts.",
  roleAdminDesc: "All modules, members/VIP, settings, publish/delete.",
  roleOwnerDesc: "Same as admin, and can assign owner.",
  allMembers: "All members",
  staffOnly: "Staff only",
  addBackendPermission: "Add backend permission",
  backendStaff: "Backend staff & permissions",
  searchMemberToAdd: "Search member to grant access",
  selectRole: "Select permission role",
  grantPermission: "Grant permission",
  permissionGranted: "Permission updated successfully",
  currentAdminProfile: "Current admin profile",
  activeStaffCount: "Backend managers",
  quickActions: "Quick actions",
  systemOverview: "System overview",
  manageAllMembers: "Manage all members",
  revokePermission: "Revoke access",
  permissionLevel: "Permission level",
  searchUserPlaceholder: "Type member name or email...",
  noUsersFound: "No matching members found",
  confirmGrant: "Confirm permission",
  close: "Close",
  rolePromotionHelp:
    "Select a member and assign a staff role to grant backend management access.",
  myPermissions: "Your permissions",
  onlineStatus: "Online",
  quickStaffAdd: "Add staff",
  all: "All",
  category: "Category",
  archived: "Archived",
  accessMembers: "Members",
  allStatuses: "All statuses",
  dismiss: "Dismiss",
  retry: "Try again",
  remove: "Remove",
  removing: "Removing…",
  deleting: "Deleting…",
  saving: "Saving…",
  download: "Download",
  details: "Details",
  summary: "Summary",
  created: "Created",
  lastUpdated: "Last updated",
  searchDocuments: "Search documents",
  clearSearch: "Clear search",
  moreFilters: "More filters",
  yearPlaceholder: "e.g. 2026",
  updatedFrom: "Updated from",
  updatedUntil: "Updated until",
  filterByAccess: "Filter by access",
  colDocument: "Document",
  colUpdated: "Updated",
  colActions: "Actions",
  docCount: "{count} documents",
  docCountOne: "{count} document",
  docMatchCount: "{count} documents match your filters",
  docMatchCountOne: "{count} document matches your filters",
  fileCount: "{count} files",
  fileCountOne: "{count} file",
  updatedOn: "Updated {date}",
  openItem: "Open {title}",
  untitledDocument: "Untitled document",
  documentDeleted: "Document deleted.",
  documentDeleteFailed: "Could not delete the document.",
  documentsLoadFailed: "Documents could not be loaded",
  noDocumentsMatch: "No documents match your filters",
  noDocumentsMatchHint: "Try a different search term or clear the filters.",
  noDocumentsYet: "No documents yet",
  noDocumentsYetHint: "Create your first document to get started.",
  loadingDocuments: "Loading documents",
  noCoverImage: "No cover image",
  coverOf: "{title} cover",
  documentLoadFailed: "This document could not be loaded",
  backToDocuments: "Back to documents",
  backToDocument: "Back to document",
  viewOnSite: "View on site",
  showingDefaultCover: "Showing the default cover.",
  showingCategoryImage: "Showing the category image.",
  uploadCover: "Upload a cover",
  manageFiles: "Manage files",
  vipDownload: "VIP download",
  membersDownload: "Members download",
  noFilesYet: "No files attached yet.",
  removeFileConfirm: 'Remove "{name}" from this document?',
  fileRemoveFailed: "Could not remove the file.",
  formLoadFailed: "The form could not be loaded",
  editLoadFailed: "This document could not be opened for editing",
  categoriesLoadFailed: "Could not load categories",
  requiredFieldsLead:
    "Fill in the details below. Fields marked * are required.",
  basicInformation: "Basic information",
  tagsHint: "Separate tags with commas, e.g. tax, 2026, VAT",
  publishing: "Publishing",
  onlyAdminsChangeStatus: "Only admins can change the status.",
  readAccessHint: "Who can read this document on the website.",
  coverImage: "Cover image",
  coverImageHint: "JPG, PNG or WebP, up to 2 MB. Best size: 1200 × 1600 px.",
  coverInvalid: "Choose a JPG, PNG, or WebP image up to 2 MiB.",
  coverPreviewAlt: "Document cover preview",
  defaultCoverAlt: "Default cover preview",
  defaultImage: "Default image",
  addImagePrompt: "Please add an image",
  coverUsedAsDocumentCover: "It will be used as the document cover.",
  previewUnavailable: "Preview unavailable",
  noCover: "No cover",
  notSavedYet: "Not saved yet",
  replaceImage: "Replace image",
  chooseImage: "Choose image",
  coverRemovedOnSave: "The cover will be removed when you save.",
  noCoverUploadedYet:
    "No cover uploaded yet. The website shows this default image until you choose one.",
  attachment: "Attachment",
  allowedFilesHint: "Allowed: {types} · up to {size} MB",
  currentFile: "Current file:",
  uploadReplacement: "Upload a replacement",
  uploadFile: "Upload file",
  displayName: "Display name",
  displayNamePlaceholder: "e.g. Full document (PDF)",
  version: "Version",
  whoCanDownload: "Who can download",
  advancedFileDetails: "Advanced file details",
  autoFilledOnUpload: "Filled in automatically when you upload a file.",
  fileName: "File name",
  fileType: "File type",
  sizeBytes: "Size (bytes)",
  contentLao: "Content — Lao",
  contentEnglish: "Content — English",
  summaryHint: "A short description shown in document lists.",
  body: "Body",
  bodyHint:
    "The full text readers see on the document page. Use headings and lists to organize it.",
  webAddressOptional: "Web address (optional)",
  urlSlug: "URL slug",
  slugHint: "Leave blank to create it from the title.",
  fileTypeNotAllowed: "File type .{ext} is not allowed.",
  fileTooLarge: "This file is {size}; the limit set in Settings is {limit}.",
  uploadFailed: "Upload failed",
  coverUploadFailedAfterSave:
    "Document saved, but the cover could not be uploaded: {reason}",
  fileUploadFailedAfterSave:
    "Document saved, but the file could not be uploaded: {reason}",
  saveFailed: "Save failed",
  uploadingFile: "Uploading file…",
  uploadProgress: "Upload progress",
  uploadingPercent: "Uploading… {percent}%",
  saveChanges: "Save changes",
  createDocument: "Create document",
  closeMenu: "Close menu",
  adminNavigation: "Admin navigation",
  notifications: "Notifications",
  mainNavigation: "Main navigation",
  mobileNavigation: "Mobile navigation",
  pagination: "Pagination",
  breadcrumb: "Breadcrumb",
  rowNumber: "No.",
  accountSuspended: "Suspended",
  backToTop: "Back to top",
  newNotifications: "new activity",
  viewDashboard: "Open dashboard",
  vipDownloadOnly: "VIP members only",
  fileNotAvailable: "File not available yet",
  noFileUploaded: "No file uploaded",
  emptyDownloadsHint: "Files you download will appear here.",
  emptyQuizHistoryHint: "Results of quizzes you submit will appear here.",
  quizScore: "{correct}/{total} correct ({percent}%)",
  yearHint: "Used to filter documents by year on the Documents page.",
  effectiveDateHint: "Date the document takes effect (optional).",
  displayNameHint: "Name readers see in the document page's file list.",
  versionHint: "For example 1.0; shown next to the file name.",
  whoCanDownloadHint: "Members: anyone signed in. VIP: VIP members only.",
  emailReadonlyHint: "Used to sign in; it can't be changed here.",
  sortBy: "Sort by",
  sortNewest: "Newest joined",
  sortOldest: "Oldest joined",
  sortNameAsc: "Name A–Z",
  sortNameDesc: "Name Z–A",
  vipOnly: "VIP only",
  vipCount: "{count} VIP members",
  vipCountOne: "{count} VIP member",
  joinedOn: "Joined {date}",
  categoryCount: "{count} categories",
  categoryCountOne: "{count} category",
  quizCount: "{count} quizzes",
  quizCountOne: "{count} quiz",
  memberCount: "{count} members",
  memberCountOne: "{count} member",
  staffCount: "{count} staff",
  staffCountOne: "{count} staff",
  memberFoundCount: "{count} found",
  memberFoundCountOne: "{count} found",
  fiveStarRating: "5-star rating",
};

const dictionaries: Record<Locale, Dict> = { lo, en };

/** Looks up `key`; `{name}` placeholders are filled from `vars` (e.g. t(l, "fileCount", { count: 3 })). */
export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
) {
  const text = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * The API answers errors in English. Known messages are shown in Lao on Lao pages; anything
 * not listed here (or on English pages) is shown exactly as the API sent it.
 */
const apiErrorsLo: Dict = {
  "Account suspended": "ບັນຊີຂອງທ່ານຖືກໂຈະ.",
  Unauthorized: "ກະລຸນາເຂົ້າສູ່ລະບົບ.",
  Forbidden: "ທ່ານບໍ່ມີສິດເຂົ້າເຖິງສ່ວນນີ້.",
  "Invalid origin": "ຄຳຂໍບໍ່ຖືກຕ້ອງ.",
  "Invalid request body": "ຂໍ້ມູນທີ່ສົ່ງບໍ່ຖືກຕ້ອງ.",
  "Invalid body": "ຂໍ້ມູນທີ່ສົ່ງບໍ່ຖືກຕ້ອງ.",
  "Invalid id": "ລະຫັດອ້າງອີງບໍ່ຖືກຕ້ອງ.",
  "Invalid document id": "ລະຫັດເອກະສານບໍ່ຖືກຕ້ອງ.",
  "Invalid file id": "ລະຫັດໄຟລ໌ບໍ່ຖືກຕ້ອງ.",
  "Document not found": "ບໍ່ພົບເອກະສານ.",
  "File not found": "ບໍ່ພົບໄຟລ໌.",
  "Quiz not found": "ບໍ່ພົບແບບທົດສອບ.",
  "Category not found": "ບໍ່ພົບໝວດ.",
  "User not found": "ບໍ່ພົບຜູ້ໃຊ້.",
  "Missing slug": "ບໍ່ມີຊື່ສຳລັບ URL.",
  "Invalid email or password": "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.",
  "Invalid or expired token": "ລິ້ງບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ.",
  "Token is required": "ບໍ່ພົບລະຫັດຢືນຢັນ.",
  "Token and password (min 8) are required":
    "ຕ້ອງມີລະຫັດຢືນຢັນ ແລະ ລະຫັດຜ່ານຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ.",
  "Name, email, and password (min 8) are required":
    "ກະລຸນາໃສ່ຊື່, ອີເມວ ແລະ ລະຫັດຜ່ານຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ.",
  "First name is required": "ກະລຸນາໃສ່ຊື່.",
  "Name is too long": "ຊື່ຍາວເກີນໄປ.",
  "Phone is too long": "ເບີໂທຍາວເກີນໄປ.",
  "New password must be at least 8 characters":
    "ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ.",
  "Current password is incorrect": "ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ.",
  "Could not register": "ລົງທະບຽນບໍ່ສຳເລັດ.",
  "Could not create session": "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ.",
  "Could not verify email": "ຢືນຢັນອີເມວບໍ່ສຳເລັດ.",
  "Could not update password": "ປ່ຽນລະຫັດຜ່ານບໍ່ສຳເລັດ.",
  "Could not reset password": "ຕັ້ງລະຫັດຜ່ານໃໝ່ບໍ່ສຳເລັດ.",
  "Could not update profile": "ບັນທຶກໂປຣໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not update user": "ອັບເດດຜູ້ໃຊ້ບໍ່ສຳເລັດ.",
  "Could not load user": "ໂຫຼດຂໍ້ມູນຜູ້ໃຊ້ບໍ່ສຳເລັດ.",
  "Could not load members": "ໂຫຼດຂໍ້ມູນສະມາຊິກບໍ່ສຳເລັດ.",
  "Could not update VIP": "ອັບເດດ VIP ບໍ່ສຳເລັດ.",
  "Avatar file is required": "ກະລຸນາເລືອກຮູບໂປຣໄຟລ໌.",
  "Avatar must be JPEG, PNG, or WebP": "ຮູບໂປຣໄຟລ໌ຕ້ອງເປັນ JPEG, PNG ຫຼື WebP.",
  "Avatar must be 1 byte–2MB": "ຮູບໂປຣໄຟລ໌ຕ້ອງມີຂະໜາດບໍ່ເກີນ 2MB.",
  "Could not store avatar": "ບັນທຶກຮູບໂປຣໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not read avatar": "ອ່ານຮູບໂປຣໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not update avatar": "ປ່ຽນຮູບໂປຣໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not remove avatar": "ລຶບຮູບໂປຣໄຟລ໌ບໍ່ສຳເລັດ.",
  "Google is not linked to this account": "ບັນຊີນີ້ບໍ່ໄດ້ເຊື່ອມຕໍ່ກັບ Google.",
  "Could not unlink Google account": "ຍົກເລີກການເຊື່ອມຕໍ່ Google ບໍ່ສຳເລັດ.",
  "Cannot unlink Google because no password has been set. Please set a password first.":
    "ບໍ່ສາມາດຍົກເລີກການເຊື່ອມຕໍ່ Google ໄດ້ ເພາະຍັງບໍ່ໄດ້ຕັ້ງລະຫັດຜ່ານ. ກະລຸນາຕັ້ງລະຫັດຜ່ານກ່ອນ.",
  "Could not initialize oauth": "ເລີ່ມການເຂົ້າສູ່ລະບົບດ້ວຍ Google ບໍ່ສຳເລັດ.",
  "Dev mode only": "ໃຊ້ໄດ້ສະເພາະໂໝດພັດທະນາ.",
  "Sign in to download this file": "ເຂົ້າສູ່ລະບົບເພື່ອດາວໂຫຼດໄຟລ໌ນີ້.",
  "VIP membership required": "ຕ້ອງເປັນສະມາຊິກ VIP.",
  "Could not load documents": "ໂຫຼດເອກະສານບໍ່ສຳເລັດ.",
  "Could not create document": "ສ້າງເອກະສານບໍ່ສຳເລັດ.",
  "Could not update document": "ອັບເດດເອກະສານບໍ່ສຳເລັດ.",
  "Could not delete document": "ລຶບເອກະສານບໍ່ສຳເລັດ.",
  "Document number or slug already exists":
    "ເລກທີເອກະສານ ຫຼື ຊື່ສຳລັບ URL ນີ້ມີຢູ່ແລ້ວ.",
  "Invalid effective_date": "ວັນທີມີຜົນບັງຄັບໃຊ້ບໍ່ຖືກຕ້ອງ.",
  "Invalid document status": "ສະຖານະເອກະສານບໍ່ຖືກຕ້ອງ.",
  "Invalid update date": "ວັນທີອັບເດດບໍ່ຖືກຕ້ອງ.",
  "Only admin can delete documents":
    "ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນທີ່ລຶບເອກະສານໄດ້.",
  "Only admin can change status":
    "ສະເພາະຜູ້ດູແລລະບົບເທົ່ານັ້ນທີ່ປ່ຽນສະຖານະໄດ້.",
  "Editors cannot edit published documents":
    "ບັນນາທິການບໍ່ສາມາດແກ້ໄຂເອກະສານທີ່ເຜີຍແຜ່ແລ້ວ.",
  "Editors cannot change files on published documents":
    "ບັນນາທິການບໍ່ສາມາດປ່ຽນໄຟລ໌ຂອງເອກະສານທີ່ເຜີຍແຜ່ແລ້ວ.",
  "Choose a file to upload": "ກະລຸນາເລືອກໄຟລ໌ທີ່ຈະອັບໂຫຼດ.",
  "Could not read file": "ອ່ານໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not read the uploaded file": "ອ່ານໄຟລ໌ທີ່ອັບໂຫຼດບໍ່ສຳເລັດ.",
  "Could not save the file": "ບັນທຶກໄຟລ໌ບໍ່ສຳເລັດ.",
  "Could not delete file": "ລຶບໄຟລ໌ບໍ່ສຳເລັດ.",
  "Cover image is required": "ກະລຸນາເລືອກຮູບໜ້າປົກ.",
  "Could not read cover image": "ອ່ານຮູບໜ້າປົກບໍ່ສຳເລັດ.",
  "Could not save cover image": "ບັນທຶກຮູບໜ້າປົກບໍ່ສຳເລັດ.",
  "Could not remove cover image": "ລຶບຮູບໜ້າປົກບໍ່ສຳເລັດ.",
  "Could not load categories": "ໂຫຼດໝວດບໍ່ສຳເລັດ.",
  "Could not load category": "ໂຫຼດໝວດບໍ່ສຳເລັດ.",
  "Could not delete category": "ລຶບໝວດບໍ່ສຳເລັດ.",
  "Category still has documents": "ໝວດນີ້ຍັງມີເອກະສານຢູ່.",
  "Code and translations are required": "ກະລຸນາໃສ່ລະຫັດ ແລະ ຂໍ້ມູນທັງສອງພາສາ.",
  "Could not load quiz": "ໂຫຼດແບບທົດສອບບໍ່ສຳເລັດ.",
  "Could not load quizzes": "ໂຫຼດແບບທົດສອບບໍ່ສຳເລັດ.",
  "Could not load quiz questions": "ໂຫຼດຄຳຖາມບໍ່ສຳເລັດ.",
  "Could not delete quiz": "ລຶບແບບທົດສອບບໍ່ສຳເລັດ.",
  "Invalid questions JSON": "JSON ຂອງຄຳຖາມບໍ່ຖືກຕ້ອງ.",
  "Invalid answers": "ຄຳຕອບບໍ່ຖືກຕ້ອງ.",
  "Invalid action": "ການດຳເນີນການບໍ່ຖືກຕ້ອງ.",
  "Invalid staff_role": "ບົດບາດພະນັກງານບໍ່ຖືກຕ້ອງ.",
  "Invalid account_status": "ສະຖານະບັນຊີບໍ່ຖືກຕ້ອງ.",
  "Invalid starts_at": "ວັນທີເລີ່ມບໍ່ຖືກຕ້ອງ.",
  "Invalid ends_at": "ວັນທີສິ້ນສຸດບໍ່ຖືກຕ້ອງ.",
  "Only owner can assign owner":
    "ສະເພາະເຈົ້າຂອງເທົ່ານັ້ນທີ່ແຕ່ງຕັ້ງເຈົ້າຂອງໄດ້.",
  "Only owner can modify another owner":
    "ສະເພາະເຈົ້າຂອງເທົ່ານັ້ນທີ່ແກ້ໄຂເຈົ້າຂອງຄົນອື່ນໄດ້.",
  "Cannot change your own role or status here":
    "ບໍ່ສາມາດປ່ຽນບົດບາດ ຫຼື ສະຖານະຂອງຕົນເອງຢູ່ບ່ອນນີ້.",
  "No changes": "ບໍ່ມີການປ່ຽນແປງ.",
  "Could not load settings": "ໂຫຼດການຕັ້ງຄ່າບໍ່ສຳເລັດ.",
  "Could not save settings": "ບັນທຶກການຕັ້ງຄ່າບໍ່ສຳເລັດ.",
  "Site names and timezone are required": "ກະລຸນາໃສ່ຊື່ເວັບໄຊ ແລະ ເຂດເວລາ.",
  "Invalid timezone": "ເຂດເວລາບໍ່ຖືກຕ້ອງ.",
  "Invalid default document status": "ສະຖານະເອກະສານເລີ່ມຕົ້ນບໍ່ຖືກຕ້ອງ.",
  "Allowed file types contain unsupported extensions":
    "ປະເພດໄຟລ໌ທີ່ອະນຸຍາດມີນາມສະກຸນທີ່ບໍ່ຮອງຮັບ.",
  "Colors must use #RRGGBB format": "ສີຕ້ອງຢູ່ໃນຮູບແບບ #RRGGBB.",
  "Contact email is not a valid email address": "ອີເມວຕິດຕໍ່ບໍ່ຖືກຕ້ອງ.",
  "Website must be a full https:// address":
    "ເວັບໄຊຕ້ອງເປັນທີ່ຢູ່ເຕັມທີ່ເລີ່ມດ້ວຍ https://.",
  "Facebook URL must be a full https:// address":
    "ລິ້ງ Facebook ຕ້ອງເປັນທີ່ຢູ່ເຕັມທີ່ເລີ່ມດ້ວຍ https://.",
  "TikTok URL must be a full https:// address":
    "ລິ້ງ TikTok ຕ້ອງເປັນທີ່ຢູ່ເຕັມທີ່ເລີ່ມດ້ວຍ https://.",
  "WhatsApp number must be in international format, e.g. +8562012345678":
    "ເບີ WhatsApp ຕ້ອງຢູ່ໃນຮູບແບບສາກົນ, ເຊັ່ນ: +8562012345678.",
  "Unsupported branding asset": "ບໍ່ຮອງຮັບຮູບປະເພດນີ້.",
  "Image asset is required": "ກະລຸນາເລືອກຮູບ.",
  "Could not read image asset": "ອ່ານຮູບບໍ່ສຳເລັດ.",
  "Could not update image asset": "ບັນທຶກຮູບບໍ່ສຳເລັດ.",
  "Could not remove image asset": "ລຶບຮູບບໍ່ສຳເລັດ.",
  "The file is too large for the server to accept.":
    "ໄຟລ໌ໃຫຍ່ເກີນກວ່າທີ່ເຊີບເວີຮັບໄດ້.",
  "Upload cancelled.": "ຍົກເລີກການອັບໂຫຼດແລ້ວ.",
  // Image checks for branding images and document covers (storeImageAsset in documents.go).
  "image must be between 1 byte and 2 MiB": "ຮູບຕ້ອງມີຂະໜາດບໍ່ເກີນ 2 MiB.",
  "could not read the image": "ອ່ານຮູບບໍ່ສຳເລັດ.",
  "the file is not a valid JPEG, PNG, or WebP image":
    "ໄຟລ໌ນີ້ບໍ່ແມ່ນຮູບ JPEG, PNG ຫຼື WebP ທີ່ຖືກຕ້ອງ.",
  "image dimensions are too large (max 8000 px per side)":
    "ຮູບໃຫຍ່ເກີນໄປ (ສູງສຸດ 8000 px ຕໍ່ດ້ານ).",
  "image must be JPEG, PNG, or WebP": "ຮູບຕ້ອງເປັນ JPEG, PNG ຫຼື WebP.",
  "could not create image directory": "ບັນທຶກຮູບບໍ່ສຳເລັດ.",
  "could not store the image": "ບັນທຶກຮູບບໍ່ສຳເລັດ.",
  "invalid image storage directory": "ບັນທຶກຮູບບໍ່ສຳເລັດ.",
  "Network error during upload. Check your connection and try again.":
    "ເຄືອຂ່າຍຂັດຂ້ອງລະຫວ່າງອັບໂຫຼດ. ກວດສອບການເຊື່ອມຕໍ່ ແລ້ວລອງອີກຄັ້ງ.",
};

// Settings field names as the API writes them in length errors (settingsLengthError in
// settings.go), with the Lao label the Settings page shows for the same field.
const settingsFieldLo: Dict = {
  "Organization name": "ຊື່ອົງກອນ",
  "System name": "ຊື່ລະບົບ",
  Description: "ຄຳອະທິບາຍ",
  Phone: "ເບີໂທລະສັບ",
  Address: "ທີ່ຢູ່",
  Website: "ເວັບໄຊ",
  "Document numbering format": "ຮູບແບບເລກທີເອກະສານ",
  "Application title": "ຊື່ແອັບພລິເຄຊັນ",
  "Sidebar title": "ຫົວຂໍ້ແຖບຂ້າງຂອງຜູ້ດູແລ",
  "Footer text": "ຂໍ້ຄວາມສ່ວນທ້າຍເວັບ",
  "Dashboard title": "ຫົວຂໍ້ແຜງຄວບຄຸມ",
  "Site name (Lao)": "ຊື່ເວັບໄຊ (ພາສາລາວ)",
  "Site name (English)": "ຊື່ເວັບໄຊ (ພາສາອັງກິດ)",
  "Contact email": "ອີເມວຕິດຕໍ່",
  "Facebook URL": "ລິ້ງ Facebook",
  "TikTok URL": "ລິ້ງ TikTok",
  "Meta description (Lao)": "ຄຳອະທິບາຍ Meta (ພາສາລາວ)",
  "Meta description (English)": "ຄຳອະທິບາຍ Meta (ພາສາອັງກິດ)",
  "SEO title (Lao)": "ຫົວຂໍ້ SEO (ພາສາລາວ)",
  "SEO title (English)": "ຫົວຂໍ້ SEO (ພາສາອັງກິດ)",
};

const apiErrorPatternsLo: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [
    /^(.+) must be (\d+) characters or fewer$/,
    (m) => `${settingsFieldLo[m[1]] ?? m[1]} ຕ້ອງມີບໍ່ເກີນ ${m[2]} ຕົວອັກສອນ.`,
  ],
  [/^Request failed \((\d+)\)$/, (m) => `ຄຳຂໍບໍ່ສຳເລັດ (${m[1]})`],
  [/^Upload failed \((\d+)\)$/, (m) => `ອັບໂຫຼດບໍ່ສຳເລັດ (${m[1]})`],
  [
    /^The file is larger than the (.+) limit set in Settings$/,
    (m) => `ໄຟລ໌ໃຫຍ່ກວ່າຂະໜາດສູງສຸດ ${m[1]} ທີ່ກຳນົດໃນການຕັ້ງຄ່າ.`,
  ],
  [
    /^Maximum file size must be between 1 byte and (\d+) MB$/,
    (m) => `ຂະໜາດໄຟລ໌ສູງສຸດຕ້ອງຢູ່ລະຫວ່າງ 1 byte ຫາ ${m[1]} MB.`,
  ],
];

export function translateApiError(locale: Locale, message: string) {
  if (locale !== "lo") return message;
  const known = apiErrorsLo[message];
  if (known) return known;
  for (const [pattern, format] of apiErrorPatternsLo) {
    const match = message.match(pattern);
    if (match) return format(match);
  }
  return message;
}
