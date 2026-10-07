export type QueuedMutation = {
  id: string;
  table: "set_logs" | "habit_logs";
  payload: Record<string, unknown>;
  createdAt: string;
  revision?: string;
};

type Store = {
  read: () => Promise<QueuedMutation[]>;
  update: (change: (items: QueuedMutation[]) => QueuedMutation[]) => Promise<void>;
};

/** Acknowledge only the exact version sent; concurrent edits remain queued. */
export async function drainQueue(
  store: Store,
  canSend: (item: QueuedMutation) => boolean,
  send: (item: QueuedMutation) => Promise<boolean>,
) {
  let synced = 0;
  for (const item of (await store.read()).filter(canSend)) {
    try {
      if (!await send(item)) continue;
      await store.update((items) => items.filter((current) =>
        current.id !== item.id || current.revision !== item.revision || current.createdAt !== item.createdAt));
      synced += 1;
    } catch { /* Offline/transient errors retain the record for a later retry. */ }
  }
  return { synced, remaining: (await store.read()).filter(canSend).length };
}
