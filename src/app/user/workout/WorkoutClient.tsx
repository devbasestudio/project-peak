"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Exercise {
  id: number;
  workout_id: number;
  exercise_name: string;
  target_sets: number;
  target_reps: string;
  actual_weight: string | null;
  actual_reps: string | null;
  original_exercise_id: number | null;
  muscle_group: string | null;
}

interface LibraryExercise {
  id: number;
  exercise_name: string;
  muscle_group: string | null;
  sets_default: number;
  reps_default: string;
}

interface LastLog {
  weight: string;
  reps: string;
  date: string;
}

interface WorkoutClientProps {
  targetUserId: string;
  isAdminViewing: boolean;
  clientQuery: string;
  today: string;
  workout: any;
  exercises: Exercise[];
  allLibraryExercises: LibraryExercise[];
  lastSessionLogs: Record<string, LastLog>;
}

export default function WorkoutClient({
  targetUserId,
  isAdminViewing,
  clientQuery,
  today,
  workout,
  exercises: initialExercises,
  allLibraryExercises,
  lastSessionLogs,
}: WorkoutClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Session Timer (ElapsedTime)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Wizard & Local Workout Exercises State
  const [activeIndex, setActiveIndex] = useState(0);

  const parseLoggedValues = (val: string | null, count: number): string[] => {
    if (!val) return Array(count).fill('');
    const parts = val.split(',');
    while (parts.length < count) parts.push('');
    return parts;
  };

  const [workoutExercises, setWorkoutExercises] = useState(() => {
    return initialExercises.map((ex) => {
      const count = ex.target_sets || 3;
      return {
        ...ex,
        weights: parseLoggedValues(ex.actual_weight, count),
        reps: parseLoggedValues(ex.actual_reps, count),
        setCount: count,
      };
    });
  });

  const [userFeelings, setUserFeelings] = useState(workout?.user_feelings || '');
  const [userNotes, setUserNotes] = useState(workout?.user_notes || '');

  // 3. Rest Timer state (local to current exercise)
  const [restDuration, setRestDuration] = useState(90); // default 90s
  const [restSecondsLeft, setRestSecondsLeft] = useState(90);
  const [restActive, setRestActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synchronize rest timer duration to current exercise's library settings if possible
  useEffect(() => {
    const currentEx = workoutExercises[activeIndex];
    if (currentEx) {
      // Find matches in library to get rest period
      const libMatch = allLibraryExercises.find(
        (l) => l.exercise_name.toLowerCase() === currentEx.exercise_name.toLowerCase()
      );
      // fallback to 90
      const secs = (libMatch as any)?.rest_seconds || 90;
      setRestDuration(secs);
      setRestSecondsLeft(secs);
      setRestActive(false);
    }
  }, [activeIndex, workoutExercises, allLibraryExercises]);

  // Timer Tick effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (restActive && restSecondsLeft > 0) {
      timer = setInterval(() => {
        setRestSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (restActive && restSecondsLeft === 0) {
      setRestActive(false);
      triggerBuzzer();
    }
    return () => clearInterval(timer);
  }, [restActive, restSecondsLeft]);

  // Audio buzzer play
  const triggerBuzzer = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880; // A5 pitch
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Web Audio API blocked or not supported
    }
  };

  const handleStartRest = () => {
    setRestActive(true);
  };

  const handlePauseRest = () => {
    setRestActive(false);
  };

  const handleResetRest = () => {
    setRestSecondsLeft(restDuration);
    setRestActive(false);
  };

  const adjustRest = (amount: number) => {
    setRestSecondsLeft((prev) => Math.max(0, prev + amount));
  };

  // 4. Sets Input handlers
  const handleSetValChange = (
    exIdx: number,
    setIdx: number,
    field: 'weights' | 'reps',
    val: string
  ) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIdx) return ex;
        const newArr = [...ex[field]];
        newArr[setIdx] = val;
        return { ...ex, [field]: newArr };
      })
    );
  };

  const handleAddSet = (exIdx: number) => {
    setWorkoutExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== exIdx) return ex;
        return {
          ...ex,
          setCount: ex.setCount + 1,
          weights: [...ex.weights, ''],
          reps: [...ex.reps, ''],
        };
      })
    );
  };

  // 5. Exercise Swap Modal State
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swappingExIdx, setSwappingExIdx] = useState<number | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(null);
  const [swapping, setSwapping] = useState(false);

  const openSwapModal = (idx: number) => {
    setSwappingExIdx(idx);
    const ex = workoutExercises[idx];
    // Find alternatives
    const alts = allLibraryExercises.filter(
      (l) => l.muscle_group === ex.muscle_group && l.exercise_name !== ex.exercise_name
    );
    if (alts.length > 0) {
      setSelectedReplacementId(alts[0].id);
    } else {
      setSelectedReplacementId(allLibraryExercises[0]?.id || null);
    }
    setShowSwapModal(true);
  };

  const handleSwapConfirm = async () => {
    if (swappingExIdx === null || selectedReplacementId === null) return;
    const currentEx = workoutExercises[swappingExIdx];
    if (!currentEx.original_exercise_id) {
      alert("Error: Template ID missing for this exercise.");
      return;
    }

    setSwapping(true);
    try {
      const res = await fetch('/api/user/swap-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          workoutExerciseId: currentEx.id,
          originalExerciseId: currentEx.original_exercise_id,
          replacementExerciseId: selectedReplacementId,
        }),
      });

      if (res.ok) {
        const replacementLibItem = allLibraryExercises.find((l) => l.id === selectedReplacementId);
        if (replacementLibItem) {
          setWorkoutExercises((prev) =>
            prev.map((ex, idx) => {
              if (idx !== swappingExIdx) return ex;
              const count = replacementLibItem.sets_default || 3;
              return {
                ...ex,
                exercise_name: replacementLibItem.exercise_name,
                target_sets: count,
                target_reps: replacementLibItem.reps_default,
                weights: Array(count).fill(''),
                reps: Array(count).fill(''),
                setCount: count,
              };
            })
          );
        }
        setShowSwapModal(false);
      } else {
        alert("Failed to swap exercise.");
      }
    } catch (e) {
      alert("Network error swapping exercise.");
    } finally {
      setSwapping(false);
    }
  };

  // 6. Submit Workout Record
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        userId: targetUserId,
        workoutId: workout.id,
        exercises: workoutExercises.map((ex) => {
          // slice arrays to match current setCount
          const weightStr = ex.weights.slice(0, ex.setCount).join(',');
          const repsStr = ex.reps.slice(0, ex.setCount).join(',');
          return {
            id: ex.id,
            actualWeight: weightStr,
            actualReps: repsStr,
          };
        }),
        userFeelings,
        userNotes,
      };

      const res = await fetch('/api/user/save-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg('လေ့ကျင့်ခန်းမှတ်တမ်းတင်ပြီးပါပြီ။ (Workout Complete!)');
        setTimeout(() => {
          router.push(`/user/dashboard${clientQuery}`);
        }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save workout.');
      }
    } catch (err) {
      alert('Network error saving workout.');
    } finally {
      setSaving(false);
    }
  };

  const currentEx = workoutExercises[activeIndex];
  const isFinalStep = activeIndex === workoutExercises.length; // Final notes step

  // Parse last session logs
  const getPrevLogs = (exName: string) => {
    const prev = lastSessionLogs[exName];
    if (!prev) return null;
    const wArr = prev.weight ? prev.weight.split(',') : [];
    const rArr = prev.reps ? prev.reps.split(',') : [];
    return { wArr, rArr, date: prev.date };
  };

  const prevLogs = currentEx ? getPrevLogs(currentEx.exercise_name) : null;

  return (
    <div className="app-page">
      
      {/* Mobile Wrapper */}
      <div className="app-container">
        
        {isAdminViewing && (
          <div className="alert alert-danger">
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> You are managing this client&apos;s active workout.
          </div>
        )}

        {/* Workout Progress Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1c2b29', margin: 0 }}>
              {workout?.split_name || 'Workout Session'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#83928f', fontWeight: 600 }}>
              {!isFinalStep ? `Exercise ${activeIndex + 1} of ${workoutExercises.length}` : 'Workout Summary & Notes'}
            </p>
          </div>
          
          {/* Active Workout Timer */}
          <div className="workout-timer">
            <i className="ph ph-timer" style={{ fontSize: '1.1rem' }}></i>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Top Progress bar indicators */}
        <div className="workout-progress-bar">
          {workoutExercises.map((_, idx) => {
            let bg = '#e6eae8';
            if (idx < activeIndex) bg = '#ff6b35';
            else if (idx === activeIndex && !isFinalStep) bg = '#ffd1c1';
            return (
              <div key={idx} className="workout-progress-segment" style={{ background: bg }}></div>
            );
          })}
          <div className="workout-progress-segment" style={{ background: isFinalStep ? '#ff6b35' : '#e6eae8' }}></div>
        </div>

        {successMsg && (
          <div className="alert alert-success" style={{ fontWeight: 700, textAlign: 'center' }}>
            <i className="ph ph-check-circle" style={{ marginRight: '0.5rem' }}></i>
            {successMsg}
          </div>
        )}

        {/* Main Card View */}
        {!isFinalStep && currentEx ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Active Exercise Card */}
            <div className="card exercise-card" style={{ borderRadius: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1c2b29', margin: 0, lineHeight: '1.3' }}>
                  {currentEx.exercise_name}
                </h3>
                <button
                  type="button"
                  onClick={() => openSwapModal(activeIndex)}
                  title="Swap exercise"
                  style={{
                    background: '#f5f7f5',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#83928f',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffd1c1';
                    e.currentTarget.style.color = '#ff6b35';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f7f5';
                    e.currentTarget.style.color = '#83928f';
                  }}
                >
                  <i className="ph ph-arrows-left-right" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
                </button>
              </div>

              {/* Target info */}
              <div style={{ display: 'inline-flex', background: '#ffd1c1', color: '#ff6b35', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.2rem' }}>
                Target: {currentEx.target_sets} Sets x {currentEx.target_reps} Reps
              </div>

              {/* Interactive Sets Table */}
              <div style={{ width: '100%', overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e6eae8' }}>
                      <th style={{ padding: '0.5rem 0.2rem', fontSize: '0.72rem', color: '#83928f', fontWeight: 800 }}>SET</th>
                      <th style={{ padding: '0.5rem 0.2rem', fontSize: '0.72rem', color: '#83928f', fontWeight: 800 }}>PREVIOUS</th>
                      <th style={{ padding: '0.5rem 0.2rem', fontSize: '0.72rem', color: '#83928f', fontWeight: 800 }}>WEIGHT (KG)</th>
                      <th style={{ padding: '0.5rem 0.2rem', fontSize: '0.72rem', color: '#83928f', fontWeight: 800 }}>REPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: currentEx.setCount }).map((_, setIdx) => {
                      const prevWeight = prevLogs?.wArr[setIdx] || '';
                      const prevRep = prevLogs?.rArr[setIdx] || '';
                      const prevText = prevWeight && prevRep ? `${prevWeight}kg x ${prevRep}` : '—';

                      return (
                        <tr key={setIdx} style={{ borderBottom: '1px solid #f5f7f5' }}>
                          {/* Set number */}
                          <td style={{ padding: '0.8rem 0.2rem', fontWeight: 800, fontSize: '0.9rem', color: '#1c2b29' }}>
                            {setIdx + 1}
                          </td>
                          {/* Previous performance */}
                          <td style={{ padding: '0.8rem 0.2rem', fontSize: '0.8rem', color: '#83928f', fontWeight: 600 }}>
                            {prevText}
                          </td>
                          {/* Weight input */}
                          <td style={{ padding: '0.5rem 0.2rem' }}>
                            <input
                              type="number"
                              step="any"
                              placeholder="0.0"
                              value={currentEx.weights[setIdx] || ''}
                              onChange={(e) => handleSetValChange(activeIndex, setIdx, 'weights', e.target.value)}
                              style={{
                                width: '70px',
                                background: '#f5f7f5',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.4rem',
                                color: '#1c2b29',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}
                            />
                          </td>
                          {/* Reps input */}
                          <td style={{ padding: '0.5rem 0.2rem' }}>
                            <input
                              type="number"
                              placeholder="0"
                              value={currentEx.reps[setIdx] || ''}
                              onChange={(e) => handleSetValChange(activeIndex, setIdx, 'reps', e.target.value)}
                              style={{
                                width: '55px',
                                background: '#f5f7f5',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.4rem',
                                color: '#1c2b29',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add set button */}
              <button
                type="button"
                onClick={() => handleAddSet(activeIndex)}
                style={{
                  background: 'none',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  color: '#83928f',
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff6b35';
                  e.currentTarget.style.color = '#ff6b35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#83928f';
                }}
              >
                <i className="ph ph-plus" style={{ fontSize: '1rem', fontWeight: 'bold' }}></i>
                <span>Add Set (နောက်ထပ် Set တစ်ခုထည့်မည်)</span>
              </button>

            </div>

            {/* Rest Timer Widget */}
            <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e6eae8', padding: '1.2rem 1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.015)', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#83928f', fontWeight: 800 }}>Rest Timer (အနားယူချိန် နာရီ)</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => adjustRest(-30)}
                  style={{
                    background: '#f5f7f5',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '32px',
                    fontWeight: 800,
                    color: '#83928f',
                    cursor: 'pointer',
                  }}
                >
                  -30s
                </button>

                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: restActive ? '#ff6b35' : '#1c2b29', minWidth: '110px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {Math.floor(restSecondsLeft / 60).toString().padStart(2, '0')}:
                  {(restSecondsLeft % 60).toString().padStart(2, '0')}
                </div>

                <button
                  type="button"
                  onClick={() => adjustRest(30)}
                  style={{
                    background: '#f5f7f5',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '32px',
                    fontWeight: 800,
                    color: '#83928f',
                    cursor: 'pointer',
                  }}
                >
                  +30s
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', width: '100%', marginTop: '0.2rem' }}>
                {!restActive ? (
                  <button
                    type="button"
                    onClick={handleStartRest}
                    style={{
                      flex: 2,
                      background: '#1c2b29',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <i className="ph ph-play" style={{ fontSize: '0.9rem' }}></i> Start Rest
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseRest}
                    style={{
                      flex: 2,
                      background: '#ff6b35',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <i className="ph ph-pause" style={{ fontSize: '0.9rem' }}></i> Pause Rest
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={handleResetRest}
                  style={{
                    flex: 1,
                    background: '#f5f7f5',
                    color: '#83928f',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Final step: Notes & Feelings */
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #e6eae8', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.015)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1c2b29' }}>
              <i className="ph ph-note-pencil" style={{ color: '#ff6b35', marginRight: '0.4rem' }}></i>
              Workout Summary & Notes
            </h3>
            <p style={{ margin: 0, color: '#83928f', fontSize: '0.82rem', marginTop: '-0.6rem' }}>
              မှတ်တမ်းမသိမ်းဆည်းမီ ယနေ့လေ့ကျင့်ခန်းအတွေ့အကြုံကို ရေးသားပေးပါ (How was today&apos;s session?)
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1c2b29' }}>Feelings / Body Condition</label>
              <textarea
                rows={3}
                placeholder="ဥပမာ- နေရတာ Energy အပြည့်ရှိတယ်၊ အမောခံနိုင်တယ်..."
                value={userFeelings}
                onChange={(e) => setUserFeelings(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f5f7f5',
                  color: '#1c2b29',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1c2b29' }}>Workout Notes / Progressive Overload Notes</label>
              <textarea
                rows={3}
                placeholder="ဥပမာ- Bench press မှာ Form ပိုငြိမ်လာတယ်၊ နောက်တစ်ခေါက် 2.5kg ထပ်တိုးမယ်..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f5f7f5',
                  color: '#1c2b29',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                }}
              ></textarea>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((prev) => prev - 1)}
            style={{
              flex: 1,
              background: activeIndex === 0 ? '#e6eae8' : '#ffffff',
              color: activeIndex === 0 ? '#cbd5e1' : '#1c2b29',
              border: '1px solid #cbd5e1',
              borderRadius: '50px',
              padding: '0.8rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <i className="ph ph-arrow-left" style={{ fontWeight: 'bold' }}></i> Back
          </button>

          {!isFinalStep ? (
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => prev + 1)}
              style={{
                flex: 2,
                background: '#1c2b29',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '0.8rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              Next <i className="ph ph-arrow-right" style={{ fontWeight: 'bold' }}></i>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 2,
                background: '#ff6b35',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '0.8rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
              }}
            >
              {saving ? 'Saving...' : 'Complete Workout (အဆုံးသတ်မည်)'}
              <i className="ph ph-check" style={{ fontWeight: 'bold' }}></i>
            </button>
          )}
        </div>

      </div>

      {/* Exercise Swap Dialog Modal */}
      {showSwapModal && swappingExIdx !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1c2b29' }}>
                Swap Exercise (လေ့ကျင့်ခန်းလဲလှယ်ရန်)
              </h3>
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#83928f' }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#83928f' }}>
              <strong>Current:</strong> {workoutExercises[swappingExIdx]?.exercise_name}
              <br />
              Targeting muscle group: <strong>{workoutExercises[swappingExIdx]?.muscle_group || 'Any'}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1c2b29' }}>Select Replacement (အစားထိုးရန်ရွေးချယ်ပါ)</label>
              <select
                value={selectedReplacementId || ''}
                onChange={(e) => setSelectedReplacementId(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  background: '#f5f7f5',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.7rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#1c2b29',
                }}
              >
                {allLibraryExercises
                  .filter(
                    (le) =>
                      le.muscle_group === workoutExercises[swappingExIdx]?.muscle_group &&
                      le.exercise_name !== workoutExercises[swappingExIdx]?.exercise_name
                  )
                  .map((le) => (
                    <option key={le.id} value={le.id}>
                      {le.exercise_name} (Target: {le.sets_default}x{le.reps_default})
                    </option>
                  ))}
                {/* Fallback to show all if no same muscle group items */}
                {allLibraryExercises.filter(
                  (le) =>
                    le.muscle_group === workoutExercises[swappingExIdx]?.muscle_group &&
                    le.exercise_name !== workoutExercises[swappingExIdx]?.exercise_name
                ).length === 0 &&
                  allLibraryExercises.map((le) => (
                    <option key={le.id} value={le.id}>
                      {le.exercise_name} (Group: {le.muscle_group})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                style={{
                  flex: 1,
                  background: '#f5f7f5',
                  color: '#83928f',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSwapConfirm}
                disabled={swapping || selectedReplacementId === null}
                style={{
                  flex: 2,
                  background: '#ff6b35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {swapping ? 'Swapping...' : 'Swap Now (လဲလှယ်မည်)'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          <Link href={`/user/dashboard${clientQuery}`} className="bottom-nav-item">
            <i className="ph ph-house"></i>
            <span>Home</span>
          </Link>
          <Link href={`/user/daily-log${clientQuery}`} className="bottom-nav-item">
            <i className="ph ph-chart-line-up"></i>
            <span>Progress</span>
          </Link>
          <Link href={`/user/diet${clientQuery}`} className="bottom-nav-item">
            <i className="ph ph-book-open"></i>
            <span>Learn</span>
          </Link>
          <Link href={`/user/workout${clientQuery}`} className="bottom-nav-item active">
            <i className="ph ph-mountains"></i>
            <span>Climb</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
