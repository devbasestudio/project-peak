"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, ExternalLink, Image as ImageIcon, Pause, Play, RotateCcw } from "lucide-react";
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
  const visible = blocks.filter((block) => block.visible);
  if (!visible.length) return null;
  return <section className="mb-10 border-l-4 border-sky bg-white px-5 py-6 sm:px-8 sm:py-8" aria-label="Coach notes"><div className="mb-6 flex items-center gap-3 border-b border-charcoal/12 pb-3"><span className="h-2 w-2 bg-sky" /><p className="mono text-[9px] font-bold uppercase tracking-[.22em] text-charcoal/35">Coach notes · program document</p></div><div className="space-y-6">{visible.map((block) => <ProgramBlockView block={block} key={block.id} locale={locale} />)}</div></section>;
}

function ProgramBlockView({ block, locale }: { block: ProgramBlock; locale: Locale }) {
  const content = (locale === "mm" ? block.content_mm : block.content_en) ?? {};
  const title = locale === "mm" ? block.title_mm : block.title_en;
  const text = stringValue(content.text);
  const caption = stringValue(content.caption);

  if (block.block_type === "heading") return <div className="pt-1"><p className="mono text-[9px] font-bold tracking-[.2em] text-charcoal/30">SECTION</p><h2 className="mt-2 max-w-4xl font-display text-3xl font-bold leading-tight tracking-[-.05em] sm:text-5xl" lang={locale === "mm" ? "my" : "en"}>{title || text}</h2>{title && text ? <p className="mt-4 max-w-3xl leading-8 text-charcoal/58">{text}</p> : null}</div>;
  if (block.block_type === "rich_text") return <p className="max-w-4xl border-y border-charcoal/10 py-5 leading-8 text-charcoal/64" lang={locale === "mm" ? "my" : "en"}>{text}</p>;
  if (block.block_type === "callout") return <div className="grid border-y-2 border-charcoal bg-paper sm:grid-cols-[180px_1fr]"><p className="flex items-center gap-2 border-b border-charcoal/15 bg-sky px-4 py-4 text-sm font-bold sm:border-b-0 sm:border-r"><CircleAlert size={17} />{title}</p><p className="px-4 py-4 text-sm leading-7 text-charcoal/62">{text}</p></div>;
  if (block.block_type === "divider") return <hr className="border-charcoal/20" />;
  if (block.block_type === "spacer") return <div aria-hidden style={{ height: Math.min(160, Math.max(8, numberValue(block.config.height, 24))) }} />;
  if (block.block_type === "image") {
    const url = stringValue(block.config.url);
    return <figure className="border-y border-charcoal/15 bg-paper">{url ? <img alt={stringValue(content.alt) || title || "Program image"} className="max-h-[620px] w-full object-cover" loading="lazy" src={url} /* eslint-disable-line @next/next/no-img-element */ /> : <div className="grid min-h-56 place-items-center"><ImageIcon className="text-charcoal/25" /></div>}{caption ? <figcaption className="border-t border-charcoal/12 px-4 py-3 text-xs text-charcoal/50">FIG. · {caption}</figcaption> : null}</figure>;
  }
  if (block.block_type === "video") {
    const url = stringValue(block.config.url);
    return <figure className="border-y border-charcoal/15 bg-charcoal">{url ? <video className="max-h-[680px] w-full" controls playsInline preload="metadata" src={url} /> : <div className="grid min-h-56 place-items-center text-white/35"><Play /></div>}{caption ? <figcaption className="border-t border-white/12 px-4 py-3 text-xs text-white/55">VIDEO · {caption}</figcaption> : null}</figure>;
  }
  if (block.block_type === "timer") return <BlockTimer label={stringValue(content.label) || title || "Timer"} seconds={numberValue(block.config.seconds, 90)} />;
  if (block.block_type === "checklist") return <Checklist title={title} items={arrayValue(content.items)} />;
  if (block.block_type === "exercise" || block.block_type === "exercise_cue") return <div className="border-y-2 border-charcoal bg-white"><div className="grid sm:grid-cols-[1fr_auto]"><div className="p-5"><p className="mono text-[9px] font-bold tracking-[.18em] text-sky">EXERCISE PRESCRIPTION</p><h3 className="mt-2 font-display text-3xl font-bold tracking-[-.045em]">{title}</h3>{text ? <p className="mt-4 max-w-2xl text-sm leading-7 text-charcoal/56">{text}</p> : null}</div><div className="grid grid-cols-3 border-t border-charcoal/15 bg-paper sm:min-w-80 sm:border-l sm:border-t-0"><Measure label="SETS" value={numberValue(block.config.sets, 3)} /><Measure label="REPS" value={stringValue(block.config.reps) || "8–12"} /><Measure label="REST" value={`${numberValue(block.config.restSeconds, 90)}s`} /></div></div></div>;
  if (block.block_type === "quiz") return <div className="border-y border-charcoal/15 bg-paper p-5"><p className="font-display text-xl font-bold">{stringValue(content.question)}</p><div className="mt-4 divide-y divide-charcoal/10 border-y border-charcoal/10">{arrayValue(content.options).map((item, index) => <div className="grid grid-cols-[36px_1fr] py-3 text-sm" key={`${item}-${index}`}><span className="mono text-charcoal/35">{String.fromCharCode(65 + index)}</span><span>{item}</span></div>)}</div></div>;
  if (block.block_type === "button" || block.block_type === "link") return <a className="flex min-h-14 w-full items-center justify-between border-2 border-charcoal bg-charcoal px-5 text-sm font-bold text-white" href={safeHref(stringValue(block.config.href))}>{stringValue(content.label) || title || "Continue"}<ExternalLink size={15} /></a>;
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
  return <div className="grid border-y-2 border-charcoal bg-paper sm:grid-cols-[1fr_auto]"><div className="p-5"><p className="eyebrow text-charcoal/38">{label}</p><p aria-live="polite" className="mono mt-2 text-5xl font-bold tracking-[-.07em]">{value}</p></div><div className="grid grid-cols-2 border-t border-charcoal/15 sm:min-w-40 sm:border-l sm:border-t-0"><button type="button" className="grid min-h-16 place-items-center border-r border-charcoal/15 bg-sky" onClick={() => running ? setEndsAt(null) : setEndsAt(Date.now() + (remaining || duration) * 1000)} aria-label={running ? "Pause timer" : "Start timer"}>{running ? <Pause size={19} /> : <Play size={19} />}</button><button type="button" className="grid min-h-16 place-items-center bg-white" onClick={() => { setEndsAt(null); setRemaining(duration); }} aria-label="Reset timer"><RotateCcw size={18} /></button></div></div>;
}

function Checklist({ title, items }: { title: string | null; items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return <div className="border-y border-charcoal/15 bg-white">{title ? <h3 className="border-b border-charcoal/12 px-5 py-4 font-display text-xl font-bold">{title}</h3> : null}<div className="divide-y divide-charcoal/10">{items.map((item, index) => <button type="button" onClick={() => setChecked((value) => ({ ...value, [index]: !value[index] }))} className="grid min-h-13 w-full grid-cols-[36px_1fr] items-center px-4 text-left text-sm" key={`${item}-${index}`}><span className={`grid h-6 w-6 place-items-center border ${checked[index] ? "border-sky bg-sky" : "border-charcoal/18"}`}>{checked[index] ? <Check size={14} /> : null}</span>{item}</button>)}</div></div>;
}

function Measure({ label, value }: { label: string; value: string | number }) { return <div className="flex min-h-24 flex-col items-center justify-center border-r border-charcoal/12 last:border-r-0"><span className="mono text-lg font-bold">{value}</span><span className="mono mt-1 text-[8px] font-bold tracking-[.14em] text-charcoal/35">{label}</span></div>; }
function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
function numberValue(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function arrayValue(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function safeHref(value: string) { return value.startsWith("/") || value.startsWith("https://") ? value : "#"; }
