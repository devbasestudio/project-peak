export function AscentMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 220 120" fill="none">
      <path d="M4 108 56 58l28 25L137 16l79 92" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d="M4 108h212" stroke="currentColor" strokeOpacity=".2" vectorEffect="non-scaling-stroke" />
      <path d="m126 29 11-13 12 18" stroke="currentColor" strokeWidth="7" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AscentRule({ completed, total = 48 }: { completed: number; total?: number }) {
  const safeTotal = Math.max(1, total);
  const safeCompleted = Math.max(0, Math.min(safeTotal, completed));
  return (
    <div aria-label={`${safeCompleted} of ${safeTotal} sessions complete`} className="grid grid-cols-12 gap-1">
      {Array.from({ length: safeTotal }, (_, index) => (
        <span aria-hidden="true" className={`h-1 ${index < safeCompleted ? "bg-sky" : index === safeCompleted ? "bg-charcoal" : "bg-charcoal/12"}`} key={index} />
      ))}
    </div>
  );
}
