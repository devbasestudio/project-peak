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
  targetUserId: string;
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
    <div className="app-page">
      <div className="app-container">
        
        {isAdminViewing && (
          <div className="alert alert-danger">
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> Viewing {username}&apos;s dashboard.
            <Link href={`/admin/client-view?id=${targetUserId}`} style={{ color: '#ef4444', textDecoration: 'underline', display: 'block', marginTop: '0.5rem', fontWeight: 'bold' }}>
              Back to Client List
            </Link>
          </div>
        )}

        {/* 1. Motivation Quote */}
        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
          <p className="quote-text" style={{ paddingRight: '2rem' }}>
            \u201c {quote}
          </p>
          <button
            onClick={() => { setNewQuoteInput(quote); setShowEditQuote(!showEditQuote); }}
            className="quote-edit-btn"
            style={{ position: 'absolute', top: '2px', right: 0 }}
          >
            <i className="ph ph-pencil-simple" style={{ fontSize: '1.1rem' }}></i>
          </button>
          {showEditQuote && (
            <form onSubmit={handleUpdateQuote} style={{ marginTop: '10px', display: 'flex', gap: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '10px', border: '1px solid #e6eae8' }}>
              <input type="text" value={newQuoteInput} onChange={(e) => setNewQuoteInput(e.target.value)} className="input-app" style={{ flex: 1, padding: '0.4rem 0.6rem' }} placeholder="Edit your motivation quote..." required />
              <button type="submit" disabled={savingQuote} className="btn-app btn-teal" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                {savingQuote ? 'Saving...' : 'Save'}
              </button>
            </form>
          )}
        </div>

        {/* 2. Profile Header */}
        <div className="profile-header">
          <div className="profile-info">
            <div className="profile-avatar">
              <div className="profile-avatar-circle">
                <i className="ph ph-user"></i>
              </div>
              <div className="badge-bf" style={{ position: 'absolute', bottom: '-2px', right: '-4px' }}>
                {profile?.body_fat_percent ? `${profile.body_fat_percent}%` : '20%'}
              </div>
            </div>
            <div className="profile-meta">
              <div className="profile-brand">PROJECT PEAK · 空</div>
              <h2 className="profile-name">
                {username}
                <span className="profile-name-age">{profile?.age ? `, ${profile.age}` : ''}</span>
              </h2>
              <div className="profile-timeline">
                {timelineStart} <span className="profile-timeline-arrow">→</span> <span className="profile-timeline-current">Week {currentWeekNum}/{programDurationWeeks}</span> <span className="profile-timeline-arrow">→</span> {timelineEnd}
              </div>
            </div>
          </div>
          <div className="badge badge-streak" style={{ padding: '0.4rem 0.7rem' }}>
            <i className="ph ph-flame" style={{ fontSize: '1.25rem' }}></i>
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{streak}</span>
          </div>
        </div>

        {/* 3. Body Fat Progress */}
        <div className="bf-bar">
          <div className="bf-values">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>{startingBF}%</span>
            <span style={{ fontSize: '0.75rem', color: '#b2bda8' }}>→</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#5f827d' }}>~{currentBF}%</span>
            <span style={{ fontSize: '0.75rem', color: '#b2bda8' }}>→</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>{targetBF}%</span>
          </div>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-fill progress-teal" style={{ width: `${bfProgressPercent}%` }}></div>
          </div>
        </div>

        <div className="section-label">LOG RIGHT HERE · NO TAPPING IN</div>

        {/* 4. Weight Logging Card */}
        <div className="card" style={{ position: 'relative' }}>
          {saveSuccess && <div className="badge-save" style={{ position: 'absolute', top: '10px', right: '15px' }}>✓ Saved Progress</div>}
          <div className="card-header">
            <div className="card-title">
              <i className="ph ph-scale" style={{ color: '#5f827d' }}></i>
              <span>Weight</span>
            </div>
            <div className="card-subtitle">yesterday {yesterdayWeight !== null ? `${yesterdayWeight} kg` : '--'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <button onClick={() => adjustWeight(-0.1)} className="btn-circle">-</button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span className="card-value-lg">{weightValue.toFixed(1)}</span>
              <span className="card-value-unit">kg</span>
            </div>
            <button onClick={() => adjustWeight(0.1)} className="btn-circle">+</button>
            <button onClick={() => saveDailyStats(weightValue)} disabled={savingLog} className="btn-app btn-teal" style={{ width: 'auto', padding: '0.75rem 1.4rem', minWidth: '70px' }}>
              {savingLog ? '...' : 'Log'}
            </button>
          </div>
        </div>

        {/* 5. Today's Workout */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '0.3rem' }}>
            <i className="ph ph-barbell" style={{ color: '#f97316' }}></i>
            <span>Today: {schedule?.split_name || 'Rest Day'}</span>
          </div>
          <div className="card-subtitle" style={{ marginBottom: '1.2rem' }}>
            {schedule?.is_rest === 1 ? 'Enjoy your recovery time' : 'You scheduled this · 7:00am · ~45 min'}
          </div>
          <Link href={`/user/workout${clientQuery}`} className="btn-app btn-dark">
            {schedule?.is_rest === 1 ? 'Go to Recovery Details' : '▶ Start workout'}
          </Link>
        </div>

        {/* 6. Nutrition Widget */}
        <Link href={`/user/diet${clientQuery}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div className="card card-interactive">
            <div className="card-header" style={{ marginBottom: '0.8rem' }}>
              <div className="card-title">
                <i className="ph ph-apple-logo" style={{ color: '#22c55e' }}></i>
                <span>Nutrition</span>
              </div>
              <div className="card-subtitle" style={{ fontWeight: 700 }}>{eatenMealsCount} of {totalMealsCount} meals</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1c2b29' }}>{consumedCalories}</span>
                <span style={{ fontSize: '0.9rem', color: '#83928f', fontWeight: 600 }}>/ {targetCalories} kcal</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#83928f', fontWeight: 700 }}>{consumedProtein}p · {consumedCarbs}c · {consumedFat}f</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill progress-green" style={{ width: `${Math.min(100, Math.round((consumedCalories / targetCalories) * 100))}%` }}></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#83928f', fontStyle: 'italic', fontWeight: 600 }}>
              {targetCalories - consumedCalories > 0 ? `${targetCalories - consumedCalories} kcal remaining to hit goal` : 'Calories goal achieved!'}
            </div>
          </div>
        </Link>

        {/* 7. Habits */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.2rem' }}>
            <div className="card-title">
              <i className="ph ph-check-circle" style={{ color: '#5f827d' }}></i>
              <span>Habits</span>
            </div>
            <div className="card-subtitle" style={{ fontWeight: 700 }}>{activeHabitsCount} of 4</div>
          </div>
          <div className="habits-grid">
            <button onClick={() => toggleHabit('sunlight')} className={`habit-btn ${sunlight ? 'active' : ''}`}>
              <i className={sunlight ? "ph ph-check-circle" : "ph ph-sun"} style={{ fontSize: '1.3rem', color: sunlight ? '#5f827d' : '#83928f' }}></i>
              <span className="habit-label">Sunlight</span>
            </button>
            <button onClick={() => toggleHabit('water')} className={`habit-btn ${water ? 'active' : ''}`}>
              <i className="ph ph-drop" style={{ fontSize: '1.3rem', color: water ? '#0ea5e9' : '#83928f' }}></i>
              <span className="habit-label">Water</span>
            </button>
            <button onClick={() => toggleHabit('noPhone')} className={`habit-btn ${noPhone ? 'active' : ''}`}>
              <i className="ph ph-phone-slash" style={{ fontSize: '1.3rem', color: noPhone ? '#ef4444' : '#83928f' }}></i>
              <span className="habit-label">No phone</span>
            </button>
            <button onClick={() => toggleHabit('supps')} className={`habit-btn ${supps ? 'active' : ''}`}>
              <i className="ph ph-pill" style={{ fontSize: '1.3rem', color: supps ? '#8b5cf6' : '#83928f' }}></i>
              <span className="habit-label">Supps</span>
            </button>
          </div>
        </div>

        {/* 8. Steps & Calories Grid */}
        <div className="grid-2">
          <div className="card card-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>
              <i className="ph ph-footprints" style={{ fontSize: '1.1rem', color: '#5f827d' }}></i>
              <span>Steps</span>
            </div>
            <div className="card-value" style={{ margin: '0.1rem 0' }}>{stepsValue.toLocaleString()}</div>
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
              <button onClick={() => adjustSteps(-1000)} className="btn-circle" style={{ width: 'auto', height: 'auto', flex: 1, padding: '0.3rem 0', borderRadius: '8px', fontSize: '0.75rem' }}>-1k</button>
              <button onClick={() => adjustSteps(1000)} className="btn-circle" style={{ width: 'auto', height: 'auto', flex: 1, padding: '0.3rem 0', borderRadius: '8px', fontSize: '0.75rem' }}>+1k</button>
            </div>
            <div className="label-muted" style={{ fontSize: '0.7rem', color: '#b2bda8' }}>auto-synced</div>
          </div>
          <div className="card card-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: '#83928f' }}>
              <i className="ph ph-flame" style={{ fontSize: '1.1rem', color: '#d97706' }}></i>
              <span>Calories</span>
            </div>
            <div className="card-value" style={{ margin: '0.1rem 0' }}>{targetCalories.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 700 }}>eat the plan</div>
          </div>
        </div>

        {/* 9. Weight Chart */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            <i className="ph ph-trend-up" style={{ color: '#5f827d' }}></i> Weight Progress (14 Days)
          </h3>
          <div style={{ height: '180px', position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* 10. Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          <Link href={`/user/dashboard${clientQuery}`} className="bottom-nav-item active">
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
          <Link href={`/user/workout${clientQuery}`} className="bottom-nav-item">
            <i className="ph ph-mountains"></i>
            <span>Climb</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
