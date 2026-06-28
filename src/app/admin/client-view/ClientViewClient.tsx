"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardTitle, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import { actionButtonClass } from "@/components/admin/useAdminAction";

interface ClientViewClientProps {
  client: any;
  program: any;
  checkins: any[];
  dailyLogs: any[];
  registration: any;
  selectedWeek: number | null;
  clientId: string;
}

const accessLinks = [
  { href: "dashboard", icon: "ph-squares-four", label: "Dashboard" },
  { href: "dashboard?tab=progress", icon: "ph-chart-line-up", label: "Progress" },
  { href: "dashboard?tab=feedback", icon: "ph-chat-circle-text", label: "Feedback" },
  { href: "dashboard?tab=me", icon: "ph-user", label: "Profile" },
];

export default function ClientViewClient({
  client,
  program,
  checkins,
  dailyLogs,
  registration,
  selectedWeek,
  clientId,
}: ClientViewClientProps) {
  const router = useRouter();

  const [durationWeeks, setDurationWeeks] = useState(program?.duration_weeks ?? 12);
  const [targetCalories, setTargetCalories] = useState(program?.target_calories ?? 2000);
  const [macrosP, setMacrosP] = useState(program?.macros_p ?? 150);
  const [macrosC, setMacrosC] = useState(program?.macros_c ?? 200);
  const [macrosF, setMacrosF] = useState(program?.macros_f ?? 65);
  const [programType, setProgramType] = useState(program?.program_type ?? "custom_plan");

  const [updatingProgram, setUpdatingProgram] = useState(false);
  const [programSuccess, setProgramSuccess] = useState(false);
  const [programError, setProgramError] = useState("");

  const [feedbackValues, setFeedbackValues] = useState<Record<number, string>>(
    checkins.reduce((acc, curr) => {
      acc[curr.id] = curr.admin_feedback || "";
      return acc;
    }, {} as Record<number, string>),
  );
  const [savingFeedback, setSavingFeedback] = useState<Record<number, boolean>>({});
  const [feedbackSuccess, setFeedbackSuccess] = useState<Record<number, boolean>>({});
  const [feedbackError, setFeedbackError] = useState<Record<number, string>>({});

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProgram(true);
    setProgramSuccess(false);
    setProgramError("");
    try {
      const res = await fetch("/api/admin/update-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          duration_weeks: durationWeeks,
          target_calories: targetCalories,
          macros_p: macrosP,
          macros_c: macrosC,
          macros_f: macrosF,
          program_type: programType,
        }),
      });
      if (res.ok) {
        setProgramSuccess(true);
        router.refresh();
      } else {
        const data = await res.json();
        setProgramError(data.error || "Failed to update program.");
      }
    } catch {
      setProgramError("Network error occurred.");
    } finally {
      setUpdatingProgram(false);
    }
  };

  const handleSaveFeedback = async (checkinId: number) => {
    setSavingFeedback((prev) => ({ ...prev, [checkinId]: true }));
    setFeedbackSuccess((prev) => ({ ...prev, [checkinId]: false }));
    setFeedbackError((prev) => ({ ...prev, [checkinId]: "" }));
    try {
      const res = await fetch("/api/admin/save-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_id: checkinId, admin_feedback: feedbackValues[checkinId] }),
      });
      if (res.ok) {
        setFeedbackSuccess((prev) => ({ ...prev, [checkinId]: true }));
        router.refresh();
      } else {
        const data = await res.json();
        setFeedbackError((prev) => ({ ...prev, [checkinId]: data.error || "Failed to save feedback." }));
      }
    } catch {
      setFeedbackError((prev) => ({ ...prev, [checkinId]: "Network error occurred." }));
    } finally {
      setSavingFeedback((prev) => ({ ...prev, [checkinId]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b7a77] no-underline hover:text-[#1c2b29]"
      >
        <i className="ph ph-arrow-left text-base" /> Back to clients
      </Link>

      <PageHeader
        icon="ph-user"
        title={`${client.username || "Client"}`}
        subtitle={client.email}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Program builder */}
        <Card className="h-fit">
          <CardTitle icon="ph-sliders" title="Program builder" meta="Macros" />

          {programSuccess && <Banner tone="success">Program updated successfully.</Banner>}
          {programError && <Banner tone="error">{programError}</Banner>}

          <form onSubmit={handleUpdateProgram} className="mt-3 flex flex-col gap-3">
            <FieldLabel>
              Workout template
              <select
                className={inputClass}
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
              >
                <option value="custom_plan">Custom plan</option>
                <option value="fat_loss">Fat loss focus</option>
                <option value="strength">Strength focus</option>
                <option value="muscle_gain">Muscle gain focus</option>
              </select>
            </FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Duration (weeks)" value={durationWeeks} onChange={setDurationWeeks} />
              <NumberField label="Target calories" value={targetCalories} onChange={setTargetCalories} />
              <NumberField label="Protein (g)" value={macrosP} onChange={setMacrosP} />
              <NumberField label="Carbs (g)" value={macrosC} onChange={setMacrosC} />
              <NumberField label="Fats (g)" value={macrosF} onChange={setMacrosF} />
            </div>
            <button type="submit" disabled={updatingProgram} className={`${actionButtonClass} mt-1`}>
              <i className="ph ph-floppy-disk text-base" />
              {updatingProgram ? "Updating…" : "Update program"}
            </button>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Dashboard access */}
          <Card>
            <CardTitle icon="ph-user-gear" title="View as client" />
            <p className="mb-3 text-xs text-[#6b7a77]">
              Open any of the client&apos;s screens exactly as they see them.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {accessLinks.map((link) => (
                <Link
                  key={link.href}
                  href={`/user/${link.href}${link.href.includes("?") ? "&" : "?"}client_id=${clientId}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#e6eae8] px-3 py-2.5 text-sm font-semibold text-[#1c2b29] no-underline transition hover:border-[#cdd6d2] hover:bg-[#f6f8f7]"
                >
                  <i className={`ph ${link.icon} text-base text-[#ff6b35]`} /> {link.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle icon="ph-identification-card" title="Client info" meta={registration?.program_name || "Current"} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Telegram" value={registration?.telegram_id || "—"} />
              <Metric label="Phone" value={registration?.phone || "—"} />
              <Metric label="Age" value={registration?.age ? String(registration.age) : "—"} />
              <Metric label="Weight" value={registration?.weight ? `${registration.weight} kg` : "—"} />
              <Metric label="Height" value={registration?.height || "—"} />
              <Metric label="Goal" value={readAnswer(registration?.intake_answers, "goal") || "—"} />
            </div>
            {(registration?.photo_front || registration?.photo_back || registration?.photo_side) && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ClientPhoto label="Front" src={registration?.photo_front} />
                <ClientPhoto label="Back" src={registration?.photo_back} />
                <ClientPhoto label="Side" src={registration?.photo_side} />
              </div>
            )}
          </Card>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1c2b29]">
              <i className="ph ph-calendar-check text-lg text-[#ff6b35]" /> Daily logs
            </h2>
            {dailyLogs.length === 0 ? (
              <Card>
                <p className="py-4 text-center text-sm text-[#9aa8a4]">No daily logs yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {dailyLogs.map((log) => (
                  <Card key={`${log.user_id}-${log.date}`}>
                    <div className="flex items-center justify-between border-b border-[#eef2f0] pb-3">
                      <h3 className="text-base font-bold text-[#1c2b29]">{formatDate(log.date)}</h3>
                      <span className="text-xs font-bold text-[#9aa8a4]">{dailyCompletionLabel(log)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Metric label="Weight" value={log.body_weight ? `${log.body_weight} kg` : "—"} />
                      <Metric label="Steps" value={log.steps ? String(log.steps) : "—"} />
                      <Metric label="Sleep" value={sleepLabel(log.sleep_score)} />
                      <Metric label="Water" value={log.water_liters ? `${log.water_liters} L` : log.water_3l ? "3 L" : "—"} />
                      <Metric label="Wake" value={log.wake_time || "—"} />
                      <Metric label="Phone off" value={log.phone_off_time || "—"} />
                      <Metric label="Omega 3" value={log.omega_3 ? "Done" : "—"} />
                      <Metric label="Meal" value={log.meal_plan_adhered ? "Done" : "—"} />
                    </div>
                    {(log.one_win || log.one_struggle) && (
                      <div className="mt-3 flex flex-col gap-2">
                        <Note label="One win" value={log.one_win} tone="good" />
                        <Note label="One struggle" value={log.one_struggle} tone="warn" />
                      </div>
                    )}
                    {log.tracker_values && Object.keys(log.tracker_values).length > 0 && (
                      <div className="mt-3 rounded-xl border border-[#e6eae8] bg-[#f6f8f7] p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">Custom tracker values</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {Object.entries(log.tracker_values).map(([key, value]) => (
                            <CustomValue key={key} label={key} value={value} />
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Weekly check-ins */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1c2b29]">
              <i className="ph ph-clipboard-text text-lg text-[#ff6b35]" /> Weekly check-ins
            </h2>

            {checkins.length === 0 ? (
              <Card>
                <p className="py-4 text-center text-sm text-[#9aa8a4]">No check-ins yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {checkins.map((chk) => {
                  const highlighted = selectedWeek === chk.week_number;
                  const progressPhotoUrl =
                    chk.progress_photo_url && String(chk.progress_photo_url).startsWith("http")
                      ? chk.progress_photo_url
                      : chk.progress_photo_url
                        ? `/${chk.progress_photo_url}`
                        : "";
                  return (
                    <Card
                      key={chk.id}
                      className={highlighted ? "!border-[#ff6b35] ring-2 ring-[#ff6b35]/10" : ""}
                    >
                      <div className="flex items-center justify-between border-b border-[#eef2f0] pb-3">
                        <h3 className="text-base font-bold text-[#1c2b29]">
                          Week {chk.week_number}
                        </h3>
                        <span className="text-xs text-[#9aa8a4]">
                          {new Date(chk.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Metric label="Avg weight" value={`${chk.avg_weight} kg`} />
                        <Metric label="Energy (workout)" value={`${chk.energy_workout}/10`} />
                        <Metric label="Energy (daily)" value={`${chk.energy_daily}/10`} />
                        <Metric label="Motivation" value={`${chk.motivation}/10`} />
                      </div>

                      {progressPhotoUrl && (
                        <a
                          href={progressPhotoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block overflow-hidden rounded-xl border border-[#e6eae8]"
                        >
                          <img
                            src={progressPhotoUrl}
                            alt="Progress"
                            className="block max-h-40 w-auto"
                          />
                        </a>
                      )}

                      <div className="mt-4 flex flex-col gap-2">
                        <Note label="Energy notes (workout)" value={chk.energy_workout_notes} />
                        <Note label="Energy notes (daily)" value={chk.energy_daily_notes} />
                        <Note label="Motivation notes" value={chk.motivation_notes} />
                        <Note label="Struggles" value={chk.struggle_notes} tone="warn" />
                        <Note label="Improvements / wins" value={chk.improvement_notes} tone="good" />
                        <Note label="Upcoming disruptions" value={chk.upcoming_disruptions} />
                        <Note label="Changes wanted" value={chk.changes_wanted} />
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-[#eef2f0] pt-4">
                        <label className="flex items-center gap-1.5 text-sm font-bold text-[#1c2b29]">
                          <i className="ph ph-chat-circle-text text-base text-[#ff6b35]" /> Trainer
                          feedback
                        </label>
                        {feedbackSuccess[chk.id] && (
                          <Banner tone="success">Feedback saved.</Banner>
                        )}
                        {feedbackError[chk.id] && (
                          <Banner tone="error">{feedbackError[chk.id]}</Banner>
                        )}
                        <textarea
                          rows={4}
                          value={feedbackValues[chk.id]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFeedbackValues((prev) => ({ ...prev, [chk.id]: val }));
                          }}
                          placeholder="Write your feedback here…"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          disabled={savingFeedback[chk.id]}
                          onClick={() => handleSaveFeedback(chk.id)}
                          className={`${actionButtonClass} self-start`}
                        >
                          {savingFeedback[chk.id] ? "Saving…" : "Save feedback"}
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <FieldLabel>
      {label}
      <input
        type="number"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      />
    </FieldLabel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e6eae8] bg-[#f6f8f7] p-3">
      <span className="text-[0.66rem] font-semibold uppercase tracking-wide text-[#9aa8a4]">
        {label}
      </span>
      <div className="mt-0.5 break-words text-lg font-extrabold text-[#1c2b29]">{value}</div>
    </div>
  );
}

function readAnswer(answers: unknown, key: string) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return "";
  const record = answers as Record<string, unknown>;
  const value = record[key] ?? record[`client_${key}`] ?? record.notes;
  return value === null || value === undefined ? "" : String(value);
}

function sleepLabel(score: unknown) {
  const map: Record<number, string> = { 1: "Poor", 2: "Light", 3: "OK", 4: "Deep" };
  const value = Number(score || 0);
  return map[value] || "—";
}

function formatDate(value: string) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dailyCompletionLabel(log: any) {
  const trackerValues = log.tracker_values && typeof log.tracker_values === "object" ? log.tracker_values : {};
  const customCount = Object.values(trackerValues).filter((value) => {
    if (value === null || value === undefined || value === false) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  }).length;
  const baseCount = [
    log.body_weight,
    log.steps,
    log.sleep_score,
    log.water_liters || log.water_3l,
    log.omega_3,
    log.wake_time,
    log.phone_off_time,
    log.one_win,
    log.one_struggle,
  ].filter(Boolean).length;
  return `${baseCount + customCount} filled`;
}

function ClientPhoto({ label, src }: { label: string; src?: string | null }) {
  if (!src) return null;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border border-[#e6eae8] bg-white no-underline">
      <img src={src} alt={`${label} body photo`} className="aspect-square w-full object-cover" />
      <div className="px-2 py-1 text-center text-xs font-bold text-[#6b7a77]">{label}</div>
    </a>
  );
}

function CustomValue({ label, value }: { label: string; value: unknown }) {
  const isImage = typeof value === "string" && /^https?:\/\//.test(value) && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value);
  return (
    <div className="rounded-lg bg-white p-2">
      <span className="block text-[0.66rem] font-bold uppercase tracking-wide text-[#9aa8a4]">
        {label.replace(/[_-]+/g, " ")}
      </span>
      {isImage ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="mt-1 block overflow-hidden rounded-lg">
          <img src={value} alt={label} className="h-24 w-full object-cover" />
        </a>
      ) : (
        <strong className="mt-0.5 block break-words text-sm text-[#1c2b29]">
          {value === true ? "Done" : value === false || value === null || value === undefined || value === "" ? "—" : String(value)}
        </strong>
      )}
    </div>
  );
}

function Note({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value?: string;
  tone?: "neutral" | "warn" | "good";
}) {
  if (!value) return null;
  const styles =
    tone === "warn"
      ? "border-[#f4c7bd] bg-[#fdeee9]"
      : tone === "good"
        ? "border-[#bfe6c9] bg-[#edf9f0]"
        : "border-[#e6eae8] bg-[#f6f8f7]";
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-sm ${styles}`}>
      <strong className="font-bold text-[#1c2b29]">{label}:</strong>{" "}
      <span className="whitespace-pre-wrap text-[#3a4744]">{value}</span>
    </div>
  );
}

function Banner({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const styles =
    tone === "success"
      ? "border-[#bfe6c9] bg-[#edf9f0] text-[#1d7a3a]"
      : "border-[#f4c7bd] bg-[#fdeee9] text-[#c0432b]";
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${styles}`}>{children}</div>
  );
}
