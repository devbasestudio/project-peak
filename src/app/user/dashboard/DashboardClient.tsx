"use client";

import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface DashboardClientProps {
  username: string;
  role: 'admin' | 'user';
  isAdminViewing: boolean;
  clientQuery: string;
  targetUserId: number;
  initialQuote: string;
  dates: string[];
  weights: number[];
  program: any;
  profile: any;
  todayStr: string;
  todayLog: any;
  yesterdayWeight: number | null;
  schedule: any;
  totalMealsCount: number;
  eatenMealsCount: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  streak: number;
}

export default function DashboardClient({
  username,
  role,
  isAdminViewing,
  clientQuery,
  targetUserId,
  initialQuote,
  dates,
  weights,
  program,
  profile,
  todayStr,
  todayLog,
  yesterdayWeight,
  schedule,
  totalMealsCount,
  eatenMealsCount,
  consumedCalories,
  consumedProtein,
  consumedCarbs,
  consumedFat,
  streak,
}: DashboardClientProps) {
  // Quote State
  const [quote, setQuote] = useState(initialQuote);
  const [showEditQuote, setShowEditQuote] = useState(false);
  const [newQuoteInput, setNewQuoteInput] = useState(initialQuote);
  const [savingQuote, setSavingQuote] = useState(false);

  // Daily tracker state
  const startingWeight = profile?.starting_weight ? parseFloat(profile.starting_weight) : 75;
  const initialWeight = todayLog?.body_weight ? parseFloat(todayLog.body_weight) : (yesterdayWeight || startingWeight);
  const [weightValue, setWeightValue] = useState<number>(initialWeight);
  const [stepsValue, setStepsValue] = useState<number>(todayLog?.steps ? parseInt(todayLog.steps, 10) : 0);

  // Habits State
  const [sunlight, setSunlight] = useState<boolean>(todayLog?.toilet === 1);
  const [water, setWater] = useState<boolean>(todayLog?.water_3l === 1);
  const [noPhone, setNoPhone] = useState<boolean>(todayLog?.bed_phone_filter === 1);
  const [supps, setSupps] = useState<boolean>(todayLog?.omega_3 === 1);

  // Saving states
  const [savingLog, setSavingLog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Weight chart state
  const [chartDates, setChartDates] = useState<string[]>(dates);
  const [chartWeights, setChartWeights] = useState<number[]>(weights);

  // Compute body fat values
  const startingBF = profile?.body_fat_percent ? parseInt(profile.body_fat_percent, 10) : 20;
  // Dynamic target body fat
  let targetBF = 15;
  if (startingBF >= 25) targetBF = 18;
  else if (startingBF >= 20) targetBF = 15;
  else if (startingBF >= 15) targetBF = 12;
  else targetBF = 10;

  // Current body fat calculated dynamically based on weight loss
  const weightDiff = startingWeight - weightValue;
  const currentBF = Math.max(5, Math.round((startingBF - weightDiff * 0.8) * 10) / 10);

  // Body fat progress percentage for the bar
  const bfProgressPercent = Math.min(100, Math.max(0, Math.round(((startingBF - currentBF) / (startingBF - targetBF)) * 100)));

  // Program timeline calculation
  const programDurationWeeks = program?.duration_weeks || 12;
  const startDay = program?.start_date ? new Date(program.start_date) : new Date();
  
  // Format dates: Apr 8, Jul 28
  const formatDateString = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const timelineStart = formatDateString(startDay);
  const timelineEnd = formatDateString(new Date(startDay.getTime() + programDurationWeeks * 7 * 24 * 60 * 60 * 1000));
  
  // Current week
  const diffTime = Math.abs(new Date().getTime() - startDay.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const currentWeekNum = Math.min(programDurationWeeks, Math.max(1, Math.ceil(diffDays / 7)));

  // Target calories
  const targetCalories = program?.target_calories || 1800;

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuote(true);
    try {
      const res = await fetch('/api/user/update-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, quote: newQuoteInput }),
      });
      if (res.ok) {
        setQuote(newQuoteInput);
        setShowEditQuote(false);
      } else {
        alert('Quote update failed.');
      }
    } catch (err) {
      alert('Error updating quote.');
    } finally {
      setSavingQuote(false);
    }
  };

  // Generic Save Daily Log function
  const saveDailyStats = async (updatedWeight?: number, updatedSteps?: number, updatedHabits?: {
    sunlight?: boolean;
    water?: boolean;
    noPhone?: boolean;
    supps?: boolean;
  }) => {
    setSavingLog(true);
    setSaveSuccess(false);

    const wVal = updatedWeight !== undefined ? updatedWeight : weightValue;
    const sVal = updatedSteps !== undefined ? updatedSteps : stepsValue;

    const habitSunlight = updatedHabits?.sunlight !== undefined ? updatedHabits.sunlight : sunlight;
    const habitWater = updatedHabits?.water !== undefined ? updatedHabits.water : water;
    const habitNoPhone = updatedHabits?.noPhone !== undefined ? updatedHabits.noPhone : noPhone;
    const habitSupps = updatedHabits?.supps !== undefined ? updatedHabits.supps : supps;

    try {
      const res = await fetch('/api/user/save-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          date: todayStr,
          bodyWeight: wVal,
          steps: sVal,
          toilet: habitSunlight ? 1 : 0, // Sunlight maps to toilet
          water3l: habitWater ? 1 : 0, // Water
          bedPhoneFilter: habitNoPhone ? 1 : 0, // No phone
          omega3: habitSupps ? 1 : 0, // Supps
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);

        // Dynamically update recent weights chart state
        const todayLabel = `${new Date().getMonth() + 1}/${new Date().getDate()}`;
        setChartDates(prev => {
          if (prev.length > 0 && prev[prev.length - 1] === todayLabel) {
            return prev;
          }
          return [...prev, todayLabel];
        });
        setChartWeights(prev => {
          if (prev.length > 0 && chartDates[chartDates.length - 1] === todayLabel) {
            const updated = [...prev];
            updated[updated.length - 1] = wVal;
            return updated;
          }
          return [...prev, wVal];
        });
      }
    } catch (err) {
      console.error('Error logging daily tracker:', err);
    } finally {
      setSavingLog(false);
    }
  };

  const toggleHabit = (type: 'sunlight' | 'water' | 'noPhone' | 'supps') => {
    let nextSunlight = sunlight;
    let nextWater = water;
    let nextNoPhone = noPhone;
    let nextSupps = supps;

    if (type === 'sunlight') {
      nextSunlight = !sunlight;
      setSunlight(nextSunlight);
    } else if (type === 'water') {
      nextWater = !water;
      setWater(nextWater);
    } else if (type === 'noPhone') {
      nextNoPhone = !noPhone;
      setNoPhone(nextNoPhone);
    } else if (type === 'supps') {
      nextSupps = !supps;
      setSupps(nextSupps);
    }

    saveDailyStats(undefined, undefined, {
      sunlight: nextSunlight,
      water: nextWater,
      noPhone: nextNoPhone,
      supps: nextSupps,
    });
  };

  const adjustWeight = (diff: number) => {
    const newVal = Math.round((weightValue + diff) * 10) / 10;
    setWeightValue(newVal);
  };

  const adjustSteps = (diff: number) => {
    const newVal = Math.max(0, stepsValue + diff);
    setStepsValue(newVal);
    saveDailyStats(undefined, newVal);
  };

  const activeHabitsCount = [sunlight, water, noPhone, supps].filter(Boolean).length;

  const chartData = {
    labels: chartDates.length > 0 ? chartDates : ['No Data'],
    datasets: [
      {
        label: 'Weight (kg)',
        data: chartWeights.length > 0 ? chartWeights : [0],
        borderColor: '#5f827d',
        backgroundColor: 'rgba(95, 130, 125, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(95, 130, 125, 0.05)' },
        ticks: { color: '#83928f', font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#83928f', font: { size: 10 } },
      },
    },
  };

  return (
    <div style={{ background: '#fbfbf8', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* Mobile Frame Container */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {isAdminViewing && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '15px', fontSize: '0.9rem', width: '100%' }}>
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> Viewing {username}&apos;s dashboard.
            <Link href={`/admin/client-view?id=${targetUserId}`} style={{ color: '#ef4444', textDecoration: 'underline', display: 'block', marginTop: '0.5rem', fontWeight: 'bold' }}>
              Back to Client List
            </Link>
          </div>
        )}

        {/* 1. Motivation Quote Section */}
        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 600, color: '#8a7b61', lineHeight: '1.4', margin: 0, paddingRight: '2rem' }}>
            “ {quote}
          </p>
          <button
            onClick={() => {
              setNewQuoteInput(quote);
              setShowEditQuote(!showEditQuote);
            }}
            style={{ position: 'absolute', top: '2px', right: 0, background: 'none', border: 'none', color: '#b2bda8', cursor: 'pointer' }}
          >
            <i className="ph ph-pencil-simple" style={{ fontSize: '1.1rem' }}></i>
          </button>

          {showEditQuote && (
            <form onSubmit={handleUpdateQuote} style={{ marginTop: '10px', display: 'flex', gap: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '10px', border: '1px solid #e6eae8' }}>
              <input
                type="text"
                value={newQuoteInput}
                onChange={(e) => setNewQuoteInput(e.target.value)}
                style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.9rem' }}
                placeholder="Edit your motivation quote..."
                required
              />
              <button type="submit" disabled={savingQuote} style={{ background: '#5f827d', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                {savingQuote ? 'Saving...' : 'Save'}
              </button>
            </form>
          )}
        </div>

        {/* 2. Profile Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {/* Circle Avatar with Body Fat Badge */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ceddd9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <i className="ph ph-user" style={{ fontSize: '1.8rem', color: '#5f827d' }}></i>
              </div>
              <div style={{ position: 'absolute', bottom: '-2px', right: '-4px', background: '#d97706', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '50px', border: '2px solid #fbfbf8' }}>
                {profile?.body_fat_percent ? `${profile.body_fat_percent}%` : '20%'}
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#83928f', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                PROJECT PEAK · 空
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1c2b29', margin: '0.1rem 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {username}
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#83928f' }}>
                  {profile?.age ? `, ${profile.age}` : ''}
                </span>
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#83928f', fontWeight: 600 }}>
                {timelineStart} <span style={{ color: '#b2bda8', margin: '0 0.2rem' }}>→</span> <span style={{ color: '#1c2b29', fontWeight: 700 }}>Week {currentWeekNum}/{programDurationWeeks}</span> <span style={{ color: '#b2bda8', margin: '0 0.2rem' }}>→</span> {timelineEnd}
              </div>
            </div>
          </div>

          {/* Streak Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#fef3c7', padding: '0.4rem 0.7rem', borderRadius: '50px', border: '1px solid #fde68a' }}>
            <i className="ph ph-flame" style={{ fontSize: '1.25rem', color: '#d97706' }}></i>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#b45309' }}>{streak}</span>
          </div>
        </div>

        {/* 3. Body Fat Progress Bar */}
        <div style={{ background: '#f3f5f0', borderRadius: '18px', padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e6eae8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>{startingBF}%</span>
            <span style={{ fontSize: '0.75rem', color: '#b2bda8' }}>→</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#5f827d' }}>~{currentBF}%</span>
            <span style={{ fontSize: '0.75rem', color: '#b2bda8' }}>→</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>{targetBF}%</span>
          </div>
          
          <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '50px', overflow: 'hidden' }}>
            <div style={{ width: `${bfProgressPercent}%`, height: '100%', background: '#5f827d', borderRadius: '50px', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#83928f', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: '-0.4rem' }}>
          LOG RIGHT HERE · NO TAPPING IN
        </div>

        {/* 4. Weight Logging Card */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)', position: 'relative' }}>
          {saveSuccess && (
            <div style={{ position: 'absolute', top: '10px', right: '15px', color: '#22c55e', fontSize: '0.75rem', fontWeight: 700, background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '5px', border: '1px solid #bbf7d0', animation: 'fadeIn 0.2s' }}>
              ✓ Saved Progress
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#1c2b29' }}>
              <i className="ph ph-scale" style={{ color: '#5f827d', fontSize: '1.3rem' }}></i>
              <span>Weight</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#83928f', fontWeight: 600 }}>
              yesterday {yesterdayWeight !== null ? `${yesterdayWeight} kg` : '--'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            {/* Minus button */}
            <button
              onClick={() => adjustWeight(-0.1)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f7f5', border: '1px solid #cbd5e1', color: '#1c2b29', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
            >
              -
            </button>

            {/* Weight display */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1c2b29', letterSpacing: '-0.5px' }}>
                {weightValue.toFixed(1)}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#83928f' }}>kg</span>
            </div>

            {/* Plus button */}
            <button
              onClick={() => adjustWeight(0.1)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f5f7f5', border: '1px solid #cbd5e1', color: '#1c2b29', fontSize: '1.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
            >
              +
            </button>

            {/* Log / Save button */}
            <button
              onClick={() => saveDailyStats(weightValue)}
              disabled={savingLog}
              style={{ background: '#5f827d', color: '#fff', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {savingLog ? '...' : 'Log'}
            </button>
          </div>
        </div>

        {/* 5. Today's Workout Widget */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#1c2b29', marginBottom: '0.3rem' }}>
            <i className="ph ph-barbell" style={{ color: '#f97316', fontSize: '1.3rem' }}></i>
            <span>Today: {schedule?.split_name || 'Rest Day'}</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#83928f', fontWeight: 600, marginBottom: '1.2rem' }}>
            {schedule?.is_rest === 1 
              ? 'Enjoy your recovery time' 
              : 'You scheduled this · 7:00am · ~45 min'}
          </div>

          <Link
            href={`/user/workout${clientQuery}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#1c2b29', color: '#fff', textDecoration: 'none', padding: '1rem', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 700, textAlign: 'center', transition: 'background 0.2s' }}
          >
            {schedule?.is_rest === 1 ? 'Go to Recovery Details' : '▶ Start workout'}
          </Link>
        </div>

        {/* 6. Nutrition Widget (Calorie summary) */}
        <Link href={`/user/diet${clientQuery}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#1c2b29' }}>
                <i className="ph ph-apple-logo" style={{ color: '#22c55e', fontSize: '1.3rem' }}></i>
                <span>Nutrition</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#83928f', fontWeight: 700 }}>
                {eatenMealsCount} of {totalMealsCount} meals
              </div>
            </div>

            {/* Consumed / Target Calories info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1c2b29' }}>{consumedCalories}</span>
                <span style={{ fontSize: '0.9rem', color: '#83928f', fontWeight: 600 }}>/ {targetCalories} kcal</span>
              </div>
              
              {/* Macros summary */}
              <div style={{ fontSize: '0.8rem', color: '#83928f', fontWeight: 700 }}>
                {consumedProtein}p · {consumedCarbs}c · {consumedFat}f
              </div>
            </div>

            {/* Calories Progress Bar */}
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '50px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((consumedCalories / targetCalories) * 100))}%`, height: '100%', background: '#22c55e', borderRadius: '50px', transition: 'width 0.5s ease' }}></div>
            </div>
            
            {/* Calories remaining helper */}
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#83928f', textAlign: 'left', fontStyle: 'italic', fontWeight: 600 }}>
              {targetCalories - consumedCalories > 0 
                ? `${targetCalories - consumedCalories} kcal remaining to hit goal` 
                : 'Calories goal achieved!'}
            </div>
          </div>
        </Link>

        {/* 7. Habits Widget */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 800, color: '#1c2b29' }}>
              <i className="ph ph-check-circle" style={{ color: '#5f827d', fontSize: '1.3rem' }}></i>
              <span>Habits</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#83928f', fontWeight: 700 }}>
              {activeHabitsCount} of 4
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {/* Sunlight */}
            <button
              onClick={() => toggleHabit('sunlight')}
              style={{
                background: sunlight ? '#edf4f2' : '#ffffff',
                border: sunlight ? '2px solid #5f827d' : '1px solid #e6eae8',
                borderRadius: '14px',
                padding: '0.8rem 0.3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <i className={sunlight ? "ph ph-check-circle" : "ph ph-sun"} style={{ fontSize: '1.3rem', color: sunlight ? '#5f827d' : '#83928f' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sunlight ? '#1c2b29' : '#83928f' }}>Sunlight</span>
            </button>

            {/* Water */}
            <button
              onClick={() => toggleHabit('water')}
              style={{
                background: water ? '#edf4f2' : '#ffffff',
                border: water ? '2px solid #5f827d' : '1px solid #e6eae8',
                borderRadius: '14px',
                padding: '0.8rem 0.3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="ph ph-drop" style={{ fontSize: '1.3rem', color: water ? '#0ea5e9' : '#83928f' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: water ? '#1c2b29' : '#83928f' }}>Water</span>
            </button>

            {/* No phone */}
            <button
              onClick={() => toggleHabit('noPhone')}
              style={{
                background: noPhone ? '#edf4f2' : '#ffffff',
                border: noPhone ? '2px solid #5f827d' : '1px solid #e6eae8',
                borderRadius: '14px',
                padding: '0.8rem 0.3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="ph ph-phone-slash" style={{ fontSize: '1.3rem', color: noPhone ? '#ef4444' : '#83928f' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: noPhone ? '#1c2b29' : '#83928f' }}>No phone</span>
            </button>

            {/* Supps */}
            <button
              onClick={() => toggleHabit('supps')}
              style={{
                background: supps ? '#edf4f2' : '#ffffff',
                border: supps ? '2px solid #5f827d' : '1px solid #e6eae8',
                borderRadius: '14px',
                padding: '0.8rem 0.3rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="ph ph-pill" style={{ fontSize: '1.3rem', color: supps ? '#8b5cf6' : '#83928f' }}></i>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: supps ? '#1c2b29' : '#83928f' }}>Supps</span>
            </button>
          </div>
        </div>

        {/* 8. Two Columns Steps & Calories Widget */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Steps Card */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.2rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>
              <i className="ph ph-footprints" style={{ fontSize: '1.1rem', color: '#5f827d' }}></i>
              <span>Steps</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1c2b29', margin: '0.1rem 0' }}>
              {stepsValue.toLocaleString()}
            </div>
            
            {/* Step Increment buttons */}
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
              <button
                onClick={() => adjustSteps(-1000)}
                style={{ flex: 1, padding: '0.3rem 0', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1c2b29', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                -1k
              </button>
              <button
                onClick={() => adjustSteps(1000)}
                style={{ flex: 1, padding: '0.3rem 0', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1c2b29', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                +1k
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#b2bda8', fontWeight: 600 }}>auto-synced</div>
          </div>

          {/* Calories Target Card */}
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.2rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>
              <i className="ph ph-flame" style={{ fontSize: '1.1rem', color: '#d97706' }}></i>
              <span>Calories</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1c2b29', margin: '0.1rem 0' }}>
              {targetCalories.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 700 }}>eat the plan</div>
          </div>
        </div>

        {/* 9. Historical Weight Chart Widget */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1c2b29', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="ph ph-trend-up" style={{ color: '#5f827d' }}></i> Weight Progress (14 Days)
          </h3>
          <div style={{ height: '180px', position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* 10. Sticky Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e6eae8', padding: '0.6rem 0', zIndex: 1000 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {/* Home Tab */}
          <Link href={`/user/dashboard${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#1c2b29' }}>
            <i className="ph ph-house" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Home</span>
          </Link>

          {/* Progress Tab */}
          <Link href={`/user/daily-log${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-chart-line-up" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Progress</span>
          </Link>

          {/* Learn (Diet) Tab */}
          <Link href={`/user/diet${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-book-open" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Learn</span>
          </Link>

          {/* Climb (Workout) Tab */}
          <Link href={`/user/workout${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-mountains" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Climb</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
