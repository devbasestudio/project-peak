"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { reviewPaymentOrder } from "@/app/admin-actions";
import type { Locale } from "@/lib/i18n";
import styles from "./admin.module.css";

type VersionOption = { id: string; label: string };

export function PaymentReview({ orderId, locale, versions }: { orderId: string; locale: Locale; versions: VersionOption[] }) {
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function review(decision: "approve" | "reject") {
    setMessage("");
    startTransition(async () => {
      const result = await reviewPaymentOrder(orderId, decision, decision === "approve" && versionId ? versionId : null, "", locale);
      setMessage(result.message);
    });
  }

  return (
    <div>
      <div className={styles.reviewForm}>
        <select aria-label="Template version" className={styles.select} disabled={pending || !versions.length} onChange={(event) => setVersionId(event.target.value)} value={versionId}>
          {versions.length ? versions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>) : <option value="">Offer default template</option>}
        </select>
        <button className={styles.button} disabled={pending} onClick={() => review("approve")} type="button">
          {pending ? <LoaderCircle className="animate-spin" size={13} /> : <Check size={13} />} Approve
        </button>
        <button aria-label="Reject payment" className={styles.buttonDanger} disabled={pending} onClick={() => review("reject")} type="button">
          <X size={13} />
        </button>
      </div>
      {message ? <small className={styles.muted}>{message}</small> : null}
    </div>
  );
}

