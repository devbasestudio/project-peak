"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownRight, ArrowRight, Check, Dumbbell, ShieldCheck, Sparkles } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { Locale } from "@/lib/i18n";
import { landingCopy } from "@/lib/landing-content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const screens = [
  { src: "/screens/baseline.png", alt: "Project Peak baseline test" },
  { src: "/screens/today.png", alt: "Project Peak training day" },
  { src: "/screens/workout.png", alt: "Project Peak exercise logger" },
  { src: "/screens/progress.png", alt: "Project Peak progress grid" },
  { src: "/screens/complete.png", alt: "Project Peak week 12 comparison" },
];

export function LandingPage({ locale }: { locale: Locale }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const copy = landingCopy[locale];
  const otherLocale = locale === "mm" ? "en" : "mm";
  const otherPath = pathname.replace(/^\/(mm|en)/, `/${otherLocale}`);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.92 });
    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      const count = { value: 0 };
      intro
        .from(".hero-mark", { autoAlpha: 0, y: 20, duration: 0.5 })
        .from(".hero-line", { yPercent: 110, duration: 0.85, stagger: 0.07 }, "-=.2")
        .from(".hero-copy, .hero-actions", { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.08 }, "-=.45")
        .from(".hero-visual", { clipPath: "inset(100% 0 0 0)", scale: 1.05, duration: 1.05, ease: "power4.inOut" }, "-=.85")
        .to(count, {
          value: 48,
          duration: 1.2,
          snap: { value: 1 },
          ease: "power2.out",
          onUpdate: () => {
            const element = rootRef.current?.querySelector(".session-counter");
            if (element) element.textContent = String(Math.round(count.value)).padStart(2, "0");
          },
        }, "-=1");

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 48,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 86%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        gsap.fromTo(element, { yPercent: 7 }, {
          yPercent: -5,
          ease: "none",
          scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });

      gsap.to(".discipline-track", { xPercent: -50, repeat: -1, duration: 38, ease: "none" });

      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(".journey-card");
        gsap.to(cards, {
          xPercent: -100 * (cards.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: ".journey-pin",
            start: "top top",
            end: "+=2600",
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} lang={locale === "mm" ? "my" : "en"} className="noise overflow-hidden bg-paper text-charcoal">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <nav className="glass mx-auto flex max-w-[1320px] items-center justify-between rounded-2xl px-4 py-3">
          <Link href={`/${locale}`} aria-label="Project Peak home" className="hero-mark flex items-center gap-3">
            <Image src="/brand/icon-gradient.svg" alt="" width={34} height={34} priority />
            <span className="font-display text-sm font-bold tracking-[-.03em]">PROJECT PEAK</span>
          </Link>
          <div className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[.08em] md:flex">
            <a href="#method">{copy.nav.method}</a>
            <a href="#journey">{copy.nav.journey}</a>
            <a href="#program">{copy.nav.program}</a>
            <a href="#faq">{copy.nav.faq}</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href={otherPath || `/${otherLocale}`} className="rounded-lg border border-charcoal/10 px-3 py-2 text-xs font-bold">
              {locale === "mm" ? "EN" : "မြန်မာ"}
            </Link>
            <Link href={`/${locale}/login`} className="rounded-lg bg-charcoal px-3.5 py-2 text-xs font-bold text-white sm:px-4">
              {copy.nav.signIn}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative min-h-[100svh] overflow-hidden border-b border-charcoal/10 px-4 pb-14 pt-28 sm:px-6 lg:px-10 lg:pb-8 lg:pt-32">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(6,17,26,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,17,26,.04)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-10rem)] max-w-[1320px] gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="relative z-10 max-w-4xl">
              <div className="hero-mark mb-8 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-sky shadow-[0_0_0_7px_rgba(5,171,221,.14)]" />
                <p className="eyebrow text-charcoal/60">{copy.hero.kicker}</p>
              </div>
              <h1 className="font-display max-w-[18ch] overflow-hidden text-[clamp(3.5rem,7.4vw,8.8rem)] font-bold leading-[.86] tracking-[-.075em]">
                <span className="hero-line block">{locale === "mm" ? "12 ပတ်" : "12 WEEKS"}</span>
                <span className="hero-line block text-sky">{locale === "mm" ? "တကယ်လုပ်ဖြစ်မယ့်" : "BUILT TO DO"}</span>
                <span className="hero-line block">{locale === "mm" ? "SYSTEM" : "NOT TO SAVE"}</span>
              </h1>
              <p className="hero-copy mt-8 max-w-2xl text-base leading-8 text-charcoal/64 sm:text-lg" lang={locale === "mm" ? "my" : "en"}>
                {copy.hero.title}. {copy.hero.body}
              </p>
              <div className="hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={`/${locale}/login?next=/${locale}/app`} className="primary-button group min-w-52">
                  {copy.hero.primary}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#method" className="secondary-button min-w-48">{copy.hero.secondary}<ArrowDownRight size={16} /></a>
              </div>
              <div className="hero-copy mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-charcoal/48">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-aqua" />{copy.hero.badge}</span>
                <span className="mono">48 SESSIONS · PUSH / PULL</span>
              </div>
            </div>

            <div className="hero-visual relative mx-auto w-full max-w-[590px] self-end lg:mx-0">
              <div className="absolute -inset-20 -z-10 rounded-full bg-sky/12 blur-[100px]" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2rem] border border-charcoal/10 bg-charcoal p-5 shadow-[0_36px_100px_rgba(6,17,26,.2)] sm:p-8">
                <div className="flex items-center justify-between text-white">
                  <span className="eyebrow text-white/55">PROGRAM QUEUE</span>
                  <Image src="/brand/icon-gradient.svg" width={34} height={34} alt="" />
                </div>
                <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-4 border-y border-white/10 py-6">
                  <div>
                    <p className="text-sm text-white/50">Sessions complete</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Your pace. Your queue.</p>
                  </div>
                  <div className="mono flex items-baseline text-sky">
                    <span className="session-counter text-7xl font-bold tracking-[-.08em]">00</span>
                    <span className="ml-2 text-sm text-white/38">/48</span>
                  </div>
                </div>
                <div className="relative mt-6 h-[58%] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1d28]">
                  <Image src="/screens/today.png" alt="Project Peak workout dashboard" fill priority sizes="(max-width: 1024px) 90vw, 42vw" className="object-contain object-top" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal to-transparent" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-3 rounded-xl border border-charcoal/10 bg-white px-4 py-3 shadow-xl sm:-left-8">
                <p className="eyebrow text-charcoal/40">TODAY</p>
                <p className="mt-1 text-sm font-bold">Next: Push · Phase 1</p>
              </div>
            </div>
          </div>
        </section>

        <div className="overflow-hidden border-b border-charcoal/10 bg-sky py-4 text-charcoal">
          <div className="discipline-track flex w-max items-center gap-8 whitespace-nowrap font-display text-lg font-bold tracking-[-.02em]">
            {[0, 1].map((group) => (
              <div key={group} className="flex items-center gap-8 pr-8">
                <span>FORM</span><span>✦</span><span>KNOWLEDGE</span><span>✦</span><span>HABITS</span><span>✦</span><span>PROGRESSIVE OVERLOAD</span><span>✦</span><span>IDENTITY</span><span>✦</span>
              </div>
            ))}
          </div>
        </div>

        <section id="method" className="px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-[1220px]">
            <div data-reveal className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
              <p className="eyebrow text-charcoal/45">{copy.thesis.eyebrow}</p>
              <div>
                <h2 className="font-display text-4xl font-bold leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">{copy.thesis.title}</h2>
                <p className="mt-8 max-w-3xl text-lg leading-8 text-charcoal/60" lang={locale === "mm" ? "my" : "en"}>{copy.thesis.body}</p>
              </div>
            </div>
            <div className="mt-16 grid gap-4 lg:grid-cols-2">
              {copy.pillars.map((pillar, index) => (
                <article data-reveal key={pillar.number} className={`relative min-h-[360px] overflow-hidden rounded-[2rem] border p-7 sm:p-10 ${index === 0 ? "border-charcoal/10 bg-charcoal text-white" : "border-charcoal/10 bg-ice"}`}>
                  <span className="mono text-sm opacity-50">{pillar.number}</span>
                  <div className="mt-28">
                    <h3 className="font-display text-4xl font-bold tracking-[-.045em] sm:text-5xl">{pillar.title}</h3>
                    <p className={`mt-5 max-w-lg leading-7 ${index === 0 ? "text-white/60" : "text-charcoal/58"}`} lang={locale === "mm" ? "my" : "en"}>{pillar.body}</p>
                  </div>
                  {index === 0 ? <Sparkles className="absolute right-8 top-8 text-sky" /> : <Check className="absolute right-8 top-8 text-aqua" />}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="journey-pin flex min-h-screen items-center overflow-hidden bg-charcoal py-24 text-white">
          <div className="w-full">
            <div className="mx-auto mb-12 flex max-w-[1220px] items-end justify-between px-4 sm:px-6">
              <div data-reveal>
                <p className="eyebrow text-sky">12 WEEK JOURNEY</p>
                <h2 className="mt-4 font-display text-5xl font-bold tracking-[-.06em] sm:text-7xl">One queue.<br />Five turning points.</h2>
              </div>
              <p className="mono hidden text-sm text-white/35 md:block">SCROLL TO MOVE →</p>
            </div>
            <div className="flex flex-col gap-4 px-4 sm:px-6 md:w-max md:flex-row md:gap-5">
              {copy.journey.map((item, index) => (
                <article key={item.step} className="journey-card flex min-h-[340px] w-full shrink-0 flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[.045] p-7 md:w-[460px] md:p-9">
                  <div className="flex items-start justify-between">
                    <span className="mono text-sm text-sky">{item.step}</span>
                    <span className="mono text-xs text-white/25">0{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-4xl font-bold tracking-[-.05em]">{item.title}</h3>
                    <p className="mt-4 max-w-sm leading-7 text-white/52" lang={locale === "mm" ? "my" : "en"}>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="program" className="px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <div className="mx-auto max-w-[1220px]">
            <div data-reveal className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
              <p className="eyebrow text-charcoal/45">{copy.showcase.eyebrow}</p>
              <div>
                <h2 className="font-display text-4xl font-bold leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">{copy.showcase.title}</h2>
                <p className="mt-8 max-w-3xl text-lg leading-8 text-charcoal/60" lang={locale === "mm" ? "my" : "en"}>{copy.showcase.body}</p>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
              {screens.map((screen, index) => (
                <div data-reveal key={screen.src} className={`relative overflow-hidden rounded-[1.6rem] border border-charcoal/10 bg-charcoal shadow-[0_24px_60px_rgba(6,17,26,.12)] ${index === 1 ? "mt-8 lg:mt-16" : index === 3 ? "mt-8 lg:mt-16" : ""}`}>
                  <div data-parallax className="relative aspect-[293/633]">
                    <Image src={screen.src} alt={screen.alt} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover object-top" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-charcoal/10 bg-white/45 px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1220px] gap-5 lg:grid-cols-2">
            <article data-reveal className="rounded-[2rem] border border-charcoal/10 bg-paper p-7 sm:p-10">
              <Dumbbell className="text-aqua" />
              <p className="eyebrow mt-16 text-charcoal/42">{copy.equipment.eyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-[-.05em] sm:text-5xl">{copy.equipment.title}</h2>
              <p className="mt-5 text-charcoal/55" lang={locale === "mm" ? "my" : "en"}>{copy.equipment.body}</p>
              <ul className="mt-8 divide-y divide-charcoal/10 border-y border-charcoal/10">
                {copy.equipment.items.map((item, index) => <li key={item} className="flex items-center gap-4 py-4 text-sm font-semibold"><span className="mono text-xs text-charcoal/30">0{index + 1}</span>{item}</li>)}
              </ul>
            </article>
            <div className="grid gap-5">
              {[copy.mission, copy.vision].map((section) => (
                <article data-reveal key={section.eyebrow} className="rounded-[2rem] border border-charcoal/10 bg-surface p-7 sm:p-9">
                  <p className="eyebrow text-aqua">{section.eyebrow}</p>
                  <h3 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-.04em]">{section.title}</h3>
                  <p className="mt-5 leading-7 text-charcoal/55" lang={locale === "mm" ? "my" : "en"}>{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-36">
          <div data-reveal className="relative mx-auto max-w-[1220px] overflow-hidden rounded-[2.5rem] bg-sky p-7 sm:p-12 lg:p-16">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-charcoal/15" />
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full border border-charcoal/15" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <div>
                <p className="eyebrow text-charcoal/55">{copy.price.eyebrow}</p>
                <h2 className="mono mt-5 text-[clamp(3.8rem,9vw,8.5rem)] font-bold leading-none tracking-[-.085em]">{copy.price.title}</h2>
                <p className="mt-7 max-w-2xl leading-8 text-charcoal/68" lang={locale === "mm" ? "my" : "en"}>{copy.price.body}</p>
              </div>
              <div className="lg:text-right">
                <Link href={`/${locale}/login?next=/${locale}/app`} className="primary-button w-full sm:w-auto">{copy.price.button}<ArrowRight size={16} /></Link>
                <p className="mono mt-4 text-xs text-charcoal/45">{copy.price.note}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-charcoal/10 px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1220px] gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div data-reveal>
              <p className="eyebrow text-aqua">{copy.faq.eyebrow}</p>
              <h2 className="mt-5 font-display text-5xl font-bold tracking-[-.055em]">{copy.faq.title}</h2>
            </div>
            <div className="divide-y divide-charcoal/10 border-y border-charcoal/10">
              {copy.faq.items.map((item) => (
                <details data-reveal key={item.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-lg font-bold">
                    <span lang={locale === "mm" ? "my" : "en"}>{item.q}</span><span className="mono text-sky transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pt-4 leading-7 text-charcoal/55" lang={locale === "mm" ? "my" : "en"}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-charcoal px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Image src="/brand/logo-light.svg" width={170} height={48} alt="Project Peak" />
            <p className="mono mt-5 text-xs text-white/35">{copy.footer}</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/45"><Link className="underline-offset-4 hover:underline" href={`/${locale}/legal`}>Terms · Privacy</Link><span>© {new Date().getFullYear()} Project Peak · Myanmar</span></div>
        </div>
      </footer>
    </div>
  );
}
