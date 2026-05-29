"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SetupProfileClientProps {
  userId: string;
  username: string;
  initialProfile: any;
}

export default function SetupProfileClient({
  userId,
  username,
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
        body: JSON.stringify({
          userId,
          weight,
          height,
          age,
          bodyFat,
          desiredBodyText,
        }),
      });

      if (res.ok) {
        router.push('/user/setup-schedule');
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

      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '24px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ height: '2px', width: '30px', background: '#d97706', display: 'inline-block' }}></span>
          <span style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>BASELINE · 01</span>
        </div>

        <h2 style={{ textAlign: 'left', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Your starting point</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>Enter once. We measure every win against today.</p>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleContinue}>
          
          {/* Inputs Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Weight</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  placeholder="85"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', paddingRight: '2rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: 'var(--text-main)', textAlign: 'center', fontWeight: 'bold' }}
                  required
                  min="30"
                  max="300"
                />
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>kg</span>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Height</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  placeholder="174"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', paddingRight: '2.2rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: 'var(--text-main)', textAlign: 'center', fontWeight: 'bold' }}
                  required
                  min="100"
                  max="250"
                />
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>cm</span>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Age</label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: 'var(--text-main)', textAlign: 'center', fontWeight: 'bold' }}
                required
                min="12"
                max="100"
              />
            </div>

          </div>

          {/* Body Fat Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem' }}>
              Body fat — pick what looks like you
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {bodyFatOptions.map((val) => {
                const isSelected = bodyFat === val;
                return (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setBodyFat(val)}
                    style={{
                      background: isSelected ? '#f0f9ff' : '#f8fafc',
                      border: isSelected ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <i className="ph ph-user" style={{ fontSize: '1.2rem', color: isSelected ? '#0ea5e9' : 'var(--text-muted)' }}></i>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? '#0f172a' : 'var(--text-muted)' }}>{val}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desired Body Type / Goals */}
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              ဖြစ်ချင်တဲ့ Body ပုံစံ / Fitness Goals (Desired Body Style)
            </label>
            <textarea
              placeholder="ဥပမာ- ဗိုက်ခေါက်ထွက်ချင်တယ်၊ ပခုံးနဲ့ ရင်အုပ်ပိုကြီးချင်တယ်..."
              rows={3}
              value={desiredBodyText}
              onChange={(e) => setDesiredBodyText(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-block"
            style={{
              background: '#0f172a', // dark color from mockup
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
            {saving ? 'သိမ်းဆည်းနေပါသည်...' : 'Continue'}
          </button>

        </form>

      </div>
    </div>
  );
}
