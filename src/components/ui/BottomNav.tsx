import Link from "next/link";

type NavKey = "home" | "progress" | "learn" | "climb";

interface BottomNavProps {
  /** Highlighted tab; omit on pages that aren't one of the four tabs (e.g. check-in). */
  active?: NavKey;
  /** e.g. "?client_id=..." when an admin is viewing a client, otherwise "" */
  clientQuery?: string;
}

const items: { key: NavKey; href: string; icon: string; label: string }[] = [
  { key: "home", href: "/user/dashboard", icon: "ph-house", label: "Home" },
  { key: "progress", href: "/user/daily-log", icon: "ph-chart-line-up", label: "Progress" },
  { key: "learn", href: "/user/diet", icon: "ph-book-open", label: "Learn" },
  { key: "climb", href: "/user/workout", icon: "ph-mountains", label: "Climb" },
];

export function BottomNav({ active, clientQuery = "" }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 z-[1000] w-full border-t border-[#e6eae8] bg-white/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-[480px] items-center justify-around">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={`${item.href}${clientQuery}`}
              className={`relative flex flex-col items-center gap-[0.15rem] rounded-xl px-2 py-[0.3rem] no-underline transition-all ${
                isActive ? "text-[#1c2b29]" : "text-[#83928f]"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#ff6b35]" />
              )}
              <i className={`ph ${item.icon} text-[1.4rem]`} />
              <span className="text-[0.72rem] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
