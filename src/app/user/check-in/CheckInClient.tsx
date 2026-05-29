"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/BottomNav';

interface CheckInClientProps {
  targetUserId: string;
  isAdminViewing: boolean;
  clientQuery: string;
  currentWeek: number;
  existingCheckin: any;
  calcAvgWeight: string;
}

export default function CheckInClient({
  targetUserId,
  isAdminViewing,
  clientQuery,
  currentWeek,
  existingCheckin,
  calcAvgWeight,
}: CheckInClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [avgWeight, setAvgWeight] = useState(existingCheckin?.avg_weight || calcAvgWeight || '');
  const [energyWorkout, setEnergyWorkout] = useState(existingCheckin?.energy_workout || 5);
  const [energyWorkoutNotes, setEnergyWorkoutNotes] = useState(existingCheckin?.energy_workout_notes || '');

  const [energyDaily, setEnergyDaily] = useState(existingCheckin?.energy_daily || 5);
  const [energyDailyNotes, setEnergyDailyNotes] = useState(existingCheckin?.energy_daily_notes || '');

  const [motivation, setMotivation] = useState(existingCheckin?.motivation || 5);
  const [motivationNotes, setMotivationNotes] = useState(existingCheckin?.motivation_notes || '');

  const [struggleNotes, setStruggleNotes] = useState(existingCheckin?.struggle_notes || '');
  const [improvementNotes, setImprovementNotes] = useState(existingCheckin?.improvement_notes || '');
  const [upcomingDisruptions, setUpcomingDisruptions] = useState(existingCheckin?.upcoming_disruptions || '');
  const [changesWanted, setChangesWanted] = useState(existingCheckin?.changes_wanted || '');

  const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(
    existingCheckin?.progress_photo_url ? `/${existingCheckin.progress_photo_url}` : ''
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProgressPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(existingCheckin?.progress_photo_url ? `/${existingCheckin.progress_photo_url}` : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('week_number', currentWeek.toString());
      formData.append('avg_weight', avgWeight);
      formData.append('energy_workout', energyWorkout.toString());
      formData.append('energy_workout_notes', energyWorkoutNotes);
      formData.append('energy_daily', energyDaily.toString());
      formData.append('energy_daily_notes', energyDailyNotes);
      formData.append('motivation', motivation.toString());
      formData.append('motivation_notes', motivationNotes);
      formData.append('struggle_notes', struggleNotes);
      formData.append('improvement_notes', improvementNotes);
      formData.append('upcoming_disruptions', upcomingDisruptions);
      formData.append('changes_wanted', changesWanted);

      if (progressPhoto) formData.append('progress_photo', progressPhoto);
      if (isAdminViewing) formData.append('client_id', targetUserId.toString());

      const res = await fetch('/api/user/save-checkin', { method: 'POST', body: formData });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('အောင်မြင်စွာ Report တင်ပြီးပါပြီ! (Check-in saved successfully!)');
        if (data.progress_photo_url) setPhotoPreview(`/${data.progress_photo_url}`);
        router.refresh();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(data.error || 'အချက်အလက်များ သိမ်းဆည်းရာတွင် အမှားရှိနေပါသည်။');
      }
    } catch {
      setErrorMsg('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full resize-y rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-[0.8rem] text-[#0f172a] outline-none focus:border-[var(--accent-color)]';

  const ratings = [
    { label: 'လေ့ကျင့်ခန်းလုပ်စဉ် Energy အခြေအနေ (Energy level during workout)', value: energyWorkout, set: setEnergyWorkout, notes: energyWorkoutNotes, setNotes: setEnergyWorkoutNotes, placeholder: 'လေ့ကျင့်ခန်းစွမ်းဆောင်ရည်နှင့်ပတ်သက်ပြီး မှတ်စုတိုရေးရန်...' },
    { label: 'တစ်နေ့တာ Energy အခြေအနေ (Daily life energy level)', value: energyDaily, set: setEnergyDaily, notes: energyDailyNotes, setNotes: setEnergyDailyNotes, placeholder: 'အလုပ် သို့မဟုတ် နေ့စဉ်လူနေမှုဘဝအတွင်း နုံးခွေမှု/လန်းဆန်းမှု မှတ်စုများ...' },
    { label: 'Motivation Level (စိတ်အားထက်သန်မှု)', value: motivation, set: setMotivation, notes: motivationNotes, setNotes: setMotivationNotes, placeholder: 'ယခုတစ်ပတ် စိတ်ပိုင်းဆိုင်ရာ ဖြတ်သန်းမှုအတွေ့အကြုံ...' },
  ];

  const longFields = [
    { label: 'ဘယ်နေရာမှာ အဓိက အခက်အခဲနဲ့ လိုအပ်ချက်ရှိတယ်လို့ ထင်သလဲ? (Struggles)', hint: '(ဥပမာ - ဗိုက်အရမ်းဆာ၊ စိတ်မပါ၊ သေချာအလေးမနိုင်၊ သေချာမအိပ်ဖြစ်)', value: struggleNotes, set: setStruggleNotes, placeholder: 'သင့်အခက်အခဲများကို ပွင့်ပွင့်လင်းလင်း ရေးသားပေးပါ...' },
    { label: 'ဒီအပတ်မှာ ဘာတွေ တိုးတက်တယ်၊ အနိုင်ရတယ်လို့ ခံစားရလဲ? (Improvements/Wins)', hint: '(ဥပမာ - အကျင့်တွေ ပိုရလာတာ၊ နေလို့ကောင်းတာ၊ Meal Plan မပျက် စားဖြစ်တာ၊ အလေးပိုနိုင်လာတာ)', value: improvementNotes, set: setImprovementNotes, placeholder: 'တိုးတက်လာသည့်အချက်များကို ဖော်ပြပေးပါ...' },
    { label: 'လာမယ့်အပတ်မှာ Workout နဲ့ Diet ကို ထိခိုက်စေနိုင်မယ့် ကိစ္စတွေ ရှိလား? (Upcoming Disruptions)', hint: '(ဥပမာ - ခရီး၊ ပွဲ၊ စာမေးပွဲ)', value: upcomingDisruptions, set: setUpcomingDisruptions, placeholder: 'ကြိုတင်ပြင်ဆင်နိုင်ရန်အတွက် ဖော်ပြပေးပါ...' },
    { label: 'အစားအစာနဲ့ Exercise တွေ ပြောင်းချင်တာ၊ ထပ်ထည့်ချင်တာမျိုး ရှိလား? (Changes Wanted)', hint: 'Any changes you want to make to food/exercise?', value: changesWanted, set: setChangesWanted, placeholder: 'ဥပမာ - ကြက်ရင်ပုံအစား ငါးပြောင်းစားချင်တာ၊ ရင်ဘတ်ကစားနည်း ပြောင်းချင်တာ...' },
  ];

  const cardClass = 'rounded-xl border border-[var(--glass-border)] bg-white p-6 shadow-[var(--soft-shadow)]';

  return (
    <div className="min-h-screen bg-[#f8f8f5] pb-28 text-[#1c2b29]">
      <div className="mx-auto max-w-[680px] p-6">
        {isAdminViewing && (
          <div className="mb-8 rounded-[15px] border border-[#ef4444] bg-[#fee2e2] p-4 text-[0.9rem] font-semibold text-[#b91c1c]">
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> You are managing this client&apos;s check-in.
          </div>
        )}

        <h2 className="mb-4 flex items-center gap-2 text-[1.3rem] font-extrabold text-[#1c2b29]">
          <i className="ph ph-clipboard-text text-[#a855f7]"></i> Weekly Check-in (Week {currentWeek})
        </h2>

        {successMsg && (
          <div className="mb-6 rounded-[15px] border border-[#10b981] bg-[#ecfdf5] p-4 text-[0.9rem] font-semibold text-[#065f46]">
            <i className="ph ph-check-circle"></i> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 mt-4 rounded-[10px] border border-[#ef4444] bg-[rgba(239,68,68,0.2)] p-4 text-[#f87171]">
            <i className="ph ph-warning-circle"></i> {errorMsg}
          </div>
        )}

        {/* Existing Feedback */}
        {existingCheckin && existingCheckin.admin_feedback && (
          <div className="mb-8 mt-6 rounded-[0_10px_10px_0] border-l-4 border-[var(--accent-color)] bg-white/60 p-6 shadow-[var(--soft-shadow)]">
            <h3 className="m-0 flex items-center gap-2 text-[1.1rem] text-[var(--accent-color)]">
              <i className="ph ph-chat-circle-text"></i> Trainer မှ Feedback ပြန်ထားသည် (Trainer Feedback)
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-[0.95rem] text-[var(--text-main)]">
              {existingCheckin.admin_feedback}
            </p>
          </div>
        )}

        {/* Week Selector */}
        <div className="my-6 flex gap-2 overflow-x-auto pb-4">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
            const active = w === currentWeek;
            return (
              <Link
                key={w}
                href={`/user/check-in?w=${w}${isAdminViewing ? `&client_id=${targetUserId}` : ''}`}
                className={`whitespace-nowrap rounded-lg border border-[var(--glass-border)] px-4 py-2 font-semibold no-underline shadow-[var(--soft-shadow)] ${
                  active ? 'bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] text-white' : 'bg-white/50 text-[var(--text-main)]'
                }`}
              >
                Week {w}
              </Link>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-6">
          {/* Avg Weight */}
          <div className={cardClass}>
            <label className="mb-2 block text-base font-bold text-[var(--text-main)]">
              ယခုအပတ် ပျမ်းမျှကိုယ်အလေးချိန် (Avg Weight for the week)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" step="0.1" value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)}
                className="w-[150px] rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-[0.8rem] text-[#0f172a] outline-none focus:border-[var(--accent-color)]"
                placeholder="eg. 72.5" required
              />
              <span className="font-semibold text-[var(--text-muted)]">kg</span>
            </div>
            {calcAvgWeight && !existingCheckin?.avg_weight && (
              <p className="mt-2 text-[0.85rem] text-[var(--text-muted)]">
                <i className="ph ph-info"></i> Daily Tracker များအရ ယခုအပတ် ပျမ်းမျှကိုယ်အလေးချိန်မှာ <strong>{calcAvgWeight} kg</strong> ဖြစ်ပါသည်။
              </p>
            )}
          </div>

          {/* Reflection Ratings */}
          <div className={`${cardClass} flex flex-col gap-6`}>
            <h3 className="border-b border-[#f1f5f9] pb-2 text-[1.2rem] font-bold text-[var(--text-main)]">
              Reflection (1-10 Ratings)
            </h3>
            {ratings.map((r, i) => (
              <div key={i}>
                <label className="mb-2 block font-semibold">{r.label}</label>
                <div className="mb-2 flex items-center gap-4">
                  <input type="range" min="1" max="10" value={r.value} onChange={(e) => r.set(parseInt(e.target.value, 10))} className="flex-1 cursor-pointer accent-[var(--accent-color)]" />
                  <span className="w-[30px] text-center text-[1.2rem] font-bold text-[var(--accent-color)]">{r.value}</span>
                </div>
                <textarea value={r.notes} onChange={(e) => r.setNotes(e.target.value)} className={fieldClass} placeholder={r.placeholder} rows={2} />
              </div>
            ))}
          </div>

          {/* Struggles & Wins */}
          <div className={`${cardClass} flex flex-col gap-6`}>
            {longFields.map((f, i) => (
              <div key={i}>
                <label className="mb-1 block text-base font-bold text-[var(--text-main)]">{f.label}</label>
                <span className="mb-3 block text-[0.8rem] text-[var(--text-muted)]">{f.hint}</span>
                <textarea rows={3} value={f.value} onChange={(e) => f.set(e.target.value)} className={fieldClass} placeholder={f.placeholder} />
              </div>
            ))}
          </div>

          {/* Progress Photo Upload */}
          <div className={cardClass}>
            <label className="mb-1 block text-base font-bold text-[var(--text-main)]">
              ယခုအပတ် ကိုယ်ခန္ဓာ တိုးတက်မှု ဓာတ်ပုံ (Weekly Progress Photo)
            </label>
            <span className="mb-4 block text-[0.8rem] text-[var(--text-muted)]">
              ကိုယ်ခန္ဓာတိုးတက်မှုကို ပိုမိုတိကျစွာ သုံးသပ်နိုင်ရန် ဓာတ်ပုံ တင်ပေးရန် လိုအပ်ပါသည်။
            </span>
            <div className="flex flex-col items-start gap-4">
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-[0.9rem] text-[var(--text-muted)]" />
              {photoPreview && (
                <div className="relative max-w-[300px] overflow-hidden rounded-xl border border-[var(--glass-border)] shadow-[var(--soft-shadow)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Progress Preview" className="block h-auto w-full" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 text-center text-[0.8rem] text-white">
                    Preview
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] p-4 text-[1.1rem] font-bold text-white shadow-[var(--soft-shadow)] disabled:opacity-60"
          >
            {saving ? (
              <>
                <i className="ph ph-spinner-gap animate-spin"></i> Report တင်နေပါသည်...
              </>
            ) : (
              <>
                <i className="ph ph-paper-plane"></i> Report တင်မည် (Submit Check-in)
              </>
            )}
          </button>
        </form>
      </div>

      <BottomNav clientQuery={clientQuery} />
    </div>
  );
}
