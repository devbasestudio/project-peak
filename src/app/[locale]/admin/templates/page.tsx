import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";
import { CreateTemplateForm } from "@/components/admin/create-template-form";
import { getAdminTemplates } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const templates = await getAdminTemplates();
  return <><div className={styles.pageHeader}><div><p className={styles.eyebrow}>Program systems</p><h1 className={styles.pageTitle}>Templates.</h1><p className={styles.pageDescription}>Build the master experience. Customer programs become independent copies only after approval.</p></div></div>{templates.length ? <div className={styles.templatesGrid}>{templates.map((template) => <Link className={styles.templateCard} href={`/${locale}/admin/templates/${template.id}`} key={template.id}><div className={styles.templateCardTop}><span className={styles.templateMark}><Layers3 size={18} /></span><span className={styles.status} data-status={template.latest?.status ?? "draft"}>{template.latest?.status ?? "empty"}</span></div><h2>{template.name_en}</h2><p>{template.description_en || template.description_mm || "No description yet."}</p><div className={styles.templateMeta}><span>V{template.latest?.version_no ?? 0} · {template.documentCount} screens</span><ArrowUpRight size={15} /></div></Link>)}</div> : null}<section className={styles.panel} style={{ marginTop: 18 }}><div className={styles.panelHeader}><h2>Create a new template</h2><span className={styles.muted}>Starts with an editable baseline screen</span></div><div className={styles.panelBody}><CreateTemplateForm locale={locale} /></div></section></>;
}

