"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatMmk, type ProjectProgram } from "@/lib/projectPeakConfig";
import { appendTelegramParams, copyText, type TelegramIdentity, watchTelegramIdentity } from "@/lib/telegramWebApp";
import { FlowSteps } from "./FlowSteps";

export default function MiniAppClient({ programs }: { programs: ProjectProgram[] }) {
  const [telegramIdentity, setTelegramIdentity] = useState<TelegramIdentity | null>(null);
  const [copiedTelegramId, setCopiedTelegramId] = useState(false);

  useEffect(() => {
    return watchTelegramIdentity(setTelegramIdentity);
  }, []);

  async function handleCopyTelegramId() {
    if (!telegramIdentity?.id) return;
    const copied = await copyText(telegramIdentity.id);
    setCopiedTelegramId(copied);
    if (copied) {
      window.setTimeout(() => setCopiedTelegramId(false), 1600);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] pb-10 text-[#1c2b29]">
      <div className="mx-auto w-full max-w-[760px] px-4 pt-4">
        <header className="relative overflow-hidden rounded-3xl">
          <Image
            src="/img/hero_bg.jpg"
            alt="Project Peak mountain training"
            width={760}
            height={320}
            priority
            className="h-52 w-full object-cover sm:h-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Project Peak Mini App
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              Choose your package
            </h1>
            <p className="mt-1 max-w-md text-sm text-white/80">
              Package တစ်ခုရွေးပြီး detail ကြည့်ပါ။ ပြီးမှ duration ရွေးပြီး payment submit လုပ်ပါ။
            </p>
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-[#e6eae8] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">Telegram ID</p>
          {telegramIdentity ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-2xl font-extrabold text-[#1c2b29]">
                  {telegramIdentity.id}
                </strong>
                <span className="block truncate text-sm font-semibold text-[#6b7a77]">
                  {telegramIdentity.username ? `@${telegramIdentity.username}` : telegramIdentity.displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyTelegramId}
                className="shrink-0 rounded-xl bg-[#1c2b29] px-4 py-2.5 text-sm font-extrabold text-white"
              >
                {copiedTelegramId ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <p className="mt-2 rounded-xl border border-[#f4d6a8] bg-[#fff7e8] px-3 py-2 text-sm font-bold leading-relaxed text-[#9a5a12]">
              Bot မှာ /start နှိပ်ပြီး Open Project Peak ကိုဖွင့်ပါ။ User ID ကို ဒီနေရာမှာ auto
              ပြပြီး copy လုပ်လို့ရပါမယ်။
            </p>
          )}
        </section>

        <FlowSteps active={0} className="mt-5" />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {programs.map((program) => (
            <motion.article
              key={program.key}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              className="overflow-hidden rounded-2xl border border-[#e6eae8] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <Link
                href={appendTelegramParams(`/miniapp/packages/${program.key}`, telegramIdentity)}
                aria-label={`View ${program.name}`}
                className="block no-underline"
              >
                <div className="relative">
                  <Image
                    src={program.image}
                    alt={program.name}
                    width={380}
                    height={200}
                    className="h-44 w-full object-cover"
                  />
                  <span
                    className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: program.accent }}
                  >
                    {program.shortName}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-4">
                  <p className="text-xs font-semibold text-[#9aa8a4]">{program.bestFor}</p>
                  <h2 className="text-base font-extrabold text-[#1c2b29]">{program.name}</h2>
                  <span className="text-sm text-[#6b7a77]">{program.headline}</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <strong className="text-lg font-extrabold text-[#1c2b29]">
                      {formatMmk(program.durations[0].price)}
                    </strong>
                    <em className="text-xs not-italic text-[#9aa8a4]">starts from</em>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
