import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { isLocale } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const alternates = {
    canonical: `/${locale}`,
    languages: { my: "/mm", en: "/en" },
  };
  if (locale === "en") {
    return { title: "12 Week Home Workout", description: "Build the knowledge and habits that make fitness stick.", alternates };
  }
  return { title: "12 ပတ် Home Workout", description: "Fitness ကို ရေရှည်ဆက်လုပ်ဖြစ်စေမယ့် knowledge နဲ့ habit system", alternates };
}

export default async function LocaleLandingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LandingPage locale={locale} />;
}
