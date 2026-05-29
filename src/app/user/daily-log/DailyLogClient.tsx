"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';

interface DailyLogClientProps {
  targetUserId: string;
  isAdminViewing: boolean;
  clientQuery: string;
  weekOffset: number;
  days: { name: string; date: string }[];
  trackerMap: Record<string, any>;
  journalMap: Record<string, any>;
  today: string;
  todayTracker: any;
  todayJournal: any;
}

export default function DailyLogClient({
  targetUserId,
  isAdminViewing,
  clientQuery,
  weekOffset,
  days,
  trackerMap,
  journalMap,
  today,
  todayTracker,
  todayJournal,
}: DailyLogClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [bodyWeight, setBodyWeight] = useState(todayTracker.body_weight || '');
  const [steps, setSteps] = useState(todayTracker.steps || '');
  const [sleepScore, setSleepScore] = useState(todayTracker.sleep_score || '');

  const [water3l, setWater3l] = useState(!!todayTracker.water_3l);
  const [omega3, setOmega3] = useState(!!todayTracker.omega_3);
  const [bedPhoneFilter, setBedPhoneFilter] = useState(!!todayTracker.bed_phone_filter);
  const [mealPlanAdhered, setMealPlanAdhered] = useState(!!todayTracker.meal_plan_adhered);
  const [toilet, setToilet] = useState(!!todayTracker.toilet);

  const [dietStatus, setDietStatus] = useState(todayJournal.diet_status || '');
  const [satisfiedWith, setSatisfiedWith] = useState(todayJournal.satisfied_with || '');
  const [difficultWith, setDifficultWith] = useState(todayJournal.difficult_with || '');

  const calcAvg = (key: string) => {
    let sum = 0;
    let count = 0;
    days.forEach((day) => {
      const val = trackerMap[day.date]?.[key];
      if (val !== undefined && val !== null && val !== '') {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    });
    return count > 0 ? (sum / count).toFixed(1) : '-';
  };

  const calcCheckedAvg = (key: string) => {
    let checkedCount = 0;
    days.forEach((day) => {
      if (trackerMap[day.date]?.[key]) checkedCount++;
    });
    return Math.round((checkedCount / 7) * 100) + '%';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/save-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          date: today,
          bodyWeight: bodyWeight !== '' ? parseFloat(bodyWeight) : null,
          steps: steps !== '' ? parseInt(steps, 10) : null,
          sleepScore: sleepScore !== '' ? parseFloat(sleepScore) : null,
          water3l: water3l ? 1 : 0,
          omega3: omega3 ? 1 : 0,
          bedPhoneFilter: bedPhoneFilter ? 1 : 0,
          mealPlanAdhered: mealPlanAdhered ? 1 : 0,
          toilet: toilet ? 1 : 0,
          dietStatus: dietStatus || null,
          satisfiedWith: satisfiedWith || null,
          difficultWith: difficultWith || null,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'မှတ်တမ်းသိမ်းဆည်းရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
      }
    } catch {
      alert('ကွန်ရက် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
    } finally {
      setSaving(false);
    }
  };

  const metricRows = [
    { label: 'Body Weight (kg)', key: 'body_weight' },
    { label: 'Steps', key: 'steps' },
    { label: 'Sleep Score (Hrs)', key: 'sleep_score' },
  ];
  const habitRows = [
    { label: '3L Water', key: 'water_3l' },
    { label: 'Omega 3', key: 'omega_3' },
    { label: 'Bed Phone Filter', key: 'bed_phone_filter' },
    { label: 'Meal Plan', key: 'meal_plan_adhered' },
    { label: 'Toilet', key: 'toilet' },
  ];

  const inputClass =
    'w-full rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-[0.8rem] text-[#0f172a] outline-none focus:border-[#0ea5e9]';
  const habits = [
    { label: '3L Water', checked: water3l, set: setWater3l },
    { label: 'Omega 3', checked: omega3, set: setOmega3 },
    { label: 'Bed Phone Filter', checked: bedPhoneFilter, set: setBedPhoneFilter },
    { label: 'Meal Plan', checked: mealPlanAdhered, set: setMealPlanAdhered },
    { label: 'Toilet', checked: toilet, set: setToilet },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f5] pb-28 text-[#1c2b29]">
      <div className="mx-auto max-w-[680px] p-6">
        <h2 className="flex items-center gap-2 text-[1.6rem] font-bold text-[#0f172a]">
          <i className="ph ph-calendar-check text-[#0ea5e9]"></i> 12 Weeks Tracker
        </h2>

        {/* Week Navigation */}
        <div className="my-6 flex gap-2 overflow-x-auto pb-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
            const active = w === weekOffset;
            return (
              <Link
                key={w}
                href={`/user/daily-log?w=${w}${isAdminViewing ? `&client_id=${targetUserId}` : ''}`}
                className={`whitespace-nowrap rounded-lg border border-[var(--glass-border)] px-4 py-2 font-semibold no-underline shadow-[var(--soft-shadow)] ${
                  active ? 'bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] text-white' : 'bg-white/50 text-[var(--text-main)]'
                }`}
              >
                Week {w}
              </Link>
            );
          })}
        </div>

        {/* Weekly Metrics Table */}
        <div className="mb-10 overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-white p-6 shadow-[var(--soft-shadow)]">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="p-4 text-left text-[#475569]">Metrics / Habits</th>
                {days.map((day) => (
                  <th key={day.date} className={`p-4 ${day.date === today ? 'text-[#0ea5e9]' : 'text-[#475569]'}`}>
                    {day.name}<br />
                    <small className="text-xs opacity-80">{day.date.substring(5)}</small>
                  </th>
                ))}
                <th className="p-4 font-bold text-[#475569]">Weekly Avg</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr key={row.key} className="border-b border-[#f1f5f9]">
                  <td className="p-4 text-left font-semibold">{row.label}</td>
                  {days.map((day) => {
                    const v = trackerMap[day.date]?.[row.key];
                    return <td key={day.date} className="p-4">{v !== undefined && v !== null ? v : '-'}</td>;
                  })}
                  <td className="p-4 font-bold">{calcAvg(row.key)}</td>
                </tr>
              ))}
              {habitRows.map((row) => (
                <tr key={row.key} className="border-b border-[#f1f5f9]">
                  <td className="p-4 text-left font-semibold">{row.label}</td>
                  {days.map((day) => (
                    <td key={day.date} className="p-4">
                      {trackerMap[day.date]?.[row.key] ? <i className="ph-bold ph-check text-[1.2rem] text-[#22c55e]"></i> : '-'}
                    </td>
                  ))}
                  <td className="p-4 font-bold">{calcCheckedAvg(row.key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Daily Entry Form */}
        <div className="mb-12 rounded-2xl border border-[var(--glass-border)] bg-white p-8 shadow-[var(--soft-shadow)]">
          <h3 className="mb-6 text-[1.3rem] font-bold text-[#0f172a]">ယနေ့မှတ်တမ်း (Today&apos;s Entry - {today})</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <div>
                <label className="mb-2 block font-semibold">Body Weight (kg)</label>
                <input type="number" step="0.1" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block font-semibold">Steps</label>
                <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-2 block font-semibold">Sleep Time (Hrs)</label>
                <input type="number" step="0.5" value={sleepScore} onChange={(e) => setSleepScore(e.target.value)} className={inputClass} />
              </div>
            </div>

            <h4 className="mb-4 text-[1.1rem] font-bold text-[#0f172a]">Habits</h4>
            <div className="mb-6 flex flex-wrap gap-6">
              {habits.map((h) => (
                <label key={h.label} className="flex cursor-pointer items-center gap-2 font-semibold">
                  <input type="checkbox" checked={h.checked} onChange={(e) => h.set(e.target.checked)} className="h-[18px] w-[18px] accent-[#0ea5e9]" />
                  {h.label}
                </label>
              ))}
            </div>

            <h4 className="mb-4 flex items-center gap-2 text-[1.1rem] font-bold text-[#0f172a]">
              <i className="ph ph-book-open text-[#0ea5e9]"></i> Journaling
            </h4>
            <div className="mb-4">
              <label className="mb-2 block font-semibold">Diet Status (Over / Under / Ok)</label>
              <select value={dietStatus} onChange={(e) => setDietStatus(e.target.value)} className={inputClass}>
                <option value="">ရွေးချယ်ပါ (Select)</option>
                <option value="over">Over</option>
                <option value="under">Under</option>
                <option value="ok">Ok</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block font-semibold">ဒီနေ့အတွက် ကျေနပ်ခဲ့ရတဲ့ အရာတစ်ခုက ဘာလဲ? (Satisfied with)</label>
              <textarea rows={2} value={satisfiedWith} onChange={(e) => setSatisfiedWith(e.target.value)} className={inputClass}></textarea>
            </div>
            <div className="mb-6">
              <label className="mb-2 block font-semibold">ဒီနေ့အတွက် ခက်ခဲခဲ့တဲ့ အရာတစ်ခုက ဘာလဲ? (Difficult with)</label>
              <textarea rows={2} value={difficultWith} onChange={(e) => setDifficultWith(e.target.value)} className={inputClass}></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] px-8 py-[0.8rem] font-bold text-white disabled:opacity-60"
            >
              {saving ? 'မှတ်တမ်းတင်နေပါသည်...' : 'မှတ်တမ်းတင်မည် (Save)'}
            </button>
          </form>
        </div>

        {/* Weekly Journal list */}
        <div>
          <h3 className="text-[1.3rem] font-bold text-[#0f172a]">ယခင်မှတ်တမ်းများ (Week&apos;s Journals)</h3>
          <div className="mt-6 flex flex-col gap-4">
            {days
              .filter((day) => {
                const j = journalMap[day.date];
                return j && (j.satisfied_with || j.difficult_with || j.diet_status);
              })
              .map((day) => {
                const j = journalMap[day.date];
                return (
                  <div key={day.date} className="rounded-xl border border-[var(--glass-border)] bg-white/70 p-6 shadow-[var(--soft-shadow)] backdrop-blur-md">
                    <h4 className="mb-2 font-bold text-[var(--accent-color)]">
                      {day.name} ({day.date}) - Diet: <span className="capitalize text-[var(--text-main)]">{j.diet_status || 'N/A'}</span>
                    </h4>
                    {j.satisfied_with && <p className="my-1 text-[var(--text-main)]"><strong>Satisfied:</strong> {j.satisfied_with}</p>}
                    {j.difficult_with && <p className="my-1 text-[var(--text-main)]"><strong>Difficult:</strong> {j.difficult_with}</p>}
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      <BottomNav active="progress" clientQuery={clientQuery} />
    </div>
  );
}
