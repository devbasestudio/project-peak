const STEPS = ["Package", "Details", "Payment"];

export function FlowSteps({ active, className = "" }: { active: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Purchase steps">
      {STEPS.map((step, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <span
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                current
                  ? "bg-[#1c2b29] text-white"
                  : done
                    ? "bg-[#eef2f0] text-[#1c2b29]"
                    : "bg-[#eef2f0] text-[#9aa8a4]"
              }`}
            >
              {done ? <i className="ph ph-check text-sm" /> : <span>{index + 1}.</span>}
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
