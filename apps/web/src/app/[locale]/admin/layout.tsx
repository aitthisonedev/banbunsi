import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { isLocale } from "@/lib/i18n";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  return <AdminShell locale={raw}>{children}</AdminShell>;
}
