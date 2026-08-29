import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { isLocale } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const [{ locale }, { next }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const nextPath = next?.startsWith("/") ? next : `/${locale}/app`;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(nextPath);
  }

  return <AuthCard locale={locale} nextPath={nextPath} />;
}
