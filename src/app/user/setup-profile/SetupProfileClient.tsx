"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupProfileClientProps {
  userId: string;
  username: string;
  initialProfile: any;
}

export default function SetupProfileClient({
  userId,
  initialProfile,
}: SetupProfileClientProps) {
  const router = useRouter();
  const [weight, setWeight] = useState(initialProfile?.starting_weight ? Math.round(initialProfile.starting_weight).toString() : '');
  const [height, setHeight] = useState(initialProfile?.height_cm ? Math.round(initialProfile.height_cm).toString() : '');
  const [age, setAge] = useState(initialProfile?.age ? initialProfile.age.toString() : '');
  const [bodyFat, setBodyFat] = useState<number>(initialProfile?.body_fat_percent || 20);
  const [desiredBodyText, setDesiredBodyText] = useState(initialProfile?.desired_body_text || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bodyFatOptions = [15, 20, 25, 30];

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !age) {
      setErrorMsg('Weight, Height နှင့် Age တို့ကို ဖြည့်စွက်ပေးပါ');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weight, height, age, bodyFat, desiredBodyText }),
      });

      if (res.ok) {
        router.push('/user/setup-schedule');
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

  const numInput =
    'w-full rounded-[10px] border border-[#cbd5e1] bg-[#f8fafc] p-[0.8rem] text-center font-bold text-[var(--text-main)] outline-none focus:border-[#0ea5e9]';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-[linear-gradient(135deg,#1c2b29_0%,#2a3f3c_50%,#1c2b29_100%)] p-8">

      {/* Top logo */}
      <div className="mb-8 flex items-center gap-2">
        <i className="ph ph-barbell text-[2rem] text-[var(--accent-color)]"></i>
        <h1 className="text-[1.8rem] font-black text-white">Project Peak <span className="text-[var(--accent-color)]">空</span></h1>
      </div>

      <div className="w-full max-w-[480px] rounded-[24px] border border-[var(--glass-border)] bg-white p-10 shadow-[var(--soft-shadow)]">

        {/* Step Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-0.5 w-[30px] bg-[#d97706]"></span>
          <span className="text-[0.8rem] font-extrabold uppercase tracking-wider text-[#d97706]">BASELINE · 01</span>
        </div>

        <h2 className="mb-2 text-left text-[2.2rem] font-extrabold text-[var(--text-main)]">Your starting point</h2>
        <p className="mb-8 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">Enter once. We measure every win against today.</p>

        {errorMsg && (
          <div className="mb-6 rounded-lg bg-[#fee2e2] p-3 text-[0.9rem] font-semibold text-[#b91c1c]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleContinue}>

          {/* Inputs Row */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-[0.88rem] font-bold text-[var(--text-main)]">Weight</label>
              <div className="relative">
                <input type="number" placeholder="85" value={weight} onChange={(e) => setWeight(e.target.value)} className={`${numInput} pr-8`} required min="30" max="300" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.8rem] font-semibold text-[var(--text-muted)]">kg</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.88rem] font-bold text-[var(--text-main)]">Height</label>
              <div className="relative">
                <input type="number" placeholder="174" value={height} onChange={(e) => setHeight(e.target.value)} className={`${numInput} pr-9`} required min="100" max="250" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.8rem] font-semibold text-[var(--text-muted)]">cm</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.88rem] font-bold text-[var(--text-main)]">Age</label>
              <input type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} className={numInput} required min="12" max="100" />
            </div>
          </div>

          {/* Body Fat Selection */}
          <div className="mb-8">
            <label className="mb-3 block text-[0.95rem] font-bold text-[var(--text-main)]">
              Body fat — pick what looks like you
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bodyFatOptions.map((val) => {
                const isSelected = bodyFat === val;
                return (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setBodyFat(val)}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl px-2 py-4 transition-all ${
                      isSelected ? 'border-2 border-[#0ea5e9] bg-[#f0f9ff]' : 'border border-[#cbd5e1] bg-[#f8fafc]'
                    }`}
                  >
                    <i className={`ph ph-user text-[1.2rem] ${isSelected ? 'text-[#0ea5e9]' : 'text-[var(--text-muted)]'}`}></i>
                    <span className={`text-[0.95rem] font-bold ${isSelected ? 'text-[#0f172a]' : 'text-[var(--text-muted)]'}`}>{val}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desired Body Type / Goals */}
          <div className="mb-10">
            <label className="mb-2 block text-[0.95rem] font-bold text-[var(--text-main)]">
              ဖြစ်ချင်တဲ့ Body ပုံစံ / Fitness Goals (Desired Body Style)
            </label>
            <textarea
              placeholder="ဥပမာ- ဗိုက်ခေါက်ထွက်ချင်တယ်၊ ပခုံးနဲ့ ရင်အုပ်ပိုကြီးချင်တယ်..."
              rows={3}
              value={desiredBodyText}
              onChange={(e) => setDesiredBodyText(e.target.value)}
              className="w-full resize-y rounded-[10px] border border-[#cbd5e1] bg-[#f8fafc] px-4 py-[0.8rem] text-[0.9rem] text-[var(--text-main)] outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center rounded-full border-none bg-[#0f172a] p-4 text-[1.1rem] font-bold text-white shadow-[0_4px_12px_rgba(15,23,42,0.15)] transition-all hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'Continue'}
          </button>

        </form>
      </div>
    </div>
  );
}
