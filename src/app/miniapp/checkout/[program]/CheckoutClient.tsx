"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatMmk, paymentMethods, type ProjectProgram } from "@/lib/projectPeakConfig";
import { FlowSteps } from "../../FlowSteps";

type SubmitState = "idle" | "submitting" | "pending" | "error";

const fieldClass =
  "w-full rounded-xl border border-[#d8dedb] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c2b29] focus:ring-2 focus:ring-[#1c2b29]/10";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-[#3a4744]";

export default function CheckoutClient({
  program,
  initialMonths,
}: {
  program: ProjectProgram;
  initialMonths: number;
}) {
  const initialDuration = useMemo(
    () => program.durations.find((item) => item.months === initialMonths) || program.durations[0],
    [initialMonths, program.durations],
  );
  const [selectedDuration, setSelectedDuration] = useState(initialDuration.months);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].id);
  const [telegramId, setTelegramId] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const duration =
    program.durations.find((item) => item.months === selectedDuration) || program.durations[0];
  const payment = paymentMethods.find((item) => item.id === selectedPayment) || paymentMethods[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("program_name", program.name);
    formData.set("duration_months", String(duration.months));
    formData.set("program_price", String(duration.price));
    formData.set("payment_method", payment.label);

    try {
      const response = await fetch("/api/save-registration", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Registration failed");
      setSubmitState("pending");
      form.reset();
      setTelegramId("");
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] pb-10 text-[#1c2b29]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-4 pt-4">
        <Link
          href={`/miniapp/packages/${program.key}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#6b7a77] no-underline hover:text-[#1c2b29]"
        >
          <i className="ph ph-arrow-left text-base" /> Details
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1c2b29] p-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Payment review</p>
            <h1 className="mt-0.5 text-xl font-extrabold">{program.shortName}</h1>
            <span className="text-sm text-white/70">{program.headline}</span>
          </div>
          <strong className="shrink-0 text-xl font-extrabold text-[#ff6b35]">
            {formatMmk(duration.price)}
          </strong>
        </div>

        <FlowSteps active={2} />

        {/* Summary */}
        <section className="flex items-center gap-4 rounded-2xl border border-[#e6eae8] bg-white p-4">
          <Image
            src={program.image}
            alt={program.name}
            width={96}
            height={96}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">
              Included after approval
            </p>
            {program.includes.slice(0, 3).map((item) => (
              <span key={item.title} className="flex items-center gap-1.5 text-sm text-[#3a4744]">
                <i className={`ph ${item.icon} text-base text-[#ff6b35]`} /> {item.title}
              </span>
            ))}
          </div>
        </section>

        {/* Duration */}
        <div className="grid grid-cols-3 gap-2">
          {program.durations.map((item) => {
            const active = item.months === selectedDuration;
            return (
              <button
                type="button"
                key={item.months}
                onClick={() => setSelectedDuration(item.months)}
                className={`flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-[#1c2b29] bg-[#1c2b29] text-white"
                    : "border-[#e6eae8] bg-white text-[#1c2b29]"
                }`}
              >
                <span className={`text-xs font-semibold ${active ? "text-white/60" : "text-[#9aa8a4]"}`}>
                  {item.label}
                </span>
                <strong className="text-sm font-extrabold">{formatMmk(item.price)}</strong>
                <em className={`text-[0.66rem] not-italic ${active ? "text-white/70" : "text-[#6b7a77]"}`}>
                  {item.note}
                </em>
              </button>
            );
          })}
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-[#e6eae8] bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">Payment</p>
              <h2 className="text-xl font-extrabold text-[#1c2b29]">{formatMmk(duration.price)}</h2>
            </div>
            <span className="rounded-full bg-[#eef2f0] px-3 py-1 text-xs font-semibold text-[#6b7a77]">
              {duration.label}
            </span>
          </div>

          {/* Payment tabs */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((item) => {
              const active = selectedPayment === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedPayment(item.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-bold transition ${
                    active
                      ? "border-[#1c2b29] bg-[#f6f8f7]"
                      : "border-[#e6eae8] text-[#6b7a77]"
                  }`}
                >
                  <Image src={item.logo} alt="" width={24} height={24} className="rounded" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* QR + instructions */}
          <div className="flex flex-col gap-4 rounded-xl bg-[#f6f8f7] p-4 sm:flex-row sm:items-start">
            <Image
              src={payment.qr}
              alt={`${payment.label} QR`}
              width={170}
              height={170}
              className="mx-auto h-40 w-40 shrink-0 rounded-xl border border-[#e6eae8] bg-white object-contain p-2"
            />
            <div className="flex flex-1 flex-col gap-3">
              <h3 className="text-sm font-bold text-[#1c2b29]">After transfer</h3>
              <p className="text-xs leading-relaxed text-[#6b7a77]">
                Payment screenshot တင်ပြီး Telegram username/ID ဖြည့်ပါ။ Admin approve ပြီး custom
                tracker ပြင်ပြီးတာနဲ့ bot ကနေ ready link ပို့ပါမယ်။
              </p>
              <label className={labelClass}>
                Telegram username / ID
                <input
                  name="telegram_id"
                  value={telegramId}
                  onChange={(event) => setTelegramId(event.target.value)}
                  placeholder="@username or 1827344905"
                  required
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                Payment screenshot
                <input
                  name="payment_screenshot"
                  type="file"
                  accept="image/*"
                  required
                  className="text-sm text-[#6b7a77] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef2f0] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#1c2b29]"
                />
              </label>
            </div>
          </div>

          {/* Intake */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">Client intake</p>
            <h2 className="text-base font-extrabold text-[#1c2b29]">
              Admin က custom plan ဆွဲဖို့လိုတဲ့ data
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input name="username" placeholder="Your name" required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Email
              <input name="email" type="email" placeholder="you@example.com" required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Phone
              <input name="phone" placeholder="09..." required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Age
              <input name="age" type="number" min="12" placeholder="24" required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Height
              <input name="height" placeholder="170 cm" required className={fieldClass} />
            </label>
            <label className={labelClass}>
              Weight
              <input name="weight" type="number" step="0.1" placeholder="70" required className={fieldClass} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: "photo_front", label: "Front photo" },
              { name: "photo_back", label: "Back photo" },
              { name: "photo_side", label: "Side photo" },
            ].map((photo) => (
              <label key={photo.name} className={labelClass}>
                {photo.label}
                <input
                  name={photo.name}
                  type="file"
                  accept="image/*"
                  className="text-sm text-[#6b7a77] file:mr-2 file:rounded-lg file:border-0 file:bg-[#eef2f0] file:px-2.5 file:py-2 file:text-xs file:font-semibold file:text-[#1c2b29]"
                />
              </label>
            ))}
          </div>

          <label className={labelClass}>
            Goal / notes
            <textarea
              name="notes"
              rows={4}
              placeholder="သင့်ရဲ့ goal, injury, schedule စတာတွေ..."
              className={fieldClass}
            />
          </label>

          <input type="hidden" name="workout_split" value="Admin customized plan" />

          {submitState === "pending" && (
            <div className="flex items-start gap-2 rounded-xl border border-[#bfe6c9] bg-[#edf9f0] px-3 py-2.5 text-sm font-semibold text-[#1d7a3a]">
              <i className="ph ph-check-circle mt-0.5 text-base" />
              <span>
                Payment pending ဖြစ်သွားပါပြီ။ Admin approve ပြီး custom tracker ဆွဲပြီးတာနဲ့ Telegram
                bot မှာ access button ပို့ပေးပါမယ်။
              </span>
            </div>
          )}
          {submitState === "error" && (
            <div className="flex items-start gap-2 rounded-xl border border-[#f4c7bd] bg-[#fdeee9] px-3 py-2.5 text-sm font-semibold text-[#c0432b]">
              <i className="ph ph-warning mt-0.5 text-base" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitState === "submitting"}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1c2b29] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#26403c] disabled:opacity-60"
          >
            <i className={`ph ${submitState === "submitting" ? "ph-spinner animate-spin" : "ph-paper-plane-tilt"} text-base`} />
            {submitState === "submitting" ? "Submitting..." : "Submit payment for review"}
          </button>
        </motion.form>
      </div>
    </main>
  );
}
