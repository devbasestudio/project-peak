"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { landingCopy } from "@/lib/landing-content";
import styles from "./landing.module.css";

const weeks = Array.from({ length: 12 }, (_, index) => ({ week: index + 1, from: index * 4 + 1, to: index * 4 + 4 }));
const movements = ["Push up", "Wide pull up", "Lateral raise · 4 L", "Sissy squat"];

export function LandingPage({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const copy = landingCopy[locale];
  const mm = locale === "mm";
  const other = mm ? "en" : "mm";
  const movementLabels = mm ? ["ဒိုက်ထိုး (Push-up)", "လက်ကျယ်ဆွဲတင် (Wide pull-up)", "ဘေးသို့လက်မြှောက် · ၄ လီတာ", "Sissy squat"] : movements;

  const phases = mm ? [
    { no: "01", meta: "စတင်ချိန် · နေ့ ၀၀", title: "အစမ်းတိုင်းတာခြင်း", body: "လက်ရှိအင်အားကို လှုပ်ရှားမှု ၄ မျိုးနဲ့ တိတိကျကျ မှတ်တမ်းတင်မယ်။" },
    { no: "02", meta: "လေ့ကျင့်မှု · ၀၁—၁၂", title: "အခြေခံတည်ဆောက်ခြင်း", body: "လှုပ်ရှားပုံမှန်ကန်ရေး၊ လေ့ကျင့်မှုအစီအစဉ်နဲ့ နေ့စဉ်အလေ့အကျင့်ကို အရင်ဆုံး ခိုင်မာအောင်လုပ်မယ်။" },
    { no: "03", meta: "လေ့ကျင့်မှု · ၁၃—၄၇", title: "အဆင့်လိုက်တိုးခြင်း", body: "သတ်မှတ်ထားတဲ့ အကြိမ်ရေကို ကောင်းကောင်းလုပ်နိုင်တဲ့အခါမှ ကျောပိုးအိတ်ထဲ အလေးချိန်တိုးမယ်။ လေ့ကျင့်ခန်းတစ်ခုစီကို ကိုယ်လုပ်နိုင်တဲ့အရှိန်နဲ့ တိုးသွားမယ်။" },
    { no: "04", meta: "လေ့ကျင့်မှု · ၄၈", title: "တိုးတက်မှုကို သက်သေပြခြင်း", body: "အစမှာစမ်းခဲ့တဲ့ လှုပ်ရှားမှု ၄ မျိုးကို ပြန်စမ်းပြီး ပထမပတ်နဲ့ နောက်ဆုံးပတ်ရလဒ်ကို ဘေးချင်းယှဉ်ကြည့်မယ်။" },
  ] : [
    { no: "01", meta: "START · DAY 00", title: "Baseline", body: "Record exactly where you are through four clean movement tests." },
    { no: "02", meta: "SESSIONS · 01—12", title: "Foundation", body: "Build form, rhythm and habits before chasing heavier work." },
    { no: "03", meta: "SESSIONS · 13—47", title: "Progressive overload", body: "Own the rep range, then add weight. Each exercise moves at its own pace." },
    { no: "04", meta: "SESSION · 48", title: "Proof", body: "Repeat the four tests and place Week 1 directly beside Week 12." },
  ];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(([gsapModule, scrollTriggerModule, lenisModule]) => {
      if (disposed) return;
      const gsap = gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      const Lenis = lenisModule.default;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.08, smoothWheel: true, wheelMultiplier: 0.9 });
      const raf = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => { gsap.ticker.remove(raf); lenis.destroy(); };
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    const dot = cursor.current;
    const container = root.current;
    if (!dot || !container || window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import("gsap").then(({ default: gsap }) => {
      if (disposed) return;
      const move = (event: MouseEvent) => {
        dot.classList.add(styles.cursorVisible);
        gsap.to(dot, { x: event.clientX, y: event.clientY, duration: 0.16, ease: "power2.out", overwrite: "auto" });
      };
      const grow = () => dot.classList.add(styles.cursorActive);
      const shrink = () => dot.classList.remove(styles.cursorActive);
      const targets = container.querySelectorAll("a, button, summary");
      window.addEventListener("mousemove", move);
      targets.forEach((target) => { target.addEventListener("mouseenter", grow); target.addEventListener("mouseleave", shrink); });
      cleanup = () => {
        window.removeEventListener("mousemove", move);
        targets.forEach((target) => { target.removeEventListener("mouseenter", grow); target.removeEventListener("mouseleave", shrink); });
      };
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const intro = container.querySelector<HTMLElement>("[data-intro]");
      if (intro) intro.style.display = "none";
      return;
    }
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, scrollTriggerModule]) => {
      if (disposed) return;
      const gsap = gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
      const counter = { value: 0 };
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
      .from("[data-intro-word]", { yPercent: 125, duration: 0.72, stagger: 0.08, ease: "power4.inOut" })
      .to("[data-intro-rule]", { scaleX: 1, duration: 0.42, ease: "power3.inOut" }, "-=.32")
      .to("[data-intro]", { yPercent: -100, duration: 0.86, delay: 0.12, ease: "power4.inOut" })
      .from("[data-nav]", { autoAlpha: 0, y: -18, duration: 0.55 }, "-=.28")
      .from("[data-hero-image]", { scale: 1.14, clipPath: "inset(0 0 100% 0)", duration: 1.25, ease: "power4.inOut" }, "-=.35")
      .from("[data-hero-line]", { yPercent: 120, duration: 0.85, stagger: 0.08 }, "-=.82")
      .from("[data-hero-copy], [data-hero-action]", { autoAlpha: 0, y: 20, duration: 0.58, stagger: 0.08 }, "-=.45")
      .to(counter, { value: 48, duration: 1.25, snap: { value: 1 }, ease: "power2.out", onUpdate: () => {
        const node = root.current?.querySelector<HTMLElement>("[data-counter]");
        if (node) node.textContent = String(Math.round(counter.value)).padStart(2, "0");
      } }, "-=1");

    gsap.to("[data-hero-image]", { scale: 1.03, yPercent: 7, ease: "none", scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to("[data-marquee]", { xPercent: -20, ease: "none", scrollTrigger: { trigger: "[data-marquee-wrap]", start: "top bottom", end: "bottom top", scrub: 0.7 } });
    gsap.to("[data-method-image]", { scale: 1.07, ease: "none", scrollTrigger: { trigger: "[data-method]", start: "top bottom", end: "bottom top", scrub: 1 } });
    gsap.fromTo("[data-route-line]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-route]", start: "top 72%", end: "bottom 70%", scrub: 0.8 } });
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => gsap.from(element, { autoAlpha: 0, y: 52, duration: 0.82, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 87%", once: true } }));
      gsap.utils.toArray<HTMLElement>("[data-scale]").forEach((element) => gsap.from(element, { scale: 0.9, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 84%", once: true } }));
      }, container);
      cleanup = () => context.revert();
    }).catch(() => {
      const intro = container.querySelector<HTMLElement>("[data-intro]");
      if (intro) intro.style.display = "none";
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return (
    <div className={styles.page} lang={mm ? "my" : "en"} ref={root}>
      <div aria-hidden="true" className={styles.cursor} ref={cursor} />
      <div aria-hidden="true" className={styles.siteIntro} data-intro>
        <div className={styles.introWord}><span data-intro-word>PROJECT</span></div>
        <span className={styles.introRule} data-intro-rule />
        <div className={`${styles.introWord} ${styles.introOutline}`}><span data-intro-word>PEAK</span></div>
        <small>12 WEEKS · 48 SESSIONS · YOUR ASCENT</small>
      </div>
      <header className={styles.header} data-nav>
        <Link className={styles.brand} href={`/${locale}`}><Image alt="Project Peak" height={46} priority src="/brand/logo-dark.svg" width={174} /></Link>
        <nav className={styles.nav} aria-label="Main navigation"><a href="#route">{copy.nav.journey}</a><a href="#method">{copy.nav.method}</a><a href="#program">{copy.nav.program}</a></nav>
        <div className={styles.navActions}><Link className={styles.language} href={`/${other}`}>{mm ? "EN" : "မြန်မာ"}</Link><Link className={styles.login} href={`/${locale}/login`}>{copy.nav.signIn}<ChevronRight size={14} /></Link></div>
      </header>

      <main>
        <section className={styles.hero} data-hero>
          <div className={styles.heroPhoto}><Image alt="Athlete training at home with a Project Peak weighted backpack" data-hero-image fill priority sizes="100vw" src="/brand/hero-athlete-branded.jpg" /></div>
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <p className={styles.kicker}>12 WEEKS · 48 SESSIONS · ONE BACKPACK</p>
            <h1 className={styles.heroTitle}>
              <span><i data-hero-line>{mm ? "အိမ်မှာ" : "BUILD"}</i></span>
              <span><i data-hero-line>{mm ? "ပိုသန်မာ" : "YOUR"}</i></span>
              <span><i className={styles.accent} data-hero-line>{mm ? "လာမယ်။" : "PEAK."}</i></span>
            </h1>
            <p className={styles.heroCopy} data-hero-copy>{copy.hero.body}</p>
            <div className={styles.heroActions} data-hero-action><Link className={styles.primary} href={`/${locale}/login?next=/${locale}/app`}>{copy.hero.primary}<ArrowRight size={17} /></Link><a className={styles.textLink} href="#route">{copy.hero.secondary}<ArrowDown size={15} /></a></div>
          </div>
          <div className={styles.heroIndex}><span>SESSION</span><strong data-counter>00</strong><small>/48</small></div>
          <div className={styles.heroCaption}>PROJECT PEAK · BACKPACK METHOD · MYANMAR</div>
        </section>

        <div className={styles.marquee} data-marquee-wrap><div data-marquee>FORM FIRST <b>✦</b> KNOWLEDGE <b>✦</b> HABITS <b>✦</b> PROGRESSIVE OVERLOAD <b>✦</b> NO MISSED DAYS <b>✦</b> YOUR PACE <b>✦</b> FORM FIRST <b>✦</b> KNOWLEDGE <b>✦</b> HABITS <b>✦</b></div></div>

        <section className={styles.opening}>
          <div className={styles.openingNumber} data-scale>12<span>W</span></div>
          <div data-reveal><p className={styles.sectionLabel}>{copy.thesis.eyebrow}</p><h2>{copy.thesis.title}</h2><p>{copy.thesis.body}</p></div>
        </section>

        <section className={styles.route} data-route id="route">
          <div className={styles.routeIntro}><p className={styles.sectionLabel}>THE 12-WEEK ROUTE</p><h2>{mm ? "စိတ်အားတက်လာမယ့်အချိန်ကို မစောင့်နဲ့။ သတ်မှတ်ထားတဲ့ လမ်းကြောင်းအတိုင်း ဆက်သွားမယ်။" : "DON’T WAIT FOR MOTIVATION. FOLLOW THE ROUTE."}</h2><p>{mm ? "ပြီးရမယ့်ရက် အတိအကျမရှိပါဘူး။ ကိုယ်လုပ်နိုင်တဲ့အရှိန်နဲ့ လေ့ကျင့်ခန်းတစ်ကြိမ်ပြီးတစ်ကြိမ် ဆက်လုပ်သွားမယ်။" : "There is no calendar deadline. Move at your pace, one completed session at a time."}</p></div>
          <div className={styles.phaseList}><span className={styles.routeLine} data-route-line />{phases.map((phase) => <article data-reveal key={phase.no}><span className={styles.phaseNo}>{phase.no}</span><div><p>{phase.meta}</p><h3>{phase.title}</h3><span>{phase.body}</span></div></article>)}</div>
        </section>

        <section className={styles.method} data-method id="method">
          <div className={styles.methodPhoto}><Image alt="Loading a Project Peak backpack for progressive overload" data-method-image fill sizes="(max-width: 900px) 100vw, 58vw" src="/brand/backpack-load-branded.jpg" /></div>
          <div className={styles.methodCopy} data-reveal><p className={styles.sectionLabel}>THE BACKPACK METHOD</p><h2>{mm ? "ရှိတာနဲ့ စမယ်။ ကောင်းကောင်းလုပ်နိုင်တဲ့အခါမှ အလေးချိန်တိုးမယ်။" : "START WITH WHAT YOU HAVE. EARN MORE WEIGHT."}</h2><p>{mm ? "စာအုပ်၊ ရေဘူးနဲ့ ကျောပိုးအိတ်တစ်လုံးပဲလိုတယ်။ လေ့ကျင့်မှုအတွဲတိုင်းမှာ သတ်မှတ်အကြိမ်ရေအပြည့်ကို မှန်မှန်ကန်ကန်လုပ်နိုင်တဲ့အခါမှ အလေးချိန်တိုးမယ်။ မလုပ်နိုင်သေးရင် မတိုးသေးဘူး။" : "Books, water, and one backpack. Weight only rises after every set reaches the top of its rep range. Until then, it stays."}</p><div className={styles.ruleFormula}><span>REPS FIRST</span><b>→</b><span>LOAD NEXT</span><b>→</b><span>REPEAT</span></div></div>
        </section>

        <section className={styles.foundations} id="program">
          <header data-reveal><p className={styles.sectionLabel}>{copy.showcase.eyebrow}</p><h2>{mm ? "ခန္ဓာကိုယ်ပြောင်းလဲပြီးနောက်မှာပါ ကျန်ရှိနေမယ့် အခြေခံနှစ်ခု။" : "TWO FOUNDATIONS THAT OUTLAST A TRANSFORMATION."}</h2></header>
          <div className={styles.foundationRows}>{copy.pillars.map((pillar, index) => (
            <article data-reveal key={pillar.number}>
              <div className={styles.foundationTop}><span>0{index + 1}</span><small>{index === 0 ? "LEARN · APPLY · ADJUST" : "SHOW UP · LOG · REPEAT"}</small></div>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
              <div className={styles.foundationVisual}>
                {index === 0 ? <span className={styles.foundationVisualLabel}>FORM <b>→</b> LOAD <b>→</b> LOG <b>→</b> RECOVER</span> : <div className={styles.habitWeekLabels}><span>W01</span><span>W02</span><span>W03</span></div>}
                <div className={index === 0 ? styles.knowledgeMarks : styles.habitMarks}>{Array.from({ length: index === 0 ? 12 : 21 }, (_, mark) => <i key={mark} />)}</div>
              </div>
            </article>
          ))}</div>
        </section>

        <section className={styles.weekSystem}>
          <div className={styles.weekHead}>
            <div><p className={styles.sectionLabel}>48 SESSION SYSTEM</p><h2>{mm ? "၁၂ ပတ်လုံး ဘာလုပ်ရမလဲ တစ်ချက်ကြည့်ရုံနဲ့ သိနိုင်မယ်။" : "YOUR 12 WEEKS, CLEAR AT A GLANCE."}</h2></div>
            <div><p>{mm ? "တစ်ပတ်မှာ လေ့ကျင့်ခန်း ၄ ကြိမ်ပါမယ်—တွန်းလေ့ကျင့်ခန်း ၂ ကြိမ်နဲ့ ဆွဲလေ့ကျင့်ခန်း ၂ ကြိမ်။ ရက်သတ်မှတ်ချက်မရှိလို့ ပြီးထားတဲ့နေရာကနေ ကိုယ့်အရှိန်နဲ့ ဆက်လုပ်နိုင်တယ်။" : "Four sessions each week: two push and two pull. No deadline—complete the next session in your queue."}</p><div className={styles.weekLegend}><span><i className={styles.push} />PUSH</span><span><i className={styles.pull} />PULL</span></div></div>
          </div>
          <div className={styles.weekRows}>{weeks.map((item, weekIndex) => <article data-phase={Math.floor(weekIndex / 4) + 1} data-reveal key={item.week}><div className={styles.weekCardTop}><span>W{String(item.week).padStart(2, "0")}</span><small>{weekIndex < 4 ? "FOUNDATION" : weekIndex < 8 ? "BUILD" : "PEAK"}</small></div><strong>{String(item.from).padStart(2, "0")}—{String(item.to).padStart(2, "0")}</strong><p>SESSIONS</p><div className={styles.weekPattern}>{Array.from({ length: 4 }, (_, index) => <i className={index % 2 === 0 ? styles.push : styles.pull} key={index}>{index % 2 === 0 ? "P" : "L"}</i>)}</div></article>)}</div>
        </section>

        <section className={styles.proof}>
          <div className={styles.proofTitle} data-reveal><p className={styles.sectionLabel}>BASELINE → PROOF</p><h2>{mm ? "ခံစားချက်နဲ့ မှန်းတာမဟုတ်ဘူး။ တိုင်းတာလို့ရတဲ့ တိုးတက်မှု။" : "NOT A FEELING. MEASURED PROGRESS."}</h2></div>
          <div className={styles.proofList}>{movementLabels.map((movement, index) => <div data-reveal key={movement}><span>0{index + 1}</span><strong>{movement}</strong><p>WEEK 01</p><b>→</b><p>WEEK 12</p></div>)}</div>
        </section>

        <section className={styles.equipment}>
          <div data-reveal><p className={styles.sectionLabel}>{copy.equipment.eyebrow}</p><h2>{copy.equipment.title}</h2><p>{copy.equipment.body}</p></div>
          <ol>{copy.equipment.items.map((item, index) => <li data-reveal key={item}><span>0{index + 1}</span>{item}<Check size={17} /></li>)}</ol>
        </section>

        <section className={styles.purchase}>
          <p>PROJECT PEAK · COMPLETE 12-WEEK ROUTE</p>
          <div className={styles.purchasePrice} data-scale><span>75,000</span><small>MMK</small></div>
          <div className={styles.purchaseBottom}><p>{copy.price.body}</p><Link className={styles.purchaseButton} href={`/${locale}/login?next=/${locale}/app`}>{copy.price.button}<ArrowRight size={18} /></Link></div>
        </section>

        <section className={styles.faq} id="faq"><div><p className={styles.sectionLabel}>{copy.faq.eyebrow}</p><h2>{copy.faq.title}</h2></div><div>{copy.faq.items.map((item) => <details key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</div></section>
      </main>

      <footer className={styles.footer}><Image alt="Project Peak" height={48} src="/brand/logo-light.svg" width={180} /><p>{copy.footer}</p><div><Link href={`/${locale}/legal`}>Terms · Privacy</Link><span>© {new Date().getFullYear()}</span></div></footer>
    </div>
  );
}
