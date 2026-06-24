"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: number;
};

interface AdminSidebarProps {
  username: string;
  pendingPayments: number;
}

export default function AdminSidebar({ username, pendingPayments }: AdminSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/admin/dashboard", icon: "ph-squares-four", label: "Overview" },
    { href: "/admin/clients", icon: "ph-users", label: "Clients" },
    { href: "/admin/payments", icon: "ph-receipt", label: "Payments", badge: pendingPayments },
    { href: "/admin/programs", icon: "ph-package", label: "Programs" },
    { href: "/admin/trackers", icon: "ph-layout", label: "Trackers" },
    { href: "/admin/feedback", icon: "ph-clipboard-text", label: "Feedback" },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-colors ${
              active
                ? "bg-[#1c2b29] text-white"
                : "text-[#5b6a67] hover:bg-[#eef2f0] hover:text-[#1c2b29]"
            }`}
          >
            <i className={`ph ${item.icon} text-lg ${active ? "text-[#ff6b35]" : ""}`} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6b35] px-1.5 text-[0.68rem] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto flex flex-col gap-1 border-t border-[#e6eae8] px-3 pt-3">
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#c0432b] transition-colors hover:bg-[#fbeae6]"
      >
        <i className="ph ph-sign-out text-lg" /> Logout
      </button>
    </div>
  );

  const brand = (
    <Link
      href="/admin/dashboard"
      onClick={() => setOpen(false)}
      className="flex items-center gap-2.5 px-5 py-5 no-underline"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c2b29] text-[#ff6b35]">
        <i className="ph-fill ph-mountains text-xl" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-extrabold text-[#1c2b29]">Project Peak</span>
        <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-[#9aa8a4]">
          Admin
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e6eae8] bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2 no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1c2b29] text-[#ff6b35]">
            <i className="ph-fill ph-mountains text-lg" />
          </span>
          <span className="text-sm font-extrabold text-[#1c2b29]">Peak Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-[#e6eae8] text-[#1c2b29]"
        >
          <i className="ph ph-list text-xl" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[78%] max-w-[300px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-[#5b6a67]"
              >
                <i className="ph ph-x text-xl" />
              </button>
            </div>
            <p className="px-5 pb-3 text-xs font-semibold text-[#9aa8a4]">
              Signed in as {username}
            </p>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-[#e6eae8] bg-white md:flex">
        {brand}
        <p className="px-5 pb-3 text-xs font-semibold text-[#9aa8a4]">
          Signed in as {username}
        </p>
        {nav}
        <div className="pb-4">{footer}</div>
      </aside>
    </>
  );
}
