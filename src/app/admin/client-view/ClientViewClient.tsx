"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClientViewClientProps {
  client: any;
  program: any;
  checkins: any[];
  selectedWeek: number | null;
  clientId: number;
}

export default function ClientViewClient({
  client,
  program,
  checkins,
  selectedWeek,
  clientId,
}: ClientViewClientProps) {
  const router = useRouter();
  
  // Program builder form states
  const [durationWeeks, setDurationWeeks] = useState(program?.duration_weeks ?? 12);
  const [targetCalories, setTargetCalories] = useState(program?.target_calories ?? 2000);
  const [macrosP, setMacrosP] = useState(program?.macros_p ?? 150);
  const [macrosC, setMacrosC] = useState(program?.macros_c ?? 200);
  const [macrosF, setMacrosF] = useState(program?.macros_f ?? 65);
  const [programType, setProgramType] = useState(program?.program_type ?? 'skinnyfat_recomp');
  
  const [updatingProgram, setUpdatingProgram] = useState(false);
  const [programSuccess, setProgramSuccess] = useState(false);
  const [programError, setProgramError] = useState('');

  // Feedback states mapped by checkin ID
  const [feedbackValues, setFeedbackValues] = useState<Record<number, string>>(
    checkins.reduce((acc, curr) => {
      acc[curr.id] = curr.admin_feedback || '';
      return acc;
    }, {} as Record<number, string>)
  );
  const [savingFeedback, setSavingFeedback] = useState<Record<number, boolean>>({});
  const [feedbackSuccess, setFeedbackSuccess] = useState<Record<number, boolean>>({});
  const [feedbackError, setFeedbackError] = useState<Record<number, string>>({});

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProgram(true);
    setProgramSuccess(false);
    setProgramError('');

    try {
      const res = await fetch('/api/admin/update-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setProgramError(data.error || 'Failed to update program.');
      }
    } catch (err) {
      setProgramError('Network error occurred.');
    } finally {
      setUpdatingProgram(false);
    }
  };

  const handleSaveFeedback = async (checkinId: number) => {
    setSavingFeedback((prev) => ({ ...prev, [checkinId]: true }));
    setFeedbackSuccess((prev) => ({ ...prev, [checkinId]: false }));
    setFeedbackError((prev) => ({ ...prev, [checkinId]: '' }));

    try {
      const res = await fetch('/api/admin/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          admin_feedback: feedbackValues[checkinId],
        }),
      });

      if (res.ok) {
        setFeedbackSuccess((prev) => ({ ...prev, [checkinId]: true }));
        router.refresh();
      } else {
        const data = await res.json();
        setFeedbackError((prev) => ({ ...prev, [checkinId]: data.error || 'Failed to save feedback.' }));
      }
    } catch (err) {
      setFeedbackError((prev) => ({ ...prev, [checkinId]: 'Network error occurred.' }));
    } finally {
      setSavingFeedback((prev) => ({ ...prev, [checkinId]: false }));
    }
  };

  return (
    <>
      <nav className="navbar" style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="nav-brand">
          <i className="ph ph-barbell kanji"></i>
          <span>Project Peak (Trainer Panel)</span>
        </div>
        <div className="nav-links">
          <Link href="/admin/dashboard" className="active">
            <i className="ph ph-users"></i> Clients
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
        <Link href="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
          <i className="ph ph-arrow-left"></i> နောက်သို့ (Back)
        </Link>

        <h2 style={{ marginBottom: '2rem' }}>{client.username}&apos;s Profile</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Program Builder Section */}
          <div className="glass-card" style={{ background: '#fff', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--soft-shadow)', height: 'fit-content' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <i className="ph ph-sliders" style={{ color: '#0ea5e9' }}></i> Program Builder
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Target Calories & Macros</p>
            
            {programSuccess && (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                Program updated successfully!
              </div>
            )}
            {programError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {programError}
              </div>
            )}

            <form onSubmit={handleUpdateProgram} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Program Type</label>
                <select
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                >
                  <option value="skinnyfat_recomp">Skinnyfat Recomp</option>
                  <option value="project_20">Project-20</option>
                  <option value="mass_method">Mass Method</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Duration (Weeks)</label>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Target Calories (kcal)</label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Protein (g)</label>
                <input
                  type="number"
                  value={macrosP}
                  onChange={(e) => setMacrosP(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Carbs (g)</label>
                <input
                  type="number"
                  value={macrosC}
                  onChange={(e) => setMacrosC(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Fats (g)</label>
                <input
                  type="number"
                  value={macrosF}
                  onChange={(e) => setMacrosF(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
              <button
                type="submit"
                disabled={updatingProgram}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'var(--btn-primary)', color: '#fff', marginTop: '0.5rem' }}
              >
                {updatingProgram ? 'Updating...' : 'Update Program'}
              </button>
            </form>
          </div>

          {/* Client Dashboard Access and Reports History */}
          <div>
            <div className="glass-card mb-3" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(2, 132, 199, 0.05))', border: '1px solid var(--glass-border)', borderColor: 'var(--accent-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--soft-shadow)', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <i className="ph ph-user-gear" style={{ color: 'var(--accent-color)' }}></i> Manage Client&apos;s Dashboard
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Client မြင်ရသည့်အတိုင်း အချက်အလက်များ ဝင်ရောက်ကြည့်ရှုပြင်ဆင်ရန် အောက်ပါလင့်ခ်များကို နှိပ်ပါ။
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Link href={`/user/dashboard?client_id=${clientId}`} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: 'var(--text-main)', background: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <i className="ph ph-squares-four"></i> Dashboard
                </Link>
                <Link href={`/user/daily-log?client_id=${clientId}`} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: 'var(--text-main)', background: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <i className="ph ph-calendar-check"></i> Daily Log
                </Link>
                <Link href={`/user/workout?client_id=${clientId}`} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: 'var(--text-main)', background: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <i className="ph ph-barbell"></i> Workout
                </Link>
                <Link href={`/user/diet?client_id=${clientId}`} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: 'var(--text-main)', background: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <i className="ph ph-fork-knife"></i> Diet Plan
                </Link>
                <Link href={`/user/check-in?client_id=${clientId}`} className="btn btn-secondary" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: 'var(--text-main)', background: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', gridColumn: 'span 2' }}>
                  <i className="ph ph-clipboard-text"></i> Weekly Check-in
                </Link>
              </div>
            </div>

            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="ph ph-clipboard-text" style={{ color: '#a855f7' }}></i> Weekly Check-ins
            </h3>

            {checkins.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No check-ins yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {checkins.map((chk) => {
                  const isHighlighted = selectedWeek === chk.week_number;
                  return (
                    <div
                      key={chk.id}
                      style={{
                        background: '#fff',
                        border: isHighlighted ? '2px solid #a855f7' : '1px solid var(--glass-border)',
                        padding: '2rem',
                        borderRadius: '16px',
                        boxShadow: isHighlighted ? '0 10px 25px -5px rgba(168, 85, 247, 0.15)' : 'var(--soft-shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#a855f7', fontWeight: 700 }}>
                          Week {chk.week_number} Report
                        </h4>
                        <small style={{ color: 'var(--text-muted)' }}>
                          Submitted: {new Date(chk.created_at).toLocaleDateString()}
                        </small>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg Weight</strong>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                            {chk.avg_weight} kg
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Energy (Workout)</strong>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                            {chk.energy_workout}/10
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Energy (Daily)</strong>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                            {chk.energy_daily}/10
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Motivation</strong>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                            {chk.motivation}/10
                          </div>
                        </div>
                      </div>

                      {/* Photo preview block */}
                      {chk.progress_photo_url && (
                        <div style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 'fit-content' }}>
                          <strong style={{ fontSize: '0.95rem' }}><i className="ph ph-image"></i> Progress Photo</strong>
                          <a href={`/${chk.progress_photo_url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img src={`/${chk.progress_photo_url}`} alt="Progress" style={{ maxHeight: '150px', width: 'auto', display: 'block' }} />
                          </a>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {chk.energy_workout_notes && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Energy Notes (Workout):</strong> <span style={{ color: 'var(--text-main)' }}>{chk.energy_workout_notes}</span>
                          </div>
                        )}
                        {chk.energy_daily_notes && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Energy Notes (Daily):</strong> <span style={{ color: 'var(--text-main)' }}>{chk.energy_daily_notes}</span>
                          </div>
                        )}
                        {chk.motivation_notes && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Motivation Notes:</strong> <span style={{ color: 'var(--text-main)' }}>{chk.motivation_notes}</span>
                          </div>
                        )}
                        {chk.struggle_notes && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                            <strong>Struggles:</strong><br />
                            <p style={{ margin: '0.25rem 0 0 0', whiteSpace: 'pre-wrap' }}>{chk.struggle_notes}</p>
                          </div>
                        )}
                        {chk.improvement_notes && (
                          <div style={{ background: 'rgba(34, 197, 94, 0.04)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                            <strong>Improvements/Wins:</strong><br />
                            <p style={{ margin: '0.25rem 0 0 0', whiteSpace: 'pre-wrap' }}>{chk.improvement_notes}</p>
                          </div>
                        )}
                        {chk.upcoming_disruptions && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Upcoming Disruptions:</strong><br />
                            <p style={{ margin: '0.25rem 0 0 0', whiteSpace: 'pre-wrap' }}>{chk.upcoming_disruptions}</p>
                          </div>
                        )}
                        {chk.changes_wanted && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Changes Wanted:</strong><br />
                            <p style={{ margin: '0.25rem 0 0 0', whiteSpace: 'pre-wrap' }}>{chk.changes_wanted}</p>
                          </div>
                        )}
                      </div>

                      {/* Trainer Feedback Form */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                          Trainer Feedback <i className="ph ph-chat-circle-text" style={{ color: '#a855f7' }}></i>
                        </label>
                        
                        {feedbackSuccess[chk.id] && (
                          <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                            Feedback saved successfully!
                          </div>
                        )}
                        {feedbackError[chk.id] && (
                          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {feedbackError[chk.id]}
                          </div>
                        )}

                        <textarea
                          rows={4}
                          value={feedbackValues[chk.id]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFeedbackValues((prev) => ({ ...prev, [chk.id]: val }));
                          }}
                          placeholder="Write your feedback here..."
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }}
                        />
                        <button
                          type="button"
                          disabled={savingFeedback[chk.id]}
                          onClick={() => handleSaveFeedback(chk.id)}
                          className="btn btn-secondary"
                          style={{ alignSelf: 'flex-start', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', background: 'var(--btn-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          {savingFeedback[chk.id] ? 'Saving...' : 'Save Feedback'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
