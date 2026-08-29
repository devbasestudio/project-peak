import { notFound } from "next/navigation";
import { TemplateBuilder } from "@/components/admin/template-builder";
import { getAdminTemplate } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";

export default async function TemplateEditorPage({ params }: { params: Promise<{ locale: string; templateId: string }> }) {
  const { locale, templateId } = await params;
  if (!isLocale(locale)) notFound();
  const template = await getAdminTemplate(templateId);
  if (!template) notFound();
  return <TemplateBuilder initialTemplate={template} locale={locale} />;
}

