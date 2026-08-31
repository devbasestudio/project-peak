import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { isLocale } from "@/lib/i18n";
import { requireViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale);
  const name = viewer.profile?.display_name || viewer.user.user_metadata?.full_name || viewer.user.email || "Member";
  const avatarUrl = viewer.profile?.avatar_url || viewer.user.user_metadata?.avatar_url || viewer.user.user_metadata?.picture || null;
  return <AppShell locale={locale} isAdmin={viewer.isAdmin} name={name} avatarUrl={avatarUrl}>{children}</AppShell>;
}
