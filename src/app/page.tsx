"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { formatMmk, paymentMethods, projectPrograms, ProgramKey } from "@/lib/projectPeakConfig";

type SubmitState = "idle" | "submitting" | "pending" | "error";

export default function Home() {
  const [selectedProgram, setSelectedProgram] = useState<ProgramKey>("recomp");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].id);
  const [telegramId, setTelegramId] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showInstallModal, setShowInstallModal] = useState(true);

  const program = useMemo(
    () => projectPrograms.find((item) => item.key === selectedProgram) || projectPrograms[0],
    [selectedProgram],
  );

  const duration = program.durations.find((item) => item.months === selectedDuration) || program.durations[0];
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
      const response = await fetch("/api/save-registration", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Registration failed");
      }
      setSubmitState("pending");
      form.reset();
    } catch (error) {
      setSubmitState("error");
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <main className="pp-shell">
      <section className="pp-miniapp">
        <div className="pp-miniapp__hero">
          <Image src="/img/hero_bg.jpg" alt="Project Peak mountain training" fill priority sizes="(max-width: 780px) 100vw, 780px" className="pp-miniapp__hero-img" />
          <div className="pp-miniapp__hero-overlay" />
          <div className="pp-miniapp__hero-copy">
            <p>Project Peak · Telegram Mini App</p>
            <h1>Choose your coaching track</h1>
            <span>Telegram ID နဲ့ program/payment flow ကိုတစ်နေရာတည်းမှာလုပ်နိုင်အောင် compact app အဖြစ် ပြန်တည်ဆောက်ထားပါတယ်။</span>
          </div>
        </div>

        <div className="pp-miniapp__content">
          <div className="pp-program-strip" aria-label="Program selector">
            {projectPrograms.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`pp-program-pill ${selectedProgram === item.key ? "is-active" : ""}`}
                style={{ "--pill-accent": item.accent } as CSSProperties}
                onClick={() => {
                  setSelectedProgram(item.key);
                  setSelectedDuration(item.durations[0].months);
                }}
              >
                <Image src={item.image} alt="" width={44} height={44} className="pp-program-pill__image" />
                <span>{item.shortName}</span>
              </button>
            ))}
          </div>

          <article className="pp-program-focus" style={{ "--focus-accent": program.accent } as CSSProperties}>
            <div className="pp-program-focus__media">
              <Image src={program.image} alt={program.name} fill sizes="(max-width: 840px) calc(100vw - 68px), 170px" className="pp-program-focus__image" />
            </div>
            <div className="pp-program-focus__body">
              <p>Selected Package</p>
              <h2>{program.name}</h2>
              <span>{program.description}</span>
            </div>
          </article>

          <div className="pp-duration-grid">
            {program.durations.map((item) => (
              <button
                type="button"
                key={item.months}
                className={`pp-duration-card ${item.months === selectedDuration ? "is-active" : ""}`}
                onClick={() => setSelectedDuration(item.months)}
              >
                <span>{item.label}</span>
                <strong>{formatMmk(item.price)}</strong>
                <em>{item.note}</em>
              </button>
            ))}
          </div>

          <form className="pp-checkout" onSubmit={handleSubmit}>
            <div className="pp-checkout__header">
              <div>
                <p>Payment</p>
                <h2>{formatMmk(duration.price)}</h2>
              </div>
              <span>{duration.label}</span>
            </div>

            <div className="pp-payment-tabs">
              {paymentMethods.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`pp-payment-tab ${selectedPayment === item.id ? "is-active" : ""}`}
                  onClick={() => setSelectedPayment(item.id)}
                >
                  <Image src={item.logo} alt="" width={28} height={28} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pp-payment-panel">
              <Image src={payment.qr} alt={`${payment.label} QR`} width={190} height={190} className="pp-payment-qr" />
              <div>
                <h3>After transfer</h3>
                <p>Payment screenshot တင်ပြီး Telegram ID ဖြည့်ပါ။ Admin ကို bot message နဲ့ website notification နှစ်နေရာ notify လုပ်သွားမယ်။</p>
                <label>
                  Telegram ID
                  <input
                    name="telegram_id"
                    value={telegramId}
                    onChange={(event) => setTelegramId(event.target.value)}
                    placeholder="e.g. 1827344905"
                    required
                  />
                </label>
                <label>
                  Payment screenshot
                  <input name="payment_screenshot" type="file" accept="image/*" required />
                </label>
              </div>
            </div>

            <div className="pp-intake-grid">
              <label>
                Name
                <input name="username" placeholder="Your name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label>
                Phone
                <input name="phone" placeholder="09..." required />
              </label>
              <label>
                Age
                <input name="age" type="number" min="12" placeholder="24" required />
              </label>
              <label>
                Height
                <input name="height" placeholder="170 cm" required />
              </label>
              <label>
                Weight
                <input name="weight" type="number" step="0.1" placeholder="81.2" required />
              </label>
              <label>
                Front photo
                <input name="photo_front" type="file" accept="image/*" />
              </label>
              <label>
                Back photo
                <input name="photo_back" type="file" accept="image/*" />
              </label>
              <label>
                Side photo
                <input name="photo_side" type="file" accept="image/*" />
              </label>
            </div>

            <label className="pp-full-label">
              Goal / notes
              <textarea name="notes" rows={4} placeholder="သင့်ရဲ့ goal, injury, schedule စတာတွေ..." />
            </label>

            <input type="hidden" name="workout_split" value="Admin customized plan" />

            {submitState === "pending" && (
              <div className="pp-status-box is-success">
                <i className="ph ph-check-circle" />
                <span>Payment pending ဖြစ်သွားပါပြီ။ Admin approve ပြီး custom tracker ဆွဲပြီးတာနဲ့ Telegram မှာ access button ပို့ပေးပါမယ်။</span>
              </div>
            )}
            {submitState === "error" && (
              <div className="pp-status-box is-error">
                <i className="ph ph-warning" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button className="pp-primary-action" type="submit" disabled={submitState === "submitting"}>
              <i className="ph ph-paper-plane-tilt" />
              {submitState === "submitting" ? "Submitting..." : "Submit payment for review"}
            </button>
          </form>
        </div>
      </section>

      {showInstallModal && (
        <div className="pp-install-modal" role="dialog" aria-modal="true" aria-label="Add to home screen">
          <div>
            <button type="button" aria-label="Close" onClick={() => setShowInstallModal(false)}>
              <i className="ph ph-x" />
            </button>
            <i className="ph ph-device-mobile" />
            <h2>Add Project Peak to Home Screen</h2>
            <p>Approve ပြီး login ဝင်တဲ့အချိန်မှာ app ကို Home Screen ပို့ထားရင် daily log ဖြည့်ရတာပိုလွယ်ပါတယ်။</p>
          </div>
        </div>
      )}
    </main>
  );
}
