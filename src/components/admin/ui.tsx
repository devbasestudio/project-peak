import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1c2b29] text-[#ff6b35]">
            <i className={`ph ${icon} text-2xl`} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1c2b29]">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#6b7a77]">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#e6eae8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  icon,
  title,
  meta,
}: {
  icon?: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-[#1c2b29]">
        {icon && <i className={`ph ${icon} text-lg text-[#ff6b35]`} />}
        {title}
      </h2>
      {meta && (
        <span className="rounded-full bg-[#eef2f0] px-2.5 py-1 text-[0.7rem] font-semibold text-[#6b7a77]">
          {meta}
        </span>
      )}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e6eae8] bg-white p-4">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef2f0] text-[#1c2b29]">
        <i className={`ph ${icon} text-xl`} />
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a4]">
          {label}
        </span>
        <strong className="text-2xl font-extrabold leading-tight text-[#1c2b29]">{value}</strong>
      </div>
    </div>
  );
}

export function EmptyState({ icon = "ph-tray", text }: { icon?: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#d8dedb] py-8 text-center">
      <i className={`ph ${icon} text-2xl text-[#b6c1bd]`} />
      <p className="text-sm text-[#9aa8a4]">{text}</p>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#3a4744]">{children}</label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#d8dedb] bg-white px-3.5 py-2.5 text-sm font-normal text-[#1c2b29] outline-none transition focus:border-[#1c2b29] focus:ring-2 focus:ring-[#1c2b29]/10";

export function LinkButton({
  href,
  icon,
  children,
  external,
}: {
  href: string;
  icon?: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b29] no-underline transition hover:border-[#cdd6d2] hover:bg-[#f6f8f7]"
    >
      {icon && <i className={`ph ${icon} text-base`} />}
      {children}
    </Link>
  );
}
