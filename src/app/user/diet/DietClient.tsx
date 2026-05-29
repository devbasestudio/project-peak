"use client";

import { useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';

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
  const [completedIds, setCompletedIds] = useState<number[]>(initialCompletedItemIds);
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});

  const mealGroups: Record<string, NutritionItem[]> = {
    breakfast: [], lunch: [], snack: [], dinner: [], evening: [],
  };
  nutritionItems.forEach((item) => {
    if (mealGroups[item.meal_type]) mealGroups[item.meal_type].push(item);
  });

  const mealTypeInfo: Record<string, { label: string; icon: string; color: string }> = {
    breakfast: { label: 'Breakfast (မနက်စာ)', icon: 'ph ph-egg', color: '#f59e0b' },
    lunch: { label: 'Lunch (နေ့လယ်စာ)', icon: 'ph ph-bowl-food', color: '#10b981' },
    snack: { label: 'Snack (မုန့်ပဲသရေစာ)', icon: 'ph ph-apple-logo', color: '#8b5cf6' },
    dinner: { label: 'Dinner (ညစာ)', icon: 'ph ph-fork-knife', color: '#3b82f6' },
    evening: { label: 'Evening (ညဉ့်နက်စာ / Shake)', icon: 'ph ph-pill', color: '#6366f1' },
  };

  const handleToggleMeal = async (itemId: number) => {
    const isCompleted = completedIds.includes(itemId);
    const nextCompleted = isCompleted
      ? completedIds.filter((id) => id !== itemId)
      : [...completedIds, itemId];

    setCompletedIds(nextCompleted);
    setSavingIds((prev) => ({ ...prev, [itemId]: true }));

    try {
      const res = await fetch('/api/user/save-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date: todayStr, nutritionItemId: itemId, completed: !isCompleted }),
      });
      if (!res.ok) {
        setCompletedIds(completedIds);
        alert('Failed to update meal log.');
      }
    } catch {
      setCompletedIds(completedIds);
      alert('Network error logging meal.');
    } finally {
      setSavingIds((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  let consumedCalories = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
  nutritionItems.forEach((item) => {
    if (completedIds.includes(item.id)) {
      consumedCalories += item.calories;
      consumedProtein += parseFloat(item.protein_g);
      consumedCarbs += parseFloat(item.carbs_g);
      consumedFat += parseFloat(item.fat_g);
    }
  });

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
    <div className="min-h-screen bg-[#f8f8f5] pb-24 text-[#1c2b29]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-5 p-6">

        {isAdminViewing && (
          <div className="rounded-[15px] border border-[#ef4444] bg-[#fee2e2] p-4 text-[0.9rem] font-semibold text-[#b91c1c]">
            <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> Managing client&apos;s diet completion logs.
          </div>
        )}

        <h2 className="flex items-center gap-2 text-[1.3rem] font-extrabold text-[#1c2b29]">
          <i className="ph ph-fork-knife text-[1.3rem] text-[#22c55e]"></i> Meal Log (အစားအသောက် မှတ်တမ်း)
        </h2>
        <p className="-mt-3 text-[0.9rem] text-[#83928f]">
          ယနေ့စားသုံးပြီးသော အစားအစာများကို ရွေးချယ်ပေးပါ
        </p>

        {/* Macro Summary Card */}
        <div className="rounded-[20px] border border-[#e6eae8] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
          <div className="mb-4 text-center">
            <span className="text-[0.82rem] font-semibold text-[#83928f]">Calories Consumed Today</span>
            <div className="my-1 text-[2.5rem] font-black text-[#22c55e]">
              {consumedCalories} <span className="text-base font-medium text-[#83928f]">/ {targetCalories} kcal</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div className="h-full rounded-full bg-[#22c55e] transition-all duration-500" style={{ width: `${Math.min(100, Math.round((consumedCalories / targetCalories) * 100))}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[#e6eae8] pt-3 text-center">
            <div>
              <div className="text-[0.75rem] font-semibold text-[#83928f]">Protein</div>
              <div className="text-[1.15rem] font-black text-[#1c2b29]">{Math.round(consumedProtein)}g <span className="text-[0.75rem] font-medium text-[#83928f]">/ {macrosP}g</span></div>
            </div>
            <div>
              <div className="text-[0.75rem] font-semibold text-[#83928f]">Carbs</div>
              <div className="text-[1.15rem] font-black text-[#1c2b29]">{Math.round(consumedCarbs)}g <span className="text-[0.75rem] font-medium text-[#83928f]">/ {macrosC}g</span></div>
            </div>
            <div>
              <div className="text-[0.75rem] font-semibold text-[#83928f]">Fat</div>
              <div className="text-[1.15rem] font-black text-[#1c2b29]">{Math.round(consumedFat)}g <span className="text-[0.75rem] font-medium text-[#83928f]">/ {macrosF}g</span></div>
            </div>
          </div>
        </div>

        {/* Meal Sections */}
        {Object.keys(mealTypeInfo).map((mealType) => {
          const items = mealGroups[mealType];
          if (!items || items.length === 0) return null;
          const info = mealTypeInfo[mealType];

          return (
            <div key={mealType} className="overflow-hidden rounded-[20px] border border-[#e6eae8] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
              <div className="flex items-center justify-between border-b border-[#e6eae8] bg-[#f5f7f5] px-5 py-[0.8rem]">
                <div className="flex items-center gap-2 text-[0.95rem] font-extrabold text-[#1c2b29]">
                  <i className={`${info.icon} text-[1.3rem]`} style={{ color: info.color }}></i>
                  <span>{info.label}</span>
                </div>
              </div>

              <div className="flex flex-col">
                {items.map((item) => {
                  const isChecked = completedIds.includes(item.id);
                  const isSaving = savingIds[item.id];

                  return (
                    <div key={item.id} className="flex flex-col gap-[0.6rem] border-b border-[#f5f7f5] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleMeal(item.id)}
                            disabled={isSaving}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-all ${
                              isChecked ? 'border-[#22c55e] bg-[#22c55e]' : 'border-[#cbd5e1] bg-white'
                            }`}
                          >
                            {isChecked && <i className="ph ph-check text-base font-bold text-white"></i>}
                          </button>

                          <div className="flex flex-col">
                            <span className={`text-[0.95rem] font-bold text-[#1c2b29] ${isChecked ? 'line-through' : ''}`}>
                              {item.food_name}
                            </span>
                            {item.food_name_mm && (
                              <span className="mt-[0.1rem] text-[0.8rem] italic text-[#83928f]">{item.food_name_mm}</span>
                            )}
                            {item.portion && (
                              <span className="mt-[0.2rem] text-[0.8rem] font-semibold text-[#83928f]">Portion: {item.portion}</span>
                            )}
                          </div>
                        </div>

                        <div className="min-w-[70px] text-right">
                          <span className="text-base font-black text-[#22c55e]">
                            {item.calories} <span className="text-[0.75rem] font-medium text-[#83928f]">kcal</span>
                          </span>
                          <div className="mt-[0.2rem] flex justify-end gap-2 text-[0.75rem] font-bold text-[#83928f]">
                            {Math.round(parseFloat(item.protein_g))}p · {Math.round(parseFloat(item.carbs_g))}c · {Math.round(parseFloat(item.fat_g))}f
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border-l-[3px] bg-[#fcfcfb] p-[0.8rem] text-[0.8rem] leading-relaxed text-[#64748b]" style={{ borderLeftColor: info.color }}>
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

      <BottomNav active="learn" clientQuery={clientQuery} />
    </div>
  );
}
