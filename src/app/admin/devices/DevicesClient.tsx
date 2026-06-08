"use client";

import { adminDevicePolicy } from "@/lib/projectPeakConfig";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import {
  Toast,
  actionButtonLightClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type DeviceClient = { id: string; username: string };

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
                    <span className="text-sm font-semibold text-[#1c2b29]">
                      {client.username || client.id}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={resetting}
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
