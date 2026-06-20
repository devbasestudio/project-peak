"use client";

import { adminDevicePolicy } from "@/lib/projectPeakConfig";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import {
  Toast,
  actionButtonLightClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type DeviceRow = { device_id: string; user_agent?: string; last_seen_at?: string };
type DeviceClient = {
  id: string;
  username: string;
  email?: string;
  telegram_id?: string;
  canOpenProfile: boolean;
  devices: DeviceRow[];
};

export default function DevicesClient({ clients }: { clients: DeviceClient[] }) {
  const { state, pendingId, run } = useAdminAction();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-devices"
        title="Devices"
        subtitle={`${adminDevicePolicy.maxDevices} active devices per account. ${adminDevicePolicy.reason}`}
      />

      {clients.length === 0 ? (
        <Card>
          <EmptyState icon="ph-devices" text="No clients yet." />
        </Card>
      ) : (
        <Card className="!p-0">
          <ul className="divide-y divide-[#eef2f0]">
            {clients.map((client) => {
              const resetting = pendingId === `device-${client.id}`;
              return (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef2f0] text-sm font-bold text-[#1c2b29]">
                      {(client.username || "C").charAt(0).toUpperCase()}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-[#1c2b29]">
                        {client.username || client.id}
                      </span>
                      <span className="text-xs text-[#6b7a77]">
                        {client.devices.length}/{adminDevicePolicy.maxDevices} devices
                        {client.telegram_id ? ` · TG ${client.telegram_id}` : ""}
                      </span>
                      {client.devices[0]?.last_seen_at && (
                        <span className="text-[0.68rem] text-[#9aa8a4]">
                          Last seen {new Date(client.devices[0].last_seen_at).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={resetting || !client.canOpenProfile}
                    className={actionButtonLightClass}
                    onClick={() =>
                      run(`device-${client.id}`, "Device sessions reset", () =>
                        fetch("/api/admin/reset-devices", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: client.id }),
                        }),
                      )
                    }
                  >
                    <i className="ph ph-arrow-counter-clockwise text-base" />
                    {resetting ? "Resetting…" : "Reset"}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Toast state={state} />
    </div>
  );
}
