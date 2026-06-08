"use client";

import { useCallback, useState } from "react";

export type ActionTone = "success" | "error" | "info";

export type AdminActionState = {
  id: string;
  label: string;
  tone: ActionTone;
} | null;

export function useAdminAction() {
  const [state, setState] = useState<AdminActionState>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const run = useCallback(
    async (id: string, successLabel: string, request: () => Promise<Response>) => {
      setPendingId(id);
      setState({ id, label: "Working…", tone: "info" });
      try {
        const response = await request();
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Action failed");
        setState({ id, label: successLabel, tone: "success" });
      } catch (error) {
        setState({
          id,
          label: error instanceof Error ? error.message : "Action failed",
          tone: "error",
        });
      } finally {
        setPendingId(null);
      }
    },
    [],
  );

  return { state, pendingId, run };
}

export function Toast({ state }: { state: AdminActionState }) {
  if (!state) return null;
  const tone = state.tone;
  const styles =
    tone === "success"
      ? "border-[#bfe6c9] bg-[#edf9f0] text-[#1d7a3a]"
      : tone === "error"
        ? "border-[#f4c7bd] bg-[#fdeee9] text-[#c0432b]"
        : "border-[#cdd6d2] bg-white text-[#1c2b29]";
  const icon =
    tone === "success" ? "ph-check-circle" : tone === "error" ? "ph-warning-circle" : "ph-spinner";
  return (
    <div
      className={`fixed bottom-5 left-1/2 z-50 flex max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-lg ${styles}`}
      role="status"
    >
      <i className={`ph ${icon} text-base ${tone === "info" ? "animate-spin" : ""}`} />
      <span>{state.label}</span>
    </div>
  );
}

export const actionButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1c2b29] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#26403c] disabled:cursor-not-allowed disabled:opacity-60";

export const actionButtonLightClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1c2b29]/15 bg-[#eef2f0] px-4 py-2.5 text-sm font-bold text-[#1c2b29] transition hover:bg-[#e3e9e6] disabled:cursor-not-allowed disabled:opacity-60";
