"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  adminDevicePolicy,
  defaultTrackerTemplate,
  feedbackTemplates,
  formatMmk,
  projectPrograms,
} from "@/lib/projectPeakConfig";

interface AdminDashboardClientProps {
  clients: any[];
  recentCheckins: any[];
  registrations: any[];
}

type AdminActionState = {
  id: string;
  label: string;
  tone: "success" | "error" | "info";
} | null;

export default function AdminDashboardClient({
  clients,
  recentCheckins,
  registrations,
}: AdminDashboardClientProps) {
  const [actionState, setActionState] = useState<AdminActionState>(null);
  const [selectedProgram, setSelectedProgram] = useState(projectPrograms[0].key);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || registrations[0]?.user_id || "");
  const [broadcastProgram, setBroadcastProgram] = useState(projectPrograms[0].name);
  const [broadcastTemplate, setBroadcastTemplate] = useState(feedbackTemplates[0].name);
  const [trackerDraftName, setTrackerDraftName] = useState("Default compact full");

  const pendingRegistrations = useMemo(
    () => registrations.filter((item) => !["approved", "ready", "rejected"].includes(String(item.status || "").toLowerCase())),
    [registrations],
  );

  const selectedProgramConfig = projectPrograms.find((item) => item.key === selectedProgram) || projectPrograms[0];

  async function runAdminAction(id: string, label: string, request: () => Promise<Response>) {
    setActionState({ id, label: "Working...", tone: "info" });
    try {
      const response = await request();
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Action failed");
      }
      setActionState({ id, label, tone: "success" });
    } catch (error) {
      setActionState({ id, label: error instanceof Error ? error.message : "Action failed", tone: "error" });
    }
  }

  return (
    <main className="pp-admin-app">
      <nav className="pp-admin-topbar">
        <Link href="/admin/dashboard" className="pp-admin-brand">
          <i className="ph ph-mountains" />
          <span>Project Peak Admin</span>
        </Link>
        <div>
          <Link href="/miniapp" className="pp-admin-navlink" target="_blank">
            <i className="ph ph-device-mobile" /> Package choose
          </Link>
          <Link href="/" className="pp-admin-navlink" target="_blank">
            <i className="ph ph-sign-in" /> Website login
          </Link>
          <button
            type="button"
            className="pp-admin-navlink"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <i className="ph ph-sign-out" /> Logout
          </button>
        </div>
      </nav>

      <section className="pp-admin-hero">
        <div>
          <p>Trainer operating system</p>
          <h1>Programs, payments, custom trackers and feedback broadcasts</h1>
          <span>Admin က website ထဲကနေ package create, payment approve, custom daily tracker build, feedback form broadcast လုပ်နိုင်တဲ့ flow အဖြစ် ပြန်တည်ဆောက်ထားပါတယ်။</span>
        </div>
        <div className="pp-admin-stat-grid">
          <StatCard icon="ph-users" label="Clients" value={clients.length} />
          <StatCard icon="ph-receipt" label="Pending payments" value={pendingRegistrations.length} />
          <StatCard icon="ph-clipboard-text" label="Feedback templates" value={feedbackTemplates.length} />
        </div>
      </section>

      {actionState && (
        <div className={`pp-admin-toast pp-admin-toast--${actionState.tone}`}>
          <i className={`ph ${actionState.tone === "success" ? "ph-check-circle" : actionState.tone === "error" ? "ph-warning" : "ph-spinner"}`} />
          <span>{actionState.label}</span>
        </div>
      )}

      <section className="pp-admin-grid">
        <article className="pp-admin-panel pp-admin-panel--wide">
          <PanelTitle icon="ph-package" title="Program Builder" action="Editable catalog" />
          <div className="pp-program-admin-tabs">
            {projectPrograms.map((program) => (
              <button
                key={program.key}
                type="button"
                className={selectedProgram === program.key ? "is-active" : ""}
                onClick={() => setSelectedProgram(program.key)}
              >
                {program.shortName}
              </button>
            ))}
          </div>
          <div className="pp-program-admin-card">
            <div>
              <p>Program Name</p>
              <input defaultValue={selectedProgramConfig.name} />
            </div>
            <div>
              <p>Description</p>
              <textarea rows={4} defaultValue={selectedProgramConfig.description} />
            </div>
            <div className="pp-price-table">
              {selectedProgramConfig.durations.map((duration) => (
                <div key={duration.months}>
                  <span>{duration.label}</span>
                  <strong>{formatMmk(duration.price)}</strong>
                  <em>{duration.note}</em>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="pp-admin-action"
              onClick={() =>
                runAdminAction("program", "Program catalog saved", () =>
                  fetch("/api/admin/save-program-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(selectedProgramConfig),
                  }),
                )
              }
            >
              <i className="ph ph-floppy-disk" /> Save program
            </button>
            <div className="pp-admin-preview-row">
              <a href="/miniapp" target="_blank" rel="noopener noreferrer">
                <i className="ph ph-stack" /> Choose page
              </a>
              <a href={`/miniapp/packages/${selectedProgramConfig.key}`} target="_blank" rel="noopener noreferrer">
                <i className="ph ph-eye" /> Details
              </a>
              <a href={`/miniapp/checkout/${selectedProgramConfig.key}?months=${selectedProgramConfig.durations[1]?.months || selectedProgramConfig.durations[0].months}`} target="_blank" rel="noopener noreferrer">
                <i className="ph ph-credit-card" /> Checkout
              </a>
            </div>
          </div>
        </article>

        <article className="pp-admin-panel">
          <PanelTitle icon="ph-clipboard-text" title="Feedback Forms" action="Template + broadcast" />
          <div className="pp-feedback-admin-list">
            {feedbackTemplates.map((template) => (
              <div key={template.name}>
                <div>
                  <strong>{template.name}</strong>
                  <span>{template.cadence} · {template.status}</span>
                </div>
                <p>{template.fields.join(" · ")}</p>
              </div>
            ))}
          </div>
          <label>
            Program
            <select value={broadcastProgram} onChange={(event) => setBroadcastProgram(event.target.value)}>
              {projectPrograms.map((program) => (
                <option key={program.key} value={program.name}>{program.name}</option>
              ))}
            </select>
          </label>
          <label>
            Form
            <select value={broadcastTemplate} onChange={(event) => setBroadcastTemplate(event.target.value)}>
              {feedbackTemplates.map((template) => (
                <option key={template.name} value={template.name}>{template.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="pp-admin-action"
            onClick={() =>
              runAdminAction("broadcast", "Feedback broadcast queued", () =>
                fetch("/api/admin/broadcast-feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ programName: broadcastProgram, templateName: broadcastTemplate }),
                }),
              )
            }
          >
            <i className="ph ph-paper-plane-tilt" /> Broadcast
          </button>
        </article>

        <article className="pp-admin-panel pp-admin-panel--wide">
          <PanelTitle icon="ph-receipt" title="Payment Queue" action="Approve + build" />
          <div className="pp-registration-list">
            {(registrations.length ? registrations : []).map((reg) => (
              <div key={reg.id} className="pp-registration-row">
                <div>
                  <strong>{reg.name || reg.username || "Client"}</strong>
                  <span>{reg.program_name || "Custom program"} · {reg.telegram_id ? `TG ${reg.telegram_id}` : reg.email}</span>
                  <p>{reg.notes || "No notes submitted yet."}</p>
                </div>
                <div className="pp-registration-actions">
                  {reg.payment_screenshot && (
                    <a href={reg.payment_screenshot.startsWith("http") ? reg.payment_screenshot : `/${reg.payment_screenshot}`} target="_blank" rel="noopener noreferrer">
                      <i className="ph ph-image" /> Receipt
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientId(reg.user_id || selectedClientId);
                      runAdminAction(`approve-${reg.id}`, "Payment approved and plan workspace opened", () =>
                        fetch("/api/admin/approve-registration", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ registrationId: reg.id }),
                        }),
                      );
                    }}
                  >
                    <i className="ph ph-check-circle" /> Approve
                  </button>
                </div>
              </div>
            ))}
            {registrations.length === 0 && <p className="pp-empty">Payment အသစ် မရှိသေးပါ။</p>}
          </div>
        </article>

        <article className="pp-admin-panel pp-admin-panel--wide">
          <PanelTitle icon="ph-layout" title="Custom Tracker Builder" action="Morning · Mid-day · Night" />
          <div className="pp-tracker-builder-head">
            <label>
              Client
              <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
                {[...clients, ...registrations.filter((item) => item.user_id)].map((client) => (
                  <option key={client.id || client.user_id} value={client.id || client.user_id}>
                    {client.username || client.name || client.email || client.user_id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Template name
              <input value={trackerDraftName} onChange={(event) => setTrackerDraftName(event.target.value)} />
            </label>
          </div>
          <div className="pp-tracker-builder-grid">
            {defaultTrackerTemplate.map((section) => (
              <div key={section.title}>
                <h3><i className={`ph ${section.icon}`} /> {section.title}</h3>
                {section.fields.map((field) => (
                  <span key={field.id}>
                    <i className={`ph ${field.icon}`} />
                    {field.label}
                    <em>{field.type}{field.fixed ? " · fixed" : ""}</em>
                  </span>
                ))}
                <button type="button"><i className="ph ph-plus" /> Add field</button>
              </div>
            ))}
          </div>
          <div className="pp-admin-button-row">
            <button
              type="button"
              className="pp-admin-action"
              onClick={() =>
                runAdminAction("tracker", "Custom tracker saved", () =>
                  fetch("/api/admin/save-tracker-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: selectedClientId, name: trackerDraftName, sections: defaultTrackerTemplate }),
                  }),
                )
              }
            >
              <i className="ph ph-floppy-disk" /> Save tracker
            </button>
            <button
              type="button"
              className="pp-admin-action pp-admin-action--light"
              onClick={() =>
                runAdminAction("ready", "Client access message sent", () =>
                  fetch("/api/admin/send-ready", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: selectedClientId }),
                  }),
                )
              }
            >
              <i className="ph ph-telegram-logo" /> Send ready link
            </button>
          </div>
        </article>

        <article className="pp-admin-panel">
          <PanelTitle icon="ph-devices" title="Devices" action={`${adminDevicePolicy.maxDevices} device limit`} />
          <p className="pp-device-copy">{adminDevicePolicy.reason}</p>
          <div className="pp-device-list">
            {clients.slice(0, 6).map((client) => (
              <div key={client.id}>
                <span>{client.username}</span>
                <button
                  type="button"
                  onClick={() =>
                    runAdminAction(`device-${client.id}`, "Device sessions reset", () =>
                      fetch("/api/admin/reset-devices", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: client.id }),
                      }),
                    )
                  }
                >
                  Reset
                </button>
              </div>
            ))}
            {clients.length === 0 && <p className="pp-empty">Client မရှိသေးပါ။</p>}
          </div>
        </article>

        <article className="pp-admin-panel">
          <PanelTitle icon="ph-chart-line-up" title="Recent Check-ins" action="Review" />
          <div className="pp-checkin-admin-list">
            {recentCheckins.map((checkin) => (
              <Link key={checkin.id} href={`/admin/client-view?id=${checkin.user_id}&week=${checkin.week_number}`}>
                <strong>{checkin.username || "Client"} · Week {checkin.week_number}</strong>
                <span>{checkin.admin_feedback ? "Reviewed" : "Needs feedback"}</span>
              </Link>
            ))}
            {recentCheckins.length === 0 && <p className="pp-empty">Check-in မရှိသေးပါ။</p>}
          </div>
        </article>
      </section>
    </main>
  );
}

function PanelTitle({ icon, title, action }: { icon: string; title: string; action: string }) {
  return (
    <header className="pp-panel-title">
      <div>
        <i className={`ph ${icon}`} />
        <h2>{title}</h2>
      </div>
      <span>{action}</span>
    </header>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="pp-admin-stat">
      <i className={`ph ${icon}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
