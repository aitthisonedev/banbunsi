import Link from "next/link";
import { headers } from "next/headers";
import { LOCALE_HEADER } from "@/lib/locale-header";

const TEXT = {
  lo: {
    title: "ບໍ່ພົບໜ້ານີ້",
    lead: "ໜ້າທີ່ທ່ານຊອກຫາອາດຖືກຍ້າຍ, ລຶບ ຫຼື ທີ່ຢູ່ບໍ່ຖືກຕ້ອງ.",
    home: "ກັບໄປໜ້າຫຼັກ",
    documents: "ເບິ່ງເອກະສານ",
  },
  en: {
    title: "Page not found",
    lead: "The page you are looking for may have moved, been removed, or the address is incorrect.",
    home: "Go to the home page",
    documents: "Browse documents",
  },
} as const;

/** Friendly 404 in the visitor's language (from the URL, via src/proxy.ts), with ways back. */
export async function NotFoundView() {
  const locale = (await headers()).get(LOCALE_HEADER) === "en" ? "en" : "lo";
  const text = TEXT[locale];
  return (
    <div className="page-static" aria-labelledby="not-found-title">
      <p className="text-sm font-semibold text-bb-text-muted">404</p>
      <h1 id="not-found-title">{text.title}</h1>
      <p className="lead">{text.lead}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/${locale}`} className="btn-primary">
          {text.home}
        </Link>
        <Link href={`/${locale}/documents`} className="btn-secondary">
          {text.documents}
        </Link>
      </div>
    </div>
  );
}
