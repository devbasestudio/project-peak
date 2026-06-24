"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle, FieldLabel, inputClass } from "@/components/admin/ui";
import { Toast, actionButtonClass, useAdminAction } from "@/components/admin/useAdminAction";

export type BroadcastPackageOption = {
  key: string;
  label: string;
  count: number;
};

export default function BroadcastPanel({ packages }: { packages: BroadcastPackageOption[] }) {
  const { state, pendingId, run } = useAdminAction();
  const [target, setTarget] = useState<"all" | "package">("all");
  const [packageKey, setPackageKey] = useState(packages[0]?.key || "");
  const [message, setMessage] = useState("");
  const sending = pendingId === "broadcast-message";

  const selectedPackage = useMemo(
    () => packages.find((item) => item.key === packageKey),
    [packages, packageKey],
  );
  const packageDisabled = target === "package" && !packages.length;

  return (
    <Card>
      <CardTitle icon="ph-paper-plane-tilt" title="Telegram broadcast" />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <FieldLabel>
          Target
          <select
            className={inputClass}
            value={target}
            onChange={(event) => setTarget(event.target.value === "package" ? "package" : "all")}
          >
            <option value="all">All users</option>
            <option value="package">Package အလိုက်</option>
          </select>
        </FieldLabel>

        <FieldLabel>
          Package
          <select
            className={inputClass}
            value={packageKey}
            disabled={target !== "package" || !packages.length}
            onChange={(event) => setPackageKey(event.target.value)}
          >
            {packages.length ? (
              packages.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label} ({item.count})
                </option>
              ))
            ) : (
              <option value="">Package user မရှိသေးပါ</option>
            )}
          </select>
        </FieldLabel>
      </div>

      <div className="mt-3">
        <FieldLabel>
          Message
          <textarea
            rows={5}
            className={inputClass}
            value={message}
            placeholder="ဥပမာ - ဒီနေ့ tracker ဖြည့်ဖို့ မမေ့ပါနဲ့နော်။"
            onChange={(event) => setMessage(event.target.value)}
          />
        </FieldLabel>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#6b7a77]">
          {target === "all"
            ? "Registration/Profile ထဲက Telegram users အားလုံးဆီ ပို့ပါမယ်။"
            : selectedPackage
              ? `${selectedPackage.label} user ${selectedPackage.count} ယောက်ဆီ ပို့ပါမယ်။`
              : "Package user မရှိသေးပါ။"}
        </p>
        <button
          type="button"
          disabled={sending || !message.trim() || packageDisabled}
          className={actionButtonClass}
          onClick={() =>
            run("broadcast-message", "Broadcast ပို့ပြီးပါပြီ", () =>
              fetch("/api/admin/broadcast-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target, packageKey, message }),
              }),
            )
          }
        >
          <i className="ph ph-paper-plane-tilt text-base" />
          {sending ? "ပို့နေပါတယ်..." : "Broadcast ပို့မယ်"}
        </button>
      </div>

      <Toast state={state} />
    </Card>
  );
}
