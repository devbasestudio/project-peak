"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  // Form states
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

  // Progress photo upload states
  const [progressPhoto, setProgressPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(
    existingCheckin?.progress_photo_url ? `/${existingCheckin.progress_photo_url}` : ''
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProgressPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
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
      
      if (progressPhoto) {
        formData.append('progress_photo', progressPhoto);
      }
      
      if (isAdminViewing) {
        formData.append('client_id', targetUserId.toString());
      }

      const res = await fetch('/api/user/save-checkin', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('အောင်မြင်စွာ Report တင်ပြီးပါပြီ! (Check-in saved successfully!)');
        if (data.progress_photo_url) {
          setPhotoPreview(`/${data.progress_photo_url}`);
        }
        router.refresh();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg(data.error || 'အချက်အလက်များ သိမ်းဆည်းရာတွင် အမှားရှိနေပါသည်။');
      }
    } catch (err) {
      setErrorMsg('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <nav className="navbar" style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="nav-brand">
          <i className="ph ph-barbell kanji"></i>
          <span>Project Peak <span className="kanji">空</span></span>
        </div>
        <div className="nav-links">
          {isAdminViewing && (
            <Link href={`/admin/client-view?id=${targetUserId}`} style={{ color: '#ef4444' }}>
              <i className="ph ph-arrow-left"></i> Back to Admin View
            </Link>
          )}
          <Link href={`/user/dashboard${clientQuery}`}>
            <i className="ph ph-squares-four"></i> Dashboard
          </Link>
          <Link href={`/user/check-in${clientQuery}`} className="active">
            <i className="ph ph-clipboard-text"></i> Weekly Check-in
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <i className="ph ph-sign-out"></i> Logout
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
        {isAdminViewing && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '10px', marginBottom: '2rem' }}>
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> You are currently managing this client&apos;s dashboard. Any changes you make here will affect their account.
          </div>
        )}

        <h2><i className="ph ph-clipboard-text"></i> Weekly Check-in (Week {currentWeek})</h2>

        {successMsg && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', padding: '1rem', borderRadius: '10px', marginTop: '1rem', marginBottom: '1.5rem', color: '#4ade80' }}>
            <i className="ph ph-check-circle"></i> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '10px', marginTop: '1rem', marginBottom: '1.5rem', color: '#f87171' }}>
            <i className="ph ph-warning-circle"></i> {errorMsg}
          </div>
        )}

        {/* Existing Feedback */}
        {existingCheckin && existingCheckin.admin_feedback && (
          <div style={{ background: 'rgba(255, 255, 255, 0.6)', borderLeft: '4px solid var(--accent-color)', padding: '1.5rem', marginTop: '1.5rem', marginBottom: '2rem', borderRadius: '0 10px 10px 0', boxShadow: 'var(--soft-shadow)' }}>
            <h3 style={{ color: 'var(--accent-color)', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-chat-circle-text"></i> Trainer မှ Feedback ပြန်ထားသည် (Trainer Feedback)
            </h3>
            <p style={{ marginTop: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {existingCheckin.admin_feedback}
            </p>
          </div>
        )}

        {/* Week Selector */}
        <div className="week-nav" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
            <Link
              key={w}
              href={`/user/check-in?w=${w}${isAdminViewing ? `&client_id=${targetUserId}` : ''}`}
              className={`week-btn ${w === currentWeek ? 'active' : ''}`}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: w === currentWeek ? 'var(--btn-primary)' : 'rgba(255, 255, 255, 0.5)',
                color: w === currentWeek ? '#fff' : 'var(--text-main)',
                textDecoration: 'none',
                border: '1px solid var(--glass-border)',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                boxShadow: 'var(--soft-shadow)'
              }}
            >
              Week {w}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--soft-shadow)' }}>
            <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
              ယခုအပတ် ပျမ်းမျှကိုယ်အလေးချိန် (Avg Weight for the week)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                step="0.1"
                value={avgWeight}
                onChange={(e) => setAvgWeight(e.target.value)}
                style={{ width: '150px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                placeholder="eg. 72.5"
                required
              />
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
            </div>
            {calcAvgWeight && !existingCheckin?.avg_weight && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                <i className="ph ph-info"></i> Daily Tracker များအရ ယခုအပတ် ပျမ်းမျှကိုယ်အလေးချိန်မှာ <strong>{calcAvgWeight} kg</strong> ဖြစ်ပါသည်။
              </p>
            )}
          </div>

          {/* Reflection Ratings */}
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--soft-shadow)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              Reflection (1-10 Ratings)
            </h3>
            
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                လေ့ကျင့်ခန်းလုပ်စဉ် Energy အခြေအနေ (Energy level during workout)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyWorkout}
                  onChange={(e) => setEnergyWorkout(parseInt(e.target.value, 10))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)', width: '30px', textAlign: 'center', fontSize: '1.2rem' }}>
                  {energyWorkout}
                </span>
              </div>
              <textarea
                value={energyWorkoutNotes}
                onChange={(e) => setEnergyWorkoutNotes(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', resize: 'vertical' }}
                placeholder="လေ့ကျင့်ခန်းစွမ်းဆောင်ရည်နှင့်ပတ်သက်ပြီး မှတ်စုတိုရေးရန်..."
                rows={2}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                တစ်နေ့တာ Energy အခြေအနေ (Daily life energy level)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyDaily}
                  onChange={(e) => setEnergyDaily(parseInt(e.target.value, 10))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)', width: '30px', textAlign: 'center', fontSize: '1.2rem' }}>
                  {energyDaily}
                </span>
              </div>
              <textarea
                value={energyDailyNotes}
                onChange={(e) => setEnergyDailyNotes(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', resize: 'vertical' }}
                placeholder="အလုပ် သို့မဟုတ် နေ့စဉ်လူနေမှုဘဝအတွင်း နုံးခွေမှု/လန်းဆန်းမှု မှတ်စုများ..."
                rows={2}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Motivation Level (စိတ်အားထက်သန်မှု)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={motivation}
                  onChange={(e) => setMotivation(parseInt(e.target.value, 10))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)', width: '30px', textAlign: 'center', fontSize: '1.2rem' }}>
                  {motivation}
                </span>
              </div>
              <textarea
                value={motivationNotes}
                onChange={(e) => setMotivationNotes(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', resize: 'vertical' }}
                placeholder="ယခုတစ်ပတ် စိတ်ပိုင်းဆိုင်ရာ ဖြတ်သန်းမှုအတွေ့အကြုံ..."
                rows={2}
              />
            </div>
          </div>

          {/* Struggles & Wins Text areas */}
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--soft-shadow)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                ဘယ်နေရာမှာ အဓိက အခက်အခဲနဲ့ လိုအပ်ချက်ရှိတယ်လို့ ထင်သလဲ? (Struggles)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.8rem' }}>
                (ဥပမာ - ဗိုက်အရမ်းဆာ၊ စိတ်မပါ၊ သေချာအလေးမနိုင်၊ သေချာမအိပ်ဖြစ်)
              </span>
              <textarea
                rows={3}
                value={struggleNotes}
                onChange={(e) => setStruggleNotes(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                placeholder="သင့်အခက်အခဲများကို ပွင့်ပွင့်လင်းလင်း ရေးသားပေးပါ..."
              />
            </div>

            <div>
              <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                ဒီအပတ်မှာ ဘာတွေ တိုးတက်တယ်၊ အနိုင်ရတယ်လို့ ခံစားရလဲ? (Improvements/Wins)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.8rem' }}>
                (ဥပမာ - အကျင့်တွေ ပိုရလာတာ၊ နေလို့ကောင်းတာ၊ Meal Plan မပျက် စားဖြစ်တာ၊ အလေးပိုနိုင်လာတာ)
              </span>
              <textarea
                rows={3}
                value={improvementNotes}
                onChange={(e) => setImprovementNotes(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                placeholder="တိုးတက်လာသည့်အချက်များကို ဖော်ပြပေးပါ..."
              />
            </div>

            <div>
              <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                လာမယ့်အပတ်မှာ Workout နဲ့ Diet ကို ထိခိုက်စေနိုင်မယ့် ကိစ္စတွေ ရှိလား? (Upcoming Disruptions)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.8rem' }}>
                (ဥပမာ - ခရီး၊ ပွဲ၊ စာမေးပွဲ)
              </span>
              <textarea
                rows={3}
                value={upcomingDisruptions}
                onChange={(e) => setUpcomingDisruptions(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                placeholder="ကြိုတင်ပြင်ဆင်နိုင်ရန်အတွက် ဖော်ပြပေးပါ..."
              />
            </div>

            <div>
              <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
                အစားအစာနဲ့ Exercise တွေ ပြောင်းချင်တာ၊ ထပ်ထည့်ချင်တာမျိုး ရှိလား? (Changes Wanted)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.8rem' }}>
                Any changes you want to make to food/exercise?
              </span>
              <textarea
                rows={3}
                value={changesWanted}
                onChange={(e) => setChangesWanted(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                placeholder="ဥပမာ - ကြက်ရင်ပုံအစား ငါးပြောင်းစားချင်တာ၊ ရင်ဘတ်ကစားနည်း ပြောင်းချင်တာ..."
              />
            </div>
          </div>

          {/* Progress Photo Upload */}
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--soft-shadow)' }}>
            <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem' }}>
              ယခုအပတ် ကိုယ်ခန္ဓာ တိုးတက်မှု ဓာတ်ပုံ (Weekly Progress Photo)
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>
              ကိုယ်ခန္ဓာတိုးတက်မှုကို ပိုမိုတိကျစွာ သုံးသပ်နိုင်ရန် ဓာတ်ပုံ တင်ပေးရန် လိုအပ်ပါသည်။
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}
              />

              {photoPreview && (
                <div style={{ position: 'relative', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', maxWidth: '300px', boxShadow: 'var(--soft-shadow)' }}>
                  <img
                    src={photoPreview}
                    alt="Progress Preview"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.8rem', padding: '0.4rem', textAlign: 'center' }}>
                    Preview
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              fontSize: '1.1rem',
              padding: '1rem',
              borderRadius: '50px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--soft-shadow)',
              background: 'var(--btn-primary)',
              color: '#fff'
            }}
          >
            {saving ? (
              <>
                <i className="ph ph-spinner-gap" style={{ animation: 'spin 1s linear infinite' }}></i> Report တင်နေပါသည်...
              </>
            ) : (
              <>
                <i className="ph ph-paper-plane"></i> Report တင်မည် (Submit Check-in)
              </>
            )}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </>
  );
}
