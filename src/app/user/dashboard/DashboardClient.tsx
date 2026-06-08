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
}

type ActiveTab = "logs" | "progress" | "feedback" | "me";

export default function DashboardClient({
  username,
  isAdminViewing,
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
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("logs");
  const [weight, setWeight] = useState(() => Number(todayLog?.body_weight || yesterdayWeight || profile?.starting_weight || 81.2));
  const [steps, setSteps] = useState(() => Number(todayLog?.steps || 8420));
  const [water, setWater] = useState(() => (todayLog?.water_3l ? 3 : 1.2));
  const [sleep, setSleep] = useState(todayLog?.sleep_score ? "OK" : "OK");
  const [phoneOff, setPhoneOff] = useState("22:00");
  const [omegaTaken, setOmegaTaken] = useState(Boolean(todayLog?.omega_3));
  const [mealOne, setMealOne] = useState(eatenMealsCount > 0);
  const [saving, setSaving] = useState(false);
  const [homePrompt, setHomePrompt] = useState(true);
  const [deviceMessage, setDeviceMessage] = useState("");

  const weekLabel = program?.duration_weeks ? `W${Math.min(6, program.duration_weeks)}/${program.duration_weeks}` : "W6/16";
  const workoutName = schedule?.is_rest ? "Recovery Day" : schedule?.split_name || "Upper - Push";
  const progressPercent = Math.min(100, Math.round((eatenMealsCount / Math.max(totalMealsCount || 4, 1)) * 100));

  const weightDelta = useMemo(() => {
    if (!weights.length) return "-2.4kg";
    const first = weights[0];
    const last = weights[weights.length - 1];
    const delta = Math.round((last - first) * 10) / 10;
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
          sleepScore: sleep === "Poor" ? 1 : sleep === "Light" ? 2 : sleep === "OK" ? 3 : 4,
          water3l: water >= 3,
          waterLiters: water,
          phoneOffTime: phoneOff,
          omega3: omegaTaken,
          bedPhoneFilter: true,
          mealPlanAdhered: mealOne,
          ...extra,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pp-user-app">
      <section className="pp-phone-shell">
        {isAdminViewing && (
          <div className="pp-admin-viewing">
            <i className="ph ph-eye" />
            Admin previewing client dashboard
          </div>
        )}

        <header className="pp-user-header">
          <div>
            <p>PROJECT PEAK · {weekLabel}</p>
            <h1>Morning, {username?.split(" ")[0] || "Zwe"}</h1>
          </div>
          <div className="pp-streak">
            <i className="ph ph-fire" />
            {streak || 13}
          </div>
        </header>

        {activeTab === "logs" && (
          <div className="pp-daily-panel">
            <SectionTitle icon="ph-sun" title="Morning" />
            <TrackerRow icon="ph-scales" label="Weight">
              <button type="button" onClick={() => setWeight((value) => Math.round((value - 0.1) * 10) / 10)}>
                <i className="ph ph-minus" />
              </button>
              <strong>{weight.toFixed(1)}<small>kg</small></strong>
              <button type="button" onClick={() => setWeight((value) => Math.round((value + 0.1) * 10) / 10)}>
                <i className="ph ph-plus" />
              </button>
              <button type="button" className="pp-log-button" onClick={() => saveDaily()}>
                Log
              </button>
            </TrackerRow>
            <TrackerRow icon="ph-clock" label="Up at">
              {["5:30", "6:00", "6:30", "7:00"].map((time) => (
                <button key={time} type="button" className={time === "6:30" ? "is-selected" : ""}>
                  {time}
                </button>
              ))}
            </TrackerRow>
            <TrackerRow icon="ph-moon" label="Sleep">
              {["Poor", "Light", "OK", "Deep"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={sleep === item ? "is-selected" : ""}
                  onClick={() => {
                    setSleep(item);
                    saveDaily({ sleepScore: item === "Poor" ? 1 : item === "Light" ? 2 : item === "OK" ? 3 : 4 });
                  }}
                >
                  {item}
                </button>
              ))}
            </TrackerRow>

            <div className="pp-first-win">
              <strong>FIRST WIN</strong>
              <span><i className="ph ph-drop" /> 500ml</span>
              <span><i className="ph ph-sun" /> 10min</span>
            </div>

            <SectionTitle icon="ph-mountains" title="Mid-day" />
            <TrackerRow icon="ph-barbell" label={workoutName}>
              <span>~45 min</span>
              <button type="button" className="pp-light-button">Start</button>
            </TrackerRow>
            <TrackerRow icon="ph-check" label="Meal 1" active={mealOne}>
              <button
                type="button"
                className="pp-text-button"
                onClick={() => {
                  setMealOne((value) => !value);
                  saveDaily({ mealPlanAdhered: !mealOne });
                }}
              >
                600 kcal · 31p
              </button>
            </TrackerRow>
            {["Meal 2", "Meal 3", "Meal 4"].map((meal, index) => (
              <TrackerRow key={meal} icon="ph-camera" label={meal}>
                <span>~{[410, 283, 436][index]} kcal · {[40, 12, 30][index]}p</span>
              </TrackerRow>
            ))}
            <button type="button" className="pp-off-plan">
              <i className="ph ph-plus" /> Off plan? Snap it
            </button>

            <SectionTitle icon="ph-moon" title="Night" />
            <TrackerRow icon="ph-person-simple-walk" label="Steps">
              <span className="pp-auto">auto</span>
              <strong>{steps.toLocaleString()}</strong>
            </TrackerRow>
            <TrackerRow icon="ph-device-mobile-slash" label="Phone off">
              {["21:30", "22:00", "22:30", "23:00"].map((time) => (
                <button
                  key={time}
                  type="button"
                  className={phoneOff === time ? "is-selected" : ""}
                  onClick={() => {
                    setPhoneOff(time);
                    saveDaily({ phoneOffTime: time });
                  }}
                >
                  {time}
                </button>
              ))}
            </TrackerRow>
            <TrackerRow icon="ph-drop" label="Water">
              <span>{water.toFixed(1)} / 3 L</span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(3, Math.round((water + 0.5) * 10) / 10);
                  setWater(next);
                  saveDaily({ water3l: next >= 3, waterLiters: next });
                }}
              >
                <i className="ph ph-plus" />
              </button>
            </TrackerRow>
            <TrackerRow icon="ph-pill" label="Omega 3">
              <button
                type="button"
                className={omegaTaken ? "is-selected" : ""}
                onClick={() => {
                  setOmegaTaken((value) => !value);
                  saveDaily({ omega3: !omegaTaken });
                }}
              >
                {omegaTaken ? "Taken" : "Tap when taken"}
              </button>
            </TrackerRow>
            <JournalRow icon="ph-trend-up" label="One win" tone="green" />
            <JournalRow icon="ph-trend-down" label="One struggle" tone="gold" />
          </div>
        )}

        {activeTab === "progress" && (
          <div className="pp-tab-panel">
            <h2>Progress</h2>
            <div className="pp-progress-grid">
              <MetricCard label="Weight change" value={weightDelta} />
              <MetricCard label="Calories" value={`${consumedCalories || 1690}`} sub={`${consumedProtein || 143}p · ${consumedCarbs || 185}c · ${consumedFat || 48}f`} />
              <MetricCard label="Adherence" value={`${progressPercent || 75}%`} />
            </div>
            <div className="pp-chart-lite">
              {(weights.length ? weights : [83.6, 82.9, 82.2, 81.8, 81.2]).map((value, index, arr) => (
                <span key={`${value}-${index}`} style={{ height: `${42 + ((value - Math.min(...arr)) / Math.max(1, Math.max(...arr) - Math.min(...arr))) * 50}%` }} />
              ))}
            </div>
            <p>{dates.length ? `Latest log: ${dates[dates.length - 1]}` : initialQuote}</p>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="pp-tab-panel">
            <h2>Feedback</h2>
            <div className="pp-feedback-card is-open">
              <i className="ph ph-chat-circle-text" />
              <div>
                <strong>Weekly Check-in</strong>
                <span>Unlocked · submit progress photo, average weight, energy and struggle notes.</span>
              </div>
            </div>
            <div className="pp-feedback-card">
              <i className="ph ph-lock" />
              <div>
                <strong>End Program Review</strong>
                <span>Unlocks at the end of your current program.</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "me" && (
          <div className="pp-tab-panel">
            <h2>Me</h2>
            <div className="pp-profile-list">
              <span><strong>Name</strong>{username}</span>
              <span><strong>Telegram ID</strong>{targetUserId.slice(0, 8)}...</span>
              <span><strong>Program</strong>{program?.program_type || "customized"}</span>
              <span><strong>Device limit</strong>2 devices</span>
              <button
                type="button"
                onClick={async () => {
                  setDeviceMessage("");
                  const response = await fetch("/api/user/reset-devices", { method: "POST" });
                  setDeviceMessage(response.ok ? "Device sessions reset. Reload on the device you want to keep." : "Device reset failed.");
                }}
              >
                <i className="ph ph-arrows-clockwise" /> Request device reset
              </button>
            </div>
          </div>
        )}

        {homePrompt && (
          <div className="pp-home-prompt">
            <button type="button" onClick={() => setHomePrompt(false)} aria-label="Close add to home screen prompt">
              <i className="ph ph-x" />
            </button>
            <strong>Add to Home Screen</strong>
            <span>Daily log ကို app လိုသုံးနိုင်ပါတယ်။</span>
          </div>
        )}

        {deviceMessage && (
          <div className="pp-device-warning">
            <i className="ph ph-warning" />
            <span>{deviceMessage}</span>
          </div>
        )}

        <nav className="pp-bottom-nav" aria-label="Dashboard tabs">
          <TabButton icon="ph-house" label="Daily Logs" active={activeTab === "logs"} onClick={() => setActiveTab("logs")} />
          <TabButton icon="ph-trend-up" label="Progress" active={activeTab === "progress"} onClick={() => setActiveTab("progress")} />
          <TabButton icon="ph-chat-circle-text" label="Feedback" active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} />
          <TabButton icon="ph-user" label="Me" active={activeTab === "me"} onClick={() => setActiveTab("me")} />
        </nav>

        {saving && <div className="pp-saving-pill">Saving...</div>}
      </section>
    </main>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="pp-section-title">
      <i className={`ph ${icon}`} />
      <span>{title}</span>
    </div>
  );
}

function TrackerRow({
  icon,
  label,
  children,
  active = false,
}: {
  icon: string;
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={`pp-tracker-row ${active ? "is-complete" : ""}`}>
      <i className={`ph ${icon}`} />
      <strong>{label}</strong>
      <div>{children}</div>
    </div>
  );
}

function JournalRow({ icon, label, tone }: { icon: string; label: string; tone: "green" | "gold" }) {
  return (
    <button type="button" className={`pp-journal-row pp-journal-row--${tone}`}>
      <i className={`ph ${icon}`} />
      <strong>{label}</strong>
      <span>tap to write</span>
    </button>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="pp-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <em>{sub}</em>}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={active ? "is-active" : ""} onClick={onClick}>
      <i className={`ph ${icon}`} />
      <span>{label}</span>
    </button>
  );
}
