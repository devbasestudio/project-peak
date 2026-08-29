import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireAdmin(locale);
  const name = viewer.profile?.display_name || viewer.user.user_metadata?.full_name || "Project Peak Admin";
  return <AdminShell email={viewer.user.email ?? ""} locale={locale} name={name}>{children}</AdminShell>;
}

