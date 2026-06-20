"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface DashboardClientProps {
  username: string;
  role: "admin" | "user";
  isAdminViewing: boolean;
  clientQuery: string;
  targetUserId: string;
  initialQuote: string;
  dates: string[];
  weights: number[];
  program: any;
  profile: any;
  todayStr: string;
  todayLog: any;
  yesterdayWeight: number | null;
  schedule: any;
  totalMealsCount: number;
  eatenMealsCount: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  streak: number;
  initialTab?: string;
}

type ActiveTab = "logs" | "progress" | "feedback" | "me";

const SLEEP_SCORES: Record<string, number> = { Poor: 1, Light: 2, OK: 3, Deep: 4 };
const SCORE_TO_SLEEP: Record<number, string> = { 1: "Poor", 2: "Light", 3: "OK", 4: "Deep" };

export default function DashboardClient({
  username,
  isAdminViewing,
  clientQuery,
  targetUserId,
  initialQuote,
  dates,
  weights,
  program,
  profile,
  todayStr,
  todayLog,
  yesterdayWeight,
  schedule,
  totalMealsCount,
  eatenMealsCount,
  consumedCalories,
  consumedProtein,
  consumedCarbs,
  consumedFat,
  streak,
  initialTab,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab === "progress" || initialTab === "feedback" || initialTab === "me" ? initialTab : "logs",
  );

  const startingWeight = profile?.starting_weight ? Number(profile.starting_weight) : null;
  const [weight, setWeight] = useState(() =>
    Number(todayLog?.body_weight ?? yesterdayWeight ?? startingWeight ?? 0),
  );
  const [steps, setSteps] = useState(() => Number(todayLog?.steps ?? 0));
  const [water, setWater] = useState(() =>
    Number(todayLog?.water_liters ?? (todayLog?.water_3l ? 3 : 0)),
  );
  const [sleep, setSleep] = useState<string>(() =>
    todayLog?.sleep_score ? SCORE_TO_SLEEP[Number(todayLog.sleep_score)] || "" : "",
  );
  const [upAt, setUpAt] = useState<string>(todayLog?.wake_time || "");
  const [phoneOff, setPhoneOff] = useState<string>(todayLog?.phone_off_time || "");
  const [omegaTaken, setOmegaTaken] = useState(Boolean(todayLog?.omega_3));
  const [saving, setSaving] = useState(false);
  const [homePrompt, setHomePrompt] = useState(true);
  const [deviceMessage, setDeviceMessage] = useState("");

  const hasWeight = weight > 0;
  const weekLabel = program?.duration_weeks ? `${program.duration_weeks}-week program` : "Your program";
  const workoutName = schedule?.is_rest ? "Recovery Day" : schedule?.split_name || "No split set";
  const mealTarget = Math.max(totalMealsCount || 0, 0);
  const adherence = mealTarget > 0 ? Math.round((eatenMealsCount / mealTarget) * 100) : 0;

  const weightDelta = useMemo(() => {
    if (weights.length < 2) return null;
    const delta = Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10;
    return `${delta > 0 ? "+" : ""}${delta}kg`;
  }, [weights]);

  useEffect(() => {
    const storageKey = "project_peak_device_id";
    const existing = window.localStorage.getItem(storageKey);
    const deviceId = existing || (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
    if (!existing) window.localStorage.setItem(storageKey, deviceId);

    fetch("/api/user/register-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, userAgent: window.navigator.userAgent }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setDeviceMessage(payload.error || "Device check failed.");
        }
      })
      .catch(() => null);
  }, []);

  async function saveDaily(extra?: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch("/api/user/save-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          date: todayStr,
          bodyWeight: weight,
          steps,
          sleepScore: sleep ? SLEEP_SCORES[sleep] : null,
          water3l: water >= 3,
          waterLiters: water,
          phoneOffTime: phoneOff || null,
          omega3: omegaTaken,
          bedPhoneFilter: true,
          ...extra,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  const firstName = username?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#f6f8f7] pb-24 text-[#1c2b29]">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-4">
        {isAdminViewing && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#ffd9c7] bg-[#fff4ee] px-3 py-2 text-xs font-semibold text-[#b25b15]">
            <i className="ph ph-eye text-base" /> Admin previewing client dashboard
          </div>
        )}

        <header className="flex items-center justify-between py-2">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-[#9aa8a4]">
              Project Peak · {weekLabel}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">Hi, {firstName}</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#1c2b29] px-3 py-1.5 text-sm font-bold text-white">
            <i className="ph-fill ph-fire text-[#ff6b35]" />
            {streak}
          </div>
        </header>

        {activeTab === "logs" && (
          <div className="mt-3 flex flex-col gap-4">
            {/* Morning */}
            <Section icon="ph-sun" title="Morning">
              <Row icon="ph-scales" label="Weight">
                <div className="flex items-center gap-2">
                  <StepBtn
                    icon="ph-minus"
                    onClick={() => setWeight((v) => Math.round((v - 0.1) * 10) / 10)}
                  />
                  <strong className="min-w-[64px] text-center text-lg font-extrabold">
                    {hasWeight ? weight.toFixed(1) : "—"}
                    <small className="ml-0.5 text-xs font-semibold text-[#9aa8a4]">kg</small>
                  </strong>
                  <StepBtn
                    icon="ph-plus"
                    onClick={() => setWeight((v) => Math.round((v + 0.1) * 10) / 10)}
                  />
                  <button
                    type="button"
                    onClick={() => saveDaily()}
                    className="rounded-lg bg-[#1c2b29] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Log
                  </button>
                </div>
              </Row>
              <Row icon="ph-clock" label="Up at">
                <Choices
                  options={["5:30", "6:00", "6:30", "7:00"]}
                  value={upAt}
                  onSelect={(v) => {
                    setUpAt(v);
                    saveDaily({ wakeTime: v });
                  }}
                />
              </Row>
              <Row icon="ph-moon" label="Sleep">
                <Choices
                  options={["Poor", "Light", "OK", "Deep"]}
                  value={sleep}
                  onSelect={(v) => {
                    setSleep(v);
                    saveDaily({ sleepScore: SLEEP_SCORES[v] });
                  }}
                />
              </Row>
            </Section>

            {/* Mid-day */}
            <Section icon="ph-mountains" title="Mid-day">
              <Row icon="ph-barbell" label={workoutName}>
                <a
                  href={`/user/workout${clientQuery}`}
                  className="rounded-lg bg-[#eef2f0] px-3 py-1.5 text-xs font-bold text-[#1c2b29] no-underline"
                >
                  {schedule?.is_rest ? "Rest" : "Start"}
                </a>
              </Row>
              <Row icon="ph-fork-knife" label="Meals">
                <a
                  href={`/user/diet${clientQuery}`}
                  className="flex items-center gap-2 no-underline text-[#1c2b29]"
                >
                  <span className="text-xs font-semibold text-[#6b7a77]">
                    {eatenMealsCount}/{mealTarget || "—"} · {consumedCalories} kcal
                  </span>
                  <i className="ph ph-caret-right text-sm text-[#b6c1bd]" />
                </a>
              </Row>
            </Section>

            {/* Night */}
            <Section icon="ph-moon" title="Night">
              <Row icon="ph-person-simple-walk" label="Steps">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={steps || ""}
                    placeholder="0"
                    onChange={(e) => setSteps(Number(e.target.value) || 0)}
                    onBlur={() => saveDaily()}
                    className="w-24 rounded-lg border border-[#d8dedb] px-2 py-1 text-right text-sm font-bold outline-none focus:border-[#1c2b29]"
                  />
                </div>
              </Row>
              <Row icon="ph-device-mobile-slash" label="Phone off">
                <Choices
                  options={["21:30", "22:00", "22:30", "23:00"]}
                  value={phoneOff}
                  onSelect={(v) => {
                    setPhoneOff(v);
                    saveDaily({ phoneOffTime: v });
                  }}
                />
              </Row>
              <Row icon="ph-drop" label="Water">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{water.toFixed(1)} / 3 L</span>
                  <StepBtn
                    icon="ph-plus"
                    onClick={() => {
                      const next = Math.min(3, Math.round((water + 0.5) * 10) / 10);
                      setWater(next);
                      saveDaily({ water3l: next >= 3, waterLiters: next });
                    }}
                  />
                </div>
              </Row>
              <Row icon="ph-pill" label="Omega 3">
                <button
                  type="button"
                  onClick={() => {
                    const next = !omegaTaken;
                    setOmegaTaken(next);
                    saveDaily({ omega3: next });
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    omegaTaken
                      ? "bg-[#1c2b29] text-white"
                      : "bg-[#eef2f0] text-[#6b7a77]"
                  }`}
                >
                  {omegaTaken ? "Taken" : "Tap when taken"}
                </button>
              </Row>
            </Section>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="mt-3 flex flex-col gap-4">
            <h2 className="text-lg font-extrabold">Progress</h2>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Weight Δ" value={weightDelta ?? "—"} />
              <Metric label="Calories" value={consumedCalories ? `${consumedCalories}` : "—"} sub={consumedCalories ? `${consumedProtein}p · ${consumedCarbs}c · ${consumedFat}f` : undefined} />
              <Metric label="Adherence" value={mealTarget ? `${adherence}%` : "—"} />
            </div>

            <div className="rounded-2xl border border-[#e6eae8] bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">
                Weight trend
              </p>
              {weights.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#9aa8a4]">
                  Log your weight to see your trend here.
                </p>
              ) : (
                <>
                  <div className="flex h-28 items-end gap-1.5">
                    {weights.map((value, index, arr) => {
                      const min = Math.min(...arr);
                      const max = Math.max(...arr);
                      const h = 30 + ((value - min) / Math.max(1, max - min)) * 65;
                      return (
                        <span
                          key={`${value}-${index}`}
                          className="flex-1 rounded-t bg-[#1c2b29]"
                          style={{ height: `${h}%` }}
                          title={`${dates[index] || ""}: ${value}kg`}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-[#6b7a77]">
                    {dates.length ? `Latest log: ${dates[dates.length - 1]}` : ""}
                  </p>
                </>
              )}
            </div>
            <p className="rounded-2xl bg-[#eef2f0] px-4 py-3 text-sm italic text-[#3a4744]">
              “{initialQuote}”
            </p>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="mt-3 flex flex-col gap-3">
            <h2 className="text-lg font-extrabold">Feedback</h2>
            <a
              href={`/user/check-in${clientQuery}`}
              className="flex items-start gap-3 rounded-2xl border border-[#e6eae8] bg-white p-4 no-underline text-[#1c2b29]"
            >
              <i className="ph ph-chat-circle-text mt-0.5 text-xl text-[#ff6b35]" />
              <span className="flex flex-col">
                <strong className="text-sm font-bold">Weekly Check-in</strong>
                <span className="text-xs text-[#6b7a77]">
                  Submit progress photo, average weight, energy and struggle notes.
                </span>
              </span>
            </a>
            <div className="flex items-start gap-3 rounded-2xl border border-[#e6eae8] bg-[#f6f8f7] p-4 opacity-70">
              <i className="ph ph-lock mt-0.5 text-xl text-[#9aa8a4]" />
              <span className="flex flex-col">
                <strong className="text-sm font-bold">End Program Review</strong>
                <span className="text-xs text-[#6b7a77]">
                  Unlocks at the end of your current program.
                </span>
              </span>
            </div>
          </div>
        )}

        {activeTab === "me" && (
          <div className="mt-3 flex flex-col gap-3">
            <h2 className="text-lg font-extrabold">Me</h2>
            <div className="overflow-hidden rounded-2xl border border-[#e6eae8] bg-white">
              <InfoRow label="Name" value={username} />
              <InfoRow label="Program" value={program?.program_type || "Not assigned"} />
              <InfoRow
                label="Starting weight"
                value={startingWeight ? `${startingWeight} kg` : "—"}
              />
              <InfoRow label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
              <InfoRow label="Device limit" value="2 devices" last />
            </div>
            <a
              href={`/user/setup-profile?mode=edit${clientQuery ? `&${clientQuery.replace(/^\?/, "")}` : ""}`}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1c2b29] py-2.5 text-sm font-bold text-white no-underline"
            >
              <i className="ph ph-pencil-simple text-base" />
              Edit profile
            </a>
            <button
              type="button"
              onClick={async () => {
                setDeviceMessage("");
                const response = await fetch("/api/user/reset-devices", { method: "POST" });
                setDeviceMessage(
                  response.ok
                    ? "Device sessions reset. Reload on the device you want to keep."
                    : "Device reset failed.",
                );
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white py-2.5 text-sm font-bold text-[#1c2b29]"
            >
              <i className="ph ph-arrows-clockwise text-base" /> Request device reset
            </button>
          </div>
        )}

        {homePrompt && activeTab === "logs" && (
          <div className="relative mt-4 rounded-2xl border border-[#e6eae8] bg-white p-4">
            <button
              type="button"
              onClick={() => setHomePrompt(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-[#b6c1bd]"
            >
              <i className="ph ph-x" />
            </button>
            <strong className="text-sm font-bold">Add to Home Screen</strong>
            <p className="mt-0.5 text-xs text-[#6b7a77]">Daily log ကို app လိုသုံးနိုင်ပါတယ်။</p>
          </div>
        )}

        {deviceMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ffd9c7] bg-[#fff4ee] px-3 py-2 text-xs font-semibold text-[#b25b15]">
            <i className="ph ph-warning text-base" /> {deviceMessage}
          </div>
        )}
      </div>

      {/* Bottom tabs */}
      <nav
        className="fixed bottom-0 left-0 z-50 w-full border-t border-[#e6eae8] bg-white/95 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
        aria-label="Dashboard tabs"
      >
        <div className="mx-auto flex max-w-[480px] items-center justify-around">
          <Tab icon="ph-house" label="Logs" active={activeTab === "logs"} onClick={() => setActiveTab("logs")} />
          <Tab icon="ph-trend-up" label="Progress" active={activeTab === "progress"} onClick={() => setActiveTab("progress")} />
          <Tab icon="ph-chat-circle-text" label="Feedback" active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} />
          <Tab icon="ph-user" label="Me" active={activeTab === "me"} onClick={() => setActiveTab("me")} />
        </div>
      </nav>

      {saving && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1c2b29] px-4 py-1.5 text-xs font-semibold text-white">
          Saving…
        </div>
      )}
    </main>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e6eae8] bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">
        <i className={`ph ${icon} text-sm text-[#ff6b35]`} />
        {title}
      </div>
      <div className="flex flex-col divide-y divide-[#f1f4f2]">{children}</div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <i className={`ph ${icon} text-base text-[#5b6a67]`} />
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function StepBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef2f0] text-[#1c2b29]"
    >
      <i className={`ph ${icon} text-base`} />
    </button>
  );
}

function Choices({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
            value === opt ? "bg-[#1c2b29] text-white" : "bg-[#eef2f0] text-[#6b7a77]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[#e6eae8] bg-white p-3 text-center">
      <span className="text-[0.64rem] font-bold uppercase tracking-wide text-[#9aa8a4]">{label}</span>
      <strong className="mt-1 block text-lg font-extrabold leading-tight">{value}</strong>
      {sub && <em className="text-[0.6rem] not-italic text-[#9aa8a4]">{sub}</em>}
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        last ? "" : "border-b border-[#f1f4f2]"
      }`}
    >
      <span className="text-sm font-semibold text-[#6b7a77]">{label}</span>
      <span className="text-sm font-bold capitalize">{value}</span>
    </div>
  );
}

function Tab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 transition ${
        active ? "text-[#1c2b29]" : "text-[#9aa8a4]"
      }`}
    >
      {active && (
        <span className="absolute -top-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#ff6b35]" />
      )}
      <i className={`ph ${icon} text-xl`} />
      <span className="text-[0.66rem] font-bold">{label}</span>
    </button>
  );
}
