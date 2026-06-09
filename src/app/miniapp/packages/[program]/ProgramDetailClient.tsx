"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatMmk, type ProjectProgram } from "@/lib/projectPeakConfig";
import { appendTelegramParams, type TelegramIdentity, watchTelegramIdentity } from "@/lib/telegramWebApp";
import { FlowSteps } from "../../FlowSteps";

export default function ProgramDetailClient({ program }: { program: ProjectProgram }) {
  const [telegramIdentity, setTelegramIdentity] = useState<TelegramIdentity | null>(null);

  useEffect(() => {
    return watchTelegramIdentity(setTelegramIdentity);
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f7] pb-10 text-[#1c2b29]">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pt-4">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src={program.image}
            alt={program.name}
            width={760}
            height={340}
            priority
            className="h-56 w-full object-cover sm:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <Link
            href={appendTelegramParams("/miniapp", telegramIdentity)}
            className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-bold text-white no-underline backdrop-blur"
          >
            <i className="ph ph-arrow-left" /> Packages
          </Link>
          <div className="absolute bottom-0 left-0 p-5 sm:p-6">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: program.accent }}
            >
              {program.shortName}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {program.headline}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-white/80">{program.description}</p>
          </div>
        </div>

        <FlowSteps active={1} />

        {/* Best for */}
        <Section eyebrow="Best for" title="ဒီ package က ဘယ်သူတွေအတွက်လဲ">
          <p className="text-sm leading-relaxed text-[#3a4744]">{program.bestFor}</p>
        </Section>

        {/* Includes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {program.includes.map((item) => (
            <motion.article
              key={item.title}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-[#e6eae8] bg-white p-4"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-xl text-xl text-white"
                style={{ backgroundColor: program.accent }}
              >
                <i className={`ph ${item.icon}`} />
              </span>
              <h3 className="mt-3 text-sm font-bold text-[#1c2b29]">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6b7a77]">{item.description}</p>
            </motion.article>
          ))}
        </div>

        {/* Outcomes + process */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Section eyebrow="Expected outcomes" title="သင်ရမယ့်အရာတွေ">
            <ul className="flex flex-col gap-2">
              {program.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2 text-sm text-[#3a4744]">
                  <i className="ph-fill ph-check-circle mt-0.5 text-base text-[#1d7a3a]" />
                  {outcome}
                </li>
              ))}
            </ul>
          </Section>
          <Section eyebrow="How it works" title="လုပ်ငန်းစဉ်">
            <ol className="flex flex-col gap-2">
              {program.process.map((step, index) => (
                <li key={step} className="flex items-start gap-2 text-sm text-[#3a4744]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1c2b29] text-[0.62rem] font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>
        </div>

        {/* Duration */}
        <Section eyebrow="Choose duration" title="Duration ရွေးပြီး payment ဆက်လုပ်ပါ">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {program.durations.map((duration) => (
              <Link
                key={duration.months}
                href={appendTelegramParams(`/miniapp/checkout/${program.key}?months=${duration.months}`, telegramIdentity)}
                className="group flex flex-col gap-1 rounded-2xl border border-[#e6eae8] bg-white p-4 no-underline transition hover:border-[#1c2b29]"
              >
                <span className="text-xs font-semibold text-[#9aa8a4]">{duration.label}</span>
                <strong className="text-lg font-extrabold text-[#1c2b29]">
                  {formatMmk(duration.price)}
                </strong>
                <em className="text-xs not-italic text-[#6b7a77]">{duration.note}</em>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#ff6b35]">
                  Continue <i className="ph ph-arrow-right transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e6eae8] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b35]">{eyebrow}</p>
      <h2 className="mb-3 mt-1 text-base font-extrabold text-[#1c2b29]">{title}</h2>
      {children}
    </section>
  );
}
