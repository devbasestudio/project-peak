"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, ExternalLink, Image as ImageIcon, Pause, Play } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export type ProgramBlock = {
  id: string;
  block_type: string;
  title_mm: string | null;
  title_en: string | null;
  content_mm: Record<string, unknown>;
  content_en: Record<string, unknown>;
  config: Record<string, unknown>;
  visible: boolean;
};

export function ProgramBlocks({ blocks, locale }: { blocks: ProgramBlock[]; locale: Locale }) {
  if (!blocks.length) return null;
  return <section className="mb-5 space-y-3" aria-label="Program content">{blocks.filter((block) => block.visible).map((block) => <ProgramBlockView block={block} key={block.id} locale={locale} />)}</section>;
}

function ProgramBlockView({ block, locale }: { block: ProgramBlock; locale: Locale }) {
  const content = (locale === "mm" ? block.content_mm : block.content_en) ?? {};
  const title = locale === "mm" ? block.title_mm : block.title_en;
  const text = stringValue(content.text);
  const caption = stringValue(content.caption);

  if (block.block_type === "heading") return <div className="pt-2"><h2 className="font-display text-3xl font-bold tracking-[-.045em]" lang={locale === "mm" ? "my" : "en"}>{title || text}</h2>{title && text ? <p className="mt-3 leading-7 text-charcoal/55">{text}</p> : null}</div>;
  if (block.block_type === "rich_text") return <p className="leading-8 text-charcoal/62" lang={locale === "mm" ? "my" : "en"}>{text}</p>;
  if (block.block_type === "callout") return <div className="rounded-xl border border-sky/25 bg-ice p-4"><p className="flex items-center gap-2 font-bold"><CircleAlert size={17} className="text-aqua" />{title}</p><p className="mt-2 text-sm leading-7 text-charcoal/58">{text}</p></div>;
  if (block.block_type === "divider") return <hr className="border-charcoal/10" />;
  if (block.block_type === "spacer") return <div aria-hidden style={{ height: Math.min(160, Math.max(8, numberValue(block.config.height, 24))) }} />;
  if (block.block_type === "image") {
    const url = stringValue(block.config.url);
    // Admin-authored media can come from any approved storage host, so a native lazy image is intentional here.
    return <figure className="surface overflow-hidden">{url ? <img alt={stringValue(content.alt) || title || "Program image"} className="max-h-[560px] w-full object-cover" loading="lazy" src={url} /* eslint-disable-line @next/next/no-img-element */ /> : <div className="grid min-h-48 place-items-center bg-charcoal/[.035]"><ImageIcon className="text-charcoal/25" /></div>}{caption ? <figcaption className="p-4 text-sm text-charcoal/52">{caption}</figcaption> : null}</figure>;
  }
  if (block.block_type === "video") {
    const url = stringValue(block.config.url);
    return <figure className="surface overflow-hidden">{url ? <video className="max-h-[640px] w-full bg-charcoal" controls playsInline preload="metadata" src={url} /> : <div className="grid min-h-48 place-items-center bg-charcoal text-white/35"><Play /></div>}{caption ? <figcaption className="p-4 text-sm text-charcoal/52">{caption}</figcaption> : null}</figure>;
  }
  if (block.block_type === "timer") return <BlockTimer label={stringValue(content.label) || title || "Timer"} seconds={numberValue(block.config.seconds, 90)} />;
  if (block.block_type === "checklist") return <Checklist title={title} items={arrayValue(content.items)} />;
  if (block.block_type === "exercise" || block.block_type === "exercise_cue") return <div className="rounded-xl bg-charcoal p-5 text-white"><p className="eyebrow text-sky">EXERCISE</p><h3 className="mt-3 font-display text-2xl font-bold">{title}</h3><p className="mono mt-3 text-xs text-white/45">{numberValue(block.config.sets, 3)} SETS · {stringValue(block.config.reps) || "8–12"} REPS · {numberValue(block.config.restSeconds, 90)}S REST</p>{text ? <p className="mt-4 text-sm leading-7 text-white/55">{text}</p> : null}</div>;
  if (block.block_type === "quiz") return <div className="surface p-5"><p className="font-bold">{stringValue(content.question)}</p><div className="mt-4 space-y-2">{arrayValue(content.options).map((item, index) => <div className="rounded-lg border border-charcoal/10 bg-white px-4 py-3 text-sm" key={`${item}-${index}`}>{String.fromCharCode(65 + index)} · {item}</div>)}</div></div>;
  if (block.block_type === "button" || block.block_type === "link") return <a className="primary-button w-full" href={safeHref(stringValue(block.config.href))}>{stringValue(content.label) || title || "Continue"}<ExternalLink size={15} /></a>;
  return null;
}

function BlockTimer({ seconds, label }: { seconds: number; label: string }) {
  const duration = Math.max(1, Math.min(3600, seconds));
  const [remaining, setRemaining] = useState(duration);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    const interval = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(interval);
  }, [endsAt]);
  const running = Boolean(endsAt && remaining > 0);
  const value = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`, [remaining]);
  return <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white p-4"><div><p className="eyebrow text-charcoal/38">{label}</p><p className="mono mt-1 text-3xl font-bold">{value}</p></div><button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-sky" onClick={() => running ? setEndsAt(null) : setEndsAt(Date.now() + remaining * 1000)} aria-label={running ? "Pause timer" : "Start timer"}>{running ? <Pause size={18} /> : <Play size={18} />}</button></div>;
}

function Checklist({ title, items }: { title: string | null; items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return <div className="surface p-5">{title ? <h3 className="font-display text-xl font-bold">{title}</h3> : null}<div className="mt-3 space-y-2">{items.map((item, index) => <button type="button" onClick={() => setChecked((value) => ({ ...value, [index]: !value[index] }))} className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-charcoal/10 px-3 text-left text-sm" key={`${item}-${index}`}><span className={`grid h-6 w-6 place-items-center rounded-md ${checked[index] ? "bg-sky" : "bg-paper"}`}>{checked[index] ? <Check size={14} /> : null}</span>{item}</button>)}</div></div>;
}

function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
function numberValue(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function arrayValue(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function safeHref(value: string) { return value.startsWith("/") || value.startsWith("https://") ? value : "#"; }
