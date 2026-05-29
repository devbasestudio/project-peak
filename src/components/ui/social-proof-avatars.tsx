import * as React from "react"

interface Avatar {
  src: string
  alt: string
}

interface SocialProofAvatarsProps extends React.HTMLAttributes<HTMLDivElement> {
  extraCount?: number
  avatars: Avatar[]
  className?: string
  stars?: boolean
  children?: React.ReactNode
}

export function SocialProofAvatars({
  extraCount,
  avatars,
  className,
  children,
  stars = true,
  ...props
}: SocialProofAvatarsProps) {
  return (
    <div className={`social-proof-group ${className || ""}`} {...props}>
      <div className="avatar-stack">
        {avatars.map((image, i) => (
          <div
            className="avatar-img-wrapper"
            key={i}
            style={{ zIndex: avatars.length - i }}
          >
            <img
              src={image.src}
              alt={image.alt || ""}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="avatar-img"
            />
          </div>
        ))}
        {extraCount !== undefined && extraCount > 0 && (
          <div className="avatar-extra" style={{ zIndex: 100 }}>
            <span>+{extraCount}</span>
          </div>
        )}
      </div>
      {children}
      {stars && (
        <div className="avatar-stars animate-pulse-subtle">
          {Array.from({ length: 5 }).map((_, index) => (
            <svg
              key={index}
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
          ))}
        </div>
      )}
    </div>
  )
}
