import Link from "next/link";
import { getClients, getRecentCheckins, getRegistrations, isPendingRegistration } from "@/lib/adminData";
import { Card, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import BroadcastPanel, { type BroadcastPackageOption } from "./BroadcastPanel";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/admin/clients", icon: "ph-users", title: "Clients", desc: "Programs, progress & feedback" },
  { href: "/admin/payments", icon: "ph-receipt", title: "Payments", desc: "Approve new registrations" },
  { href: "/admin/programs", icon: "ph-package", title: "Programs", desc: "Edit catalog & pricing" },
  { href: "/admin/trackers", icon: "ph-layout", title: "Trackers", desc: "Build custom daily trackers" },
  { href: "/admin/feedback", icon: "ph-clipboard-text", title: "Feedback", desc: "Forms & broadcasts" },
];

function broadcastPackages(registrations: any[]): BroadcastPackageOption[] {
  const byKey = new Map<string, BroadcastPackageOption & { telegramIds: Set<string> }>();

  for (const registration of registrations) {
    const telegramId = String(registration.telegram_id || "").trim();
    const key = String(registration.program_key || "").trim();
    if (!telegramId || !key) continue;

    const label = String(registration.program_name || key).trim();
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { key, label, count: 1, telegramIds: new Set([telegramId]) });
    } else {
      current.telegramIds.add(telegramId);
      current.count = current.telegramIds.size;
    }
  }

  return Array.from(byKey.values())
    .map((item) => ({ key: item.key, label: item.label, count: item.count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default async function AdminOverviewPage() {
  const [clients, registrations, recentCheckins] = await Promise.all([
    getClients(),
    getRegistrations(),
    getRecentCheckins(8),
  ]);

  const pending = registrations.filter(isPendingRegistration);
  const needsFeedback = recentCheckins.filter((c) => !c.admin_feedback).length;
  const packageOptions = broadcastPackages(registrations);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-squares-four"
        title="Overview"
        subtitle="Project Peak trainer console — programs, payments, trackers and client feedback in one place."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon="ph-users" label="Clients" value={clients.length} />
        <StatCard icon="ph-receipt" label="Pending payments" value={pending.length} />
        <StatCard icon="ph-chat-circle-dots" label="Needs feedback" value={needsFeedback} />
      </div>

      <Card>
        <CardTitle icon="ph-compass" title="Quick actions" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start gap-3 rounded-xl border border-[#e6eae8] p-4 no-underline transition hover:border-[#cdd6d2] hover:bg-[#f6f8f7]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef2f0] text-[#1c2b29] transition group-hover:bg-[#1c2b29] group-hover:text-[#ff6b35]">
                <i className={`ph ${link.icon} text-xl`} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-[#1c2b29]">{link.title}</span>
                <span className="text-xs text-[#6b7a77]">{link.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <BroadcastPanel packages={packageOptions} />

      <Card>
        <CardTitle icon="ph-chart-line-up" title="Recent check-ins" meta="Latest 8" />
        {recentCheckins.length === 0 ? (
          <EmptyState icon="ph-chart-line" text="No check-ins submitted yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentCheckins.map((checkin) => (
              <li key={checkin.id}>
                <Link
                  href={`/admin/client-view?id=${checkin.user_id}&week=${checkin.week_number}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e6eae8] px-4 py-3 no-underline transition hover:border-[#cdd6d2] hover:bg-[#f6f8f7]"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef2f0] text-sm font-bold text-[#1c2b29]">
                      {(checkin.username || "C").charAt(0).toUpperCase()}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-bold text-[#1c2b29]">{checkin.username}</span>
                      <span className="text-xs text-[#6b7a77]">Week {checkin.week_number}</span>
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${
                      checkin.admin_feedback
                        ? "bg-[#edf9f0] text-[#1d7a3a]"
                        : "bg-[#fdeee9] text-[#c0432b]"
                    }`}
                  >
                    {checkin.admin_feedback ? "Reviewed" : "Needs feedback"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
