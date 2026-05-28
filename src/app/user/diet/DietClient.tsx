"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface NutritionItem {
  id: number;
  program_type: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'evening';
  food_name: string;
  food_name_mm: string | null;
  portion: string | null;
  calories: number;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  benefits_text: string | null;
  sort_order: number;
}

interface DietClientProps {
  userId: string;
  isAdminViewing: boolean;
  clientQuery: string;
  targetCalories: number;
  macrosP: number;
  macrosC: number;
  macrosF: number;
  nutritionItems: NutritionItem[];
  initialCompletedItemIds: number[];
  todayStr: string;
}

export default function DietClient({
  userId,
  isAdminViewing,
  clientQuery,
  targetCalories,
  macrosP,
  macrosC,
  macrosF,
  nutritionItems,
  initialCompletedItemIds,
  todayStr,
}: DietClientProps) {
  // Store completed meal IDs in state
  const [completedIds, setCompletedIds] = useState<number[]>(initialCompletedItemIds);
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});

  // Group items by meal_type
  const mealGroups: Record<string, NutritionItem[]> = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
    evening: []
  };

  nutritionItems.forEach((item) => {
    const type = item.meal_type;
    if (mealGroups[type]) {
      mealGroups[type].push(item);
    }
  });

  const mealTypeInfo: Record<string, { label: string, icon: string, color: string }> = {
    breakfast: { label: 'Breakfast (မနက်စာ)', icon: 'ph ph-egg', color: '#f59e0b' },
    lunch: { label: 'Lunch (နေ့လယ်စာ)', icon: 'ph ph-bowl-food', color: '#10b981' },
    snack: { label: 'Snack (မုန့်ပဲသရေစာ)', icon: 'ph ph-apple-logo', color: '#8b5cf6' },
    dinner: { label: 'Dinner (ညစာ)', icon: 'ph ph-fork-knife', color: '#3b82f6' },
    evening: { label: 'Evening (ညဉ့်နက်စာ / Shake)', icon: 'ph ph-pill', color: '#6366f1' },
  };

  // Toggle meal completion
  const handleToggleMeal = async (itemId: number) => {
    const isCompleted = completedIds.includes(itemId);
    const nextCompleted = isCompleted
      ? completedIds.filter(id => id !== itemId)
      : [...completedIds, itemId];

    // Optimistically update
    setCompletedIds(nextCompleted);
    setSavingIds(prev => ({ ...prev, [itemId]: true }));

    try {
      const res = await fetch('/api/user/save-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: todayStr,
          nutritionItemId: itemId,
          completed: !isCompleted,
        }),
      });

      if (!res.ok) {
        // Revert on error
        setCompletedIds(completedIds);
        alert('Failed to update meal log.');
      }
    } catch (err) {
      setCompletedIds(completedIds);
      alert('Network error logging meal.');
    } finally {
      setSavingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Calculate dynamic calories and macros consumed based on checked list
  let consumedCalories = 0;
  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFat = 0;

  nutritionItems.forEach(item => {
    if (completedIds.includes(item.id)) {
      consumedCalories += item.calories;
      consumedProtein += parseFloat(item.protein_g);
      consumedCarbs += parseFloat(item.carbs_g);
      consumedFat += parseFloat(item.fat_g);
    }
  });

  // Nutritionist advice in Burmese for standard items
  const getNutritionistProAdvice = (foodName: string): string => {
    const lower = foodName.toLowerCase();
    if (lower.includes('oatmeal') || lower.includes('oat')) {
      return "💡 Oats မှာ beta-glucan ခေါ်တဲ့ ပျော်ဝင်လွယ်တဲ့ အမျှင်ဓာတ်ကြွယ်ဝပြီး နှလုံးကျန်းမာရေးကို ကောင်းမွန်စေကာ သွေးတွင်းသကြားဓာတ်ကို ထိန်းညှိပေးပါတယ်။ အားကစားလုပ်နေစဉ် တစ်နေ့တာ ကစီဓာတ် (energy) ကို တဖြည်းဖြည်းချင်း ထုတ်လွှတ်ပေးလို့ အဆီကျပြီး ကြွက်သားတက်စေဖို့ အကောင်းဆုံး အစားအစာ ဖြစ်ပါတယ်။";
    }
    if (lower.includes('chicken') || lower.includes('breast')) {
      return "💡 ကြက်ရင်ပုံသားဟာ အဆီဓာတ် အနည်းဆုံးနဲ့ ပရိုတင်း (pure protein) အများဆုံး ရရှိစေတဲ့ အရင်းအမြစ် ဖြစ်ပါတယ်။ ကြွက်သားမျှင်တွေ ပြန်လည်တည်ဆောက် ပြုပြင်ဖို့အတွက် မရှိမဖြစ် လိုအပ်ပြီး ဇီဝကမ္မဖြစ်စဉ် (metabolism) ကို အားကောင်းစေပါတယ်။";
    }
    if (lower.includes('egg') || lower.includes('whites')) {
      return "💡 ကြက်ဥအဖြူသားဟာ ကယ်လိုရီ အလွန်နည်းပြီး Amino acids အပြည့်အဝပါဝင်တဲ့ အရည်အသွေးမြင့် ပရိုတင်း ဖြစ်ပါတယ်။ ကြက်ဥအနှစ်ဟာ ခန္ဓာကိုယ်အတွက် ကောင်းမွန်တဲ့ ကိုလက်စထရောနဲ့ ဗီတာမင် B, D တို့ကို ပံ့ပိုးပေးလို့ ဟော်မုန်းထုတ်လုပ်မှု စနစ်တကျ ဖြစ်စေဖို့ တစ်နေ့ကို ၁-၂ လုံး စားပေးသင့်ပါတယ်။";
    }
    if (lower.includes('yogurt')) {
      return "💡 Greek Yogurt မှာ ရိုးရိုးဒိန်ချဉ်ထက် ပရိုတင်း ၂ ဆ ပိုမိုပါဝင်ပြီး ဗိုက်ပြည့်လွယ်စေပါတယ်။ အူလမ်းကြောင်း ကျန်းမာရေးအတွက် အကျိုးပြု ဇီဝပိုးမွှားများ (probiotics) ကြွယ်ဝပြီး ကြွက်သားနာကျင်မှုကို မြန်မြန်ပျောက်ကင်းစေပါတယ်။";
    }
    if (lower.includes('fish') || lower.includes('tuna')) {
      return "💡 ငါးနဲ့ တူနာငါးတွေမှာ Omega-3 Fatty Acids အဆီဓာတ် အပြည့်အဝပါလို့ လေ့ကျင့်ခန်းပြင်းပြင်းထန်ထန် လုပ်ပြီးနောက် ဖြစ်တတ်တဲ့ အဆစ်အမြစ်နဲ့ ကြွက်သား ရောင်ရမ်းမှုတွေကို လျော့ကျစေပါတယ်။ နှလုံးနဲ့ ဦးနှောက် လုပ်ဆောင်မှုကို အလွန် အကျိုးပြုပါတယ်။";
    }
    if (lower.includes('sweet potato') || lower.includes('potato')) {
      return "💡 ကန်စွန်းဥဟာ အမျှင်ဓာတ်များပြီး Glycemic Index (GI) နည်းတဲ့အတွက် သွေးတွင်းသကြားဓာတ်ကို ရုတ်တရက် မတက်စေဘဲ လေ့ကျင့်ခန်း လုပ်စဉ် ကြွက်သား Glycogen ကို အချိန်အကြာကြီး ဖြည့်တင်းပေးနိုင်တဲ့ သဘာဝ ကစီဓာတ်ကောင်း ဖြစ်ပါတယ်။";
    }
    if (lower.includes('banana')) {
      return "💡 ငှက်ပျောသီးမှာ ပိုတက်စီယမ် (potassium) မြင့်မားစွာ ပါဝင်ပြီး လေ့ကျင့်ခန်း လုပ်စဉ် ကြွက်သားတက်ခြင်း၊ ဗိုက်အောင့်ခြင်း၊ ကြွက်တက်ခြင်းတို့ကို ကာကွယ်ပေးပြီး လျှင်မြန်စွာ စွမ်းအင် ပြန်လည်ရရှိစေပါတယ်။";
    }
    if (lower.includes('whey') || lower.includes('protein shake')) {
      return "💡 Whey Protein Shake ဟာ ခန္ဓာကိုယ်က အမြန်ဆုံး စုပ်ယူနိုင်တဲ့ ပရိုတင်းဖြစ်ပြီး ကာယလေ့ကျင့်ခန်း လုပ်ပြီးချင်း ကြွက်သားမျှင်တွေ ပျက်စီးမှုကို ချက်ချင်း ပြုပြင်တည်ဆောက်ပေးဖို့ အထိရောက်ဆုံး ဖြစ်ပါတယ်။";
    }
    return "💡 ဤအစားအစာသည် လိုအပ်သော အာဟာရဓာတ်များ ပြည့်ဝစွာ ပါဝင်ပြီး သင့်ကြံ့ခိုင်မှု ပန်းတိုင် (Fat loss / Muscle building) ကို အထောက်အကူ ဖြစ်စေရန် စနစ်တကျ ရွေးချယ်ထားခြင်း ဖြစ်ပါသည်။";
  };

  return (
    <div style={{ background: '#fbfbf8', minHeight: '100vh', paddingBottom: '7rem' }}>
      
      {/* Mobile Frame Container */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {isAdminViewing && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '15px', fontSize: '0.9rem' }}>
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> Managing client&apos;s diet completion logs.
          </div>
        )}

        <h2><i className="ph ph-fork-knife" style={{ color: '#22c55e' }}></i> Meal Log (အစားအသောက် မှတ်တမ်း)</h2>
        <p style={{ color: '#83928f', fontSize: '0.9rem', marginTop: '-0.8rem' }}>
          ယနေ့စားသုံးပြီးသော အစားအစာများကို ရွေးချယ်ပေးပါ (Check meals you ate today)
        </p>

        {/* Dynamic Macro Header Summary */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#83928f', fontWeight: 700 }}>Calories Consumed Today</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22c55e', margin: '0.2rem 0' }}>
              {consumedCalories} <span style={{ fontSize: '1rem', color: '#83928f', fontWeight: 500 }}>/ {targetCalories} kcal</span>
            </div>
            
            {/* Target vs Consumed progress bar */}
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '50px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{ width: `${Math.min(100, Math.round((consumedCalories / targetCalories) * 100))}%`, height: '100%', background: '#22c55e', borderRadius: '50px', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', paddingTop: '0.8rem', borderTop: '1px solid #e6eae8' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 700 }}>Protein</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1c2b29' }}>{Math.round(consumedProtein)}g <span style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 500 }}>/ {macrosP}g</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 700 }}>Carbs</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1c2b29' }}>{Math.round(consumedCarbs)}g <span style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 500 }}>/ {macrosC}g</span></div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 700 }}>Fat</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1c2b29' }}>{Math.round(consumedFat)}g <span style={{ fontSize: '0.75rem', color: '#83928f', fontWeight: 500 }}>/ {macrosF}g</span></div>
            </div>
          </div>
        </div>

        {/* Meal categories sections */}
        {Object.keys(mealTypeInfo).map((mealType) => {
          const items = mealGroups[mealType];
          if (!items || items.length === 0) return null;
          const info = mealTypeInfo[mealType];

          return (
            <div key={mealType} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e6eae8', boxShadow: '0 4px 12px rgba(0,0,0,0.015)', overflow: 'hidden' }}>
              {/* Category Header */}
              <div style={{ background: '#f5f7f5', padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e6eae8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1c2b29' }}>
                  <i className={info.icon} style={{ color: info.color, fontSize: '1.15rem' }}></i>
                  <span>{info.label}</span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item) => {
                  const isChecked = completedIds.includes(item.id);
                  const isSaving = savingIds[item.id];
                  
                  return (
                    <div key={item.id} style={{ padding: '1.2rem', borderBottom: '1px solid #f5f7f5', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                        
                        {/* Selector checkbox */}
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                          <button
                            onClick={() => handleToggleMeal(item.id)}
                            disabled={isSaving}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: isChecked ? 'none' : '2px solid #cbd5e1',
                              background: isChecked ? '#22c55e' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              marginTop: '2px',
                              transition: 'all 0.2s',
                            }}
                          >
                            {isChecked && <i className="ph ph-check" style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}></i>}
                          </button>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1c2b29', textDecoration: isChecked ? 'line-through' : 'none' }}>
                              {item.food_name}
                            </span>
                            {item.food_name_mm && (
                              <span style={{ fontSize: '0.85rem', color: '#83928f', fontStyle: 'italic', marginTop: '0.1rem' }}>
                                {item.food_name_mm}
                              </span>
                            )}
                            {item.portion && (
                              <span style={{ fontSize: '0.78rem', color: '#83928f', marginTop: '0.2rem', fontWeight: 600 }}>
                                Portion: {item.portion}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Calories info */}
                        <div style={{ textAlign: 'right', minWidth: '70px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#22c55e' }}>
                            {item.calories} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#83928f' }}>kcal</span>
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#83928f', marginTop: '0.2rem' }}>
                            {Math.round(parseFloat(item.protein_g))}p · {Math.round(parseFloat(item.carbs_g))}c · {Math.round(parseFloat(item.fat_g))}f
                          </div>
                        </div>
                      </div>

                      {/* Professional Certified Nutritionist Advice */}
                      <div style={{ background: '#fcfcfb', padding: '0.8rem', borderRadius: '12px', borderLeft: `3px solid ${info.color}`, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
                        {getNutritionistProAdvice(item.food_name)}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e6eae8', padding: '0.6rem 0', zIndex: 1000 }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <Link href={`/user/dashboard${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-house" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Home</span>
          </Link>
          <Link href={`/user/daily-log${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-chart-line-up" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Progress</span>
          </Link>
          <Link href={`/user/diet${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#22c55e' }}>
            <i className="ph ph-book-open" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Learn</span>
          </Link>
          <Link href={`/user/workout${clientQuery}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: '#83928f' }}>
            <i className="ph ph-mountains" style={{ fontSize: '1.4rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Climb</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
