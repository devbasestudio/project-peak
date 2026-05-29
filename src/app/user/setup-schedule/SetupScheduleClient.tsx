"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
    setWeeklySplits((prev) => ({
      ...prev,
      [dayVal]: splitName,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');

    // Prepare body payload
    const scheduleData = daysOfWeek.map((d) => {
      const splitName = weeklySplits[d.value];
      const isRest = splitName === 'Rest';
      return {
        dayOfWeek: d.value,
        splitName: isRest ? null : splitName,
        isRest,
      };
    });

    try {
      const res = await fetch('/api/user/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          schedule: scheduleData,
        }),
      });

      if (res.ok) {
        // Redirect to dashboard
        window.location.href = '/user/dashboard';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'အချက်အလက် သိမ်းဆည်းရန် ပျက်ကွက်ခဲ့သည်။');
      }
    } catch (err) {
      setErrorMsg('ကွန်ရက် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့သည်။');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page" style={{ flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <i className="ph ph-barbell kanji" style={{ fontSize: '2rem' }}></i>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>Project Peak <span className="kanji">空</span></h1>
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', borderRadius: '24px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ height: '2px', width: '30px', background: '#d97706', display: 'inline-block' }}></span>
          <span style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>SCHEDULE · 02</span>
        </div>

        <h2 style={{ textAlign: 'left', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Plan your week</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Your Assigned Program: <strong style={{ color: 'var(--accent-color)' }}>{programName}</strong>
        </p>

        {/* Splits Badges List */}
        <div style={{ marginBottom: '1.8rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            Available Splits
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {splits.map((s) => (
              <span key={s} style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <i className="ph ph-activity" style={{ color: 'var(--accent-color)' }}></i> {s}
              </span>
            ))}
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
              Rest
            </span>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* Daily Schedule Assignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {daysOfWeek.map((day) => {
            const currentSplit = weeklySplits[day.value];
            const isRest = currentSplit === 'Rest';
            return (
              <div
                key={day.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '0.8rem 1.2rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontWeight: 800, color: isRest ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.95rem' }}>
                  {day.label}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={currentSplit}
                    onChange={(e) => handleSplitChange(day.value, e.target.value)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: isRest ? '#fffbeb' : '#e0f2fe',
                      color: isRest ? '#b45309' : '#0369a1',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="Rest">Rest</option>
                    {splits.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#0f172a',
            color: '#fff',
            padding: '1rem',
            borderRadius: '50px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
          }}
        >
          {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'Lock my week'}
        </button>

      </div>
    </div>
  );
}
