import * as React from "react"

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  direction?: "left" | "right"
  repeat?: number
  duration?: number
  className?: string
}

export function Marquee({
  children,
  direction = "left",
  repeat = 4,
  duration = 40,
  className,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={`marquee-container ${className || ""}`}
      style={{ "--duration": `${duration}s` } as React.CSSProperties}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`marquee-content ${
              direction === "left" ? "marquee-animate-left" : "marquee-animate-right"
            }`}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
