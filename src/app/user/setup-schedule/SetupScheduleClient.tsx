"use client";

import { useState } from 'react';

interface SetupScheduleClientProps {
  userId: string;
  programType: string;
  initialSchedule: any[];
}

export default function SetupScheduleClient({
  userId,
  programType,
  initialSchedule,
}: SetupScheduleClientProps) {
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Define splits per program
  const splitsMap: Record<string, string[]> = {
    skinnyfat_recomp: ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
    project_20: ['Push', 'Pull', 'Legs', 'Full Body', 'Cardio'],
    mass_method: ['Chest & Triceps', 'Back & Biceps', 'Shoulders & Arms', 'Legs'],
  };

  const programNameMap: Record<string, string> = {
    skinnyfat_recomp: 'Skinnyfat Recomp',
    project_20: 'Project-20',
    mass_method: 'Mass Method',
  };

  const splits = splitsMap[programType] || splitsMap.skinnyfat_recomp;
  const programName = programNameMap[programType] || 'Skinnyfat Recomp';

  const daysOfWeek = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
  ];

  // Set default schedule values
  const getInitialDaySplit = (dayVal: number) => {
    const existing = initialSchedule.find((s) => s.day_of_week === dayVal);
    if (existing) {
      return existing.is_rest ? 'Rest' : existing.split_name;
    }
    // standard default splits mapping for speed
    if (programType === 'skinnyfat_recomp') {
      if (dayVal === 1) return 'Upper A';
      if (dayVal === 2) return 'Lower A';
      if (dayVal === 4) return 'Upper B';
      if (dayVal === 5) return 'Lower B';
      return 'Rest';
    } else if (programType === 'project_20') {
      if (dayVal === 1) return 'Push';
      if (dayVal === 2) return 'Pull';
      if (dayVal === 3) return 'Legs';
      if (dayVal === 5) return 'Full Body';
      if (dayVal === 6) return 'Cardio';
      return 'Rest';
    } else {
      // mass_method
      if (dayVal === 1) return 'Chest & Triceps';
      if (dayVal === 2) return 'Back & Biceps';
      if (dayVal === 4) return 'Shoulders & Arms';
      if (dayVal === 5) return 'Legs';
      return 'Rest';
    }
  };

  // State for schedule per day value (0-6) -> split name or 'Rest'
  const [weeklySplits, setWeeklySplits] = useState<Record<number, string>>({
    0: getInitialDaySplit(0),
    1: getInitialDaySplit(1),
    2: getInitialDaySplit(2),
    3: getInitialDaySplit(3),
    4: getInitialDaySplit(4),
    5: getInitialDaySplit(5),
    6: getInitialDaySplit(6),
  });

  const handleSplitChange = (dayVal: number, splitName: string) => {
    setWeeklySplits((prev) => ({ ...prev, [dayVal]: splitName }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');

    const scheduleData = daysOfWeek.map((d) => {
      const splitName = weeklySplits[d.value];
      const isRest = splitName === 'Rest';
      return { dayOfWeek: d.value, splitName: isRest ? null : splitName, isRest };
    });

    try {
      const res = await fetch('/api/user/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, schedule: scheduleData }),
      });

      if (res.ok) {
        window.location.href = '/user/dashboard';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'အချက်အလက် သိမ်းဆည်းရန် ပျက်ကွက်ခဲ့သည်။');
      }
    } catch {
      setErrorMsg('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-[linear-gradient(135deg,#1c2b29_0%,#2a3f3c_50%,#1c2b29_100%)] p-8">

      {/* Top logo */}
      <div className="mb-8 flex items-center gap-2">
        <i className="ph ph-barbell text-[2rem] text-[var(--accent-color)]"></i>
        <h1 className="text-[1.8rem] font-black text-white">Project Peak <span className="text-[var(--accent-color)]">空</span></h1>
      </div>

      <div className="w-full max-w-[520px] rounded-[24px] border border-[var(--glass-border)] bg-white p-10 shadow-[var(--soft-shadow)]">

        {/* Step Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-0.5 w-[30px] bg-[#d97706]"></span>
          <span className="text-[0.8rem] font-extrabold uppercase tracking-wider text-[#d97706]">SCHEDULE · 02</span>
        </div>

        <h2 className="mb-2 text-left text-[2.2rem] font-extrabold text-[var(--text-main)]">Plan your week</h2>
        <p className="mb-6 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
          Your Assigned Program: <strong className="text-[var(--accent-color)]">{programName}</strong>
        </p>

        {/* Splits Badges List */}
        <div className="mb-[1.8rem]">
          <label className="mb-2.5 block text-[0.82rem] font-bold uppercase tracking-[0.5px] text-[var(--text-muted)]">
            Available Splits
          </label>
          <div className="flex flex-wrap gap-2">
            {splits.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[0.85rem] font-bold text-[#475569]">
                <i className="ph ph-activity text-[var(--accent-color)]"></i> {s}
              </span>
            ))}
            <span className="rounded-full bg-[#fef3c7] px-3 py-1.5 text-[0.85rem] font-bold text-[#b45309]">
              Rest
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-lg bg-[#fee2e2] p-3 text-[0.9rem] font-semibold text-[#b91c1c]">
            {errorMsg}
          </div>
        )}

        {/* Daily Schedule Assignment */}
        <div className="mb-10 flex flex-col gap-3">
          {daysOfWeek.map((day) => {
            const currentSplit = weeklySplits[day.value];
            const isRest = currentSplit === 'Rest';
            return (
              <div
                key={day.value}
                className="flex items-center justify-between rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] px-5 py-[0.8rem]"
              >
                <span className={`text-[0.95rem] font-extrabold ${isRest ? 'text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                  {day.label}
                </span>

                <select
                  value={currentSplit}
                  onChange={(e) => handleSplitChange(day.value, e.target.value)}
                  className={`cursor-pointer rounded-xl border border-[#cbd5e1] px-4 py-[0.45rem] text-[0.88rem] font-extrabold outline-none ${
                    isRest ? 'bg-[#fffbeb] text-[#b45309]' : 'bg-[#e0f2fe] text-[#0369a1]'
                  }`}
                >
                  <option value="Rest">Rest</option>
                  {splits.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center rounded-full border-none bg-[#0f172a] p-4 text-[1.1rem] font-bold text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] transition-all hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'Lock my week'}
        </button>

      </div>
    </div>
  );
}
