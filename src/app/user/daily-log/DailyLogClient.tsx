"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  // Form states for today's log
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

  // Calculate averages for the week table
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
      if (trackerMap[day.date]?.[key]) {
        checkedCount++;
      }
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
    } catch (err) {
      alert('ကွန်ရက် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။');
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
          <Link href={`/user/daily-log${clientQuery}`} className="active">
            <i className="ph ph-calendar-check"></i> Daily Log
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

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <h2><i className="ph ph-calendar-check" style={{ color: '#0ea5e9' }}></i> 12 Weeks Tracker</h2>
        
        {/* Week Navigation */}
        <div className="week-nav" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
            <Link
              key={w}
              href={`/user/daily-log?w=${w}${isAdminViewing ? `&client_id=${targetUserId}` : ''}`}
              className={`week-btn ${w === weekOffset ? 'active' : ''}`}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: w === weekOffset ? 'var(--btn-primary)' : 'rgba(255, 255, 255, 0.5)',
                color: w === weekOffset ? '#fff' : 'var(--text-main)',
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

        {/* Weekly Metrics Table */}
        <div className="table-container" style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#475569' }}>Metrics / Habits</th>
                {days.map((day) => (
                  <th key={day.date} style={{ padding: '1rem', color: day.date === today ? '#0ea5e9' : '#475569' }}>
                    {day.name}<br />
                    <small style={{ fontSize: '0.75rem', opacity: 0.8 }}>{day.date.substring(5)}</small>
                  </th>
                ))}
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 'bold' }}>Weekly Avg</th>
              </tr>
            </thead>
            <tbody>
              {/* Metrics */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Body Weight (kg)</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.body_weight !== undefined && trackerMap[day.date]?.body_weight !== null ? trackerMap[day.date].body_weight : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcAvg('body_weight')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Steps</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.steps !== undefined && trackerMap[day.date]?.steps !== null ? trackerMap[day.date].steps : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcAvg('steps')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Sleep Score (Hrs)</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.sleep_score !== undefined && trackerMap[day.date]?.sleep_score !== null ? trackerMap[day.date].sleep_score : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcAvg('sleep_score')}</td>
              </tr>
              {/* Habits */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>3L Water</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.water_3l ? <i className="ph-bold ph-check" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i> : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcCheckedAvg('water_3l')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Omega 3</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.omega_3 ? <i className="ph-bold ph-check" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i> : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcCheckedAvg('omega_3')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Bed Phone Filter</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.bed_phone_filter ? <i className="ph-bold ph-check" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i> : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcCheckedAvg('bed_phone_filter')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Meal Plan</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.meal_plan_adhered ? <i className="ph-bold ph-check" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i> : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcCheckedAvg('meal_plan_adhered')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ textAlign: 'left', padding: '1rem', fontWeight: 600 }}>Toilet</td>
                {days.map((day) => (
                  <td key={day.date} style={{ padding: '1rem' }}>
                    {trackerMap[day.date]?.toilet ? <i className="ph-bold ph-check" style={{ color: '#22c55e', fontSize: '1.2rem' }}></i> : '-'}
                  </td>
                ))}
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{calcCheckedAvg('toilet')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Daily Entry Form */}
        <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)', marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>ယနေ့မှတ်တမ်း (Today&apos;s Entry - {today})</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Body Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Steps</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Sleep Time (Hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sleepScore}
                  onChange={(e) => setSleepScore(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}>Habits</h4>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={water3l} onChange={(e) => setWater3l(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                3L Water
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={omega3} onChange={(e) => setOmega3(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Omega 3
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={bedPhoneFilter} onChange={(e) => setBedPhoneFilter(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Bed Phone Filter
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={mealPlanAdhered} onChange={(e) => setMealPlanAdhered(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Meal Plan
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={toilet} onChange={(e) => setToilet(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                Toilet
              </label>
            </div>

            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-book-open" style={{ color: '#0ea5e9' }}></i> Journaling
            </h4>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Diet Status (Over / Under / Ok)</label>
              <select
                value={dietStatus}
                onChange={(e) => setDietStatus(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
              >
                <option value="">ရွေးချယ်ပါ (Select)</option>
                <option value="over">Over</option>
                <option value="under">Under</option>
                <option value="ok">Ok</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ဒီနေ့အတွက် ကျေနပ်ခဲ့ရတဲ့ အရာတစ်ခုက ဘာလဲ? (Satisfied with)</label>
              <textarea
                rows={2}
                value={satisfiedWith}
                onChange={(e) => setSatisfiedWith(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
              ></textarea>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ဒီနေ့အတွက် ခက်ခဲခဲ့တဲ့ အရာတစ်ခုက ဘာလဲ? (Difficult with)</label>
              <textarea
                rows={2}
                value={difficultWith}
                onChange={(e) => setDifficultWith(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-cta"
              style={{ background: 'var(--btn-primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {saving ? 'မှတ်တမ်းတင်နေပါသည်...' : 'မှတ်တမ်းတင်မည် (Save)'}
            </button>
          </form>
        </div>

        {/* Weekly Journal list */}
        <div>
          <h3>ယခင်မှတ်တမ်းများ (Week&apos;s Journals)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {days
              .filter((day) => {
                const j = journalMap[day.date];
                return j && (j.satisfied_with || j.difficult_with || j.diet_status);
              })
              .map((day) => {
                const j = journalMap[day.date];
                return (
                  <div key={day.date} style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)' }}>
                    <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                      {day.name} ({day.date}) - Diet: <span style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{j.diet_status || 'N/A'}</span>
                    </h4>
                    {j.satisfied_with && <p style={{ margin: '0.2rem 0', color: 'var(--text-main)' }}><strong>Satisfied:</strong> {j.satisfied_with}</p>}
                    {j.difficult_with && <p style={{ margin: '0.2rem 0', color: 'var(--text-main)' }}><strong>Difficult:</strong> {j.difficult_with}</p>}
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </>
  );
}
