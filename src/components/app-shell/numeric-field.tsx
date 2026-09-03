"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

export function NumericField({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix = "REPS",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  const normalize = (next: number) => Math.min(max, Math.max(min, step === 1 ? Math.round(next) : Math.round(next * 100) / 100));
  const commit = () => {
    const parsed = Number(draft);
    const next = draft.trim() === "" || !Number.isFinite(parsed) ? value : normalize(parsed);
    setDraft(String(next));
    onChange(next);
    setEditing(false);
  };
  const adjust = (amount: number) => {
    const parsed = editing ? Number(draft) : value;
    const next = normalize((Number.isFinite(parsed) ? parsed : value) + amount);
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-charcoal/12 bg-white">
      <label htmlFor={id} className="block border-b border-charcoal/8 px-3 py-2 text-center text-[10px] font-semibold text-charcoal/45">
        {label}
      </label>
      <div className="grid grid-cols-[48px_1fr_48px]">
        <button type="button" onClick={() => adjust(-step)} className="grid min-h-13 place-items-center border-r border-charcoal/10 bg-[#f4f6f5]" aria-label={`Decrease ${label}`}>
          <Minus size={17} />
        </button>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3">
          <input
            id={id}
            type="number"
            inputMode={step === 1 ? "numeric" : "decimal"}
            min={min}
            max={max}
            step={step}
            value={editing ? draft : String(value)}
            onFocus={(event) => { setDraft(String(value)); setEditing(true); event.currentTarget.select(); }}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              const parsed = Number(event.currentTarget.value);
              if (event.currentTarget.value.trim() !== "" && Number.isFinite(parsed)) onChange(normalize(parsed));
            }}
            onBlur={commit}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            className="min-w-0 appearance-none bg-transparent text-center font-mono text-2xl font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="font-mono text-[9px] font-bold text-charcoal/32">{suffix}</span>
        </div>
        <button type="button" onClick={() => adjust(step)} className="grid min-h-13 place-items-center border-l border-charcoal/10 bg-sky" aria-label={`Increase ${label}`}>
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}
