"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDocumentForm } from "@/components/admin-document-form";
import Link from "next/link";
import { btn, PageHeader, PageSkeleton, panelClass, StatePanel } from "@/components/admin-documents-ui";
import type { CategoryNode, PublicSettings } from "@/lib/api";
import { clientGetPublicSettings, clientListAdminDocuments, clientMe } from "@/lib/client-api";
import { isLocale, t } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function AdminNewDocumentPage() {
  const params = useParams();
  const localeRaw = String(params.locale || "lo");
  const locale = isLocale(localeRaw) ? localeRaw : "lo";
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [defaults, setDefaults] = useState<PublicSettings | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<Array<{ document_number?: string; category_id?: string }>>([]);
  const [isAdminPlus, setIsAdminPlus] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    clientMe()
      .catch(() => {
        router.replace(`/${locale}/auth/login`);
        return null;
      })
      .then(async (u) => {
        if (!u) return;
        if (!["editor", "admin", "owner"].includes(u.staff_role)) {
          router.replace(`/${locale}`);
          return;
        }
        setIsAdminPlus(u.staff_role === "admin" || u.staff_role === "owner");
        const [response, settings, documents] = await Promise.all([
          fetch(`${API_URL}/api/v1/admin/categories?locale=${locale}`, {
            credentials: "include",
          }).then(async (res) => {
            if (!res.ok) throw new Error("Could not load categories");
            return res.json();
          }),
          clientGetPublicSettings(),
          // Used to suggest the next document number; the form still works without it.
          clientListAdminDocuments(locale).then((data) => data.items as Array<{ document_number?: string; category_id?: string }>).catch(() => []),
        ]);
        setCategories(response.items || []);
        setDefaults(settings);
        setExistingDocuments(documents);
      })
      .catch((reason) => setLoadError(reason instanceof Error ? reason.message : t(locale, "loadError")));
  }, [locale, router]);

  const backLink = (
    <Link href={`/${locale}/admin/documents`} className="inline-flex items-center gap-1 text-sm text-bb-text-muted hover:text-[var(--bb-text)]">
      ← {t(locale, "adminDocuments")}
    </Link>
  );

  if (loadError) {
    return (
      <div className="w-full max-w-7xl space-y-4">
        {backLink}
        <section className={panelClass}>
          <StatePanel
            tone="error"
            title="The form could not be loaded"
            description={loadError}
            action={<button type="button" className={btn.secondary} onClick={() => window.location.reload()}>Try again</button>}
          />
        </section>
      </div>
    );
  }
  if (!categories || !defaults) return <PageSkeleton />;

  return (
    <div className="w-full max-w-7xl space-y-6">
      <PageHeader
        back={backLink}
        title={t(locale, "newDocument")}
        description="Fill in the details below. Fields marked * are required."
      />
      <AdminDocumentForm
        locale={locale}
        categories={categories}
        isAdminPlus={isAdminPlus}
        defaults={defaults}
        existingDocuments={existingDocuments}
      />
    </div>
  );
}
