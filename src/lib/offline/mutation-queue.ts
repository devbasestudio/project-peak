"use client";

import { get, update } from "idb-keyval";
import type { SupabaseClient } from "@supabase/supabase-js";
import { drainQueue, type QueuedMutation } from "./queue-core";

const KEY = "project-peak:mutation-queue:v1";

export async function getQueue(): Promise<QueuedMutation[]> {
  return (await get<QueuedMutation[]>(KEY)) ?? [];
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, "createdAt">) {
  await update<QueuedMutation[]>(KEY, (queue = []) => [
    ...queue.filter((item) => item.id !== mutation.id),
    { ...mutation, createdAt: new Date().toISOString(), revision: crypto.randomUUID() },
  ]);
}

async function flushOwnedQueue(supabase: SupabaseClient) {
  const queue = await getQueue();
  if (!queue.length) return { synced: 0, remaining: 0 };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { synced: 0, remaining: queue.length };
  // Also recovers legacy queued records without an owner field. RLS plus an
  // explicit owner filter prevents one account from draining another's queue.
  const programIds = [...new Set(queue.map((item) => String(item.payload.program_id)))];
  const owned = new Set<string>();
  for (let offset = 0; offset < programIds.length; offset += 100) {
    const { data, error } = await supabase.from("programs").select("id")
      .eq("user_id", session.user.id).in("id", programIds.slice(offset, offset + 100));
    if (error) return { synced: 0, remaining: queue.length };
    for (const row of data ?? []) owned.add(row.id);
  }
  return drainQueue({ read: getQueue, update: (change) => update<QueuedMutation[]>(KEY, (rows = []) => change(rows)) },
    (item) => owned.has(String(item.payload.program_id)),
    async (item) => {
      const { error } = await supabase.from(item.table).upsert(item.payload, {
        onConflict: item.table === "set_logs" ? "session_id,program_day_item_id,set_index" : "program_id,local_date",
      });
      return !error;
    });
}

let pending = Promise.resolve({ synced: 0, remaining: 0 });
export function flushQueue(supabase: SupabaseClient) {
  const run = async () => typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(KEY, () => flushOwnedQueue(supabase))
    : flushOwnedQueue(supabase);
  pending = pending.then(run, run);
  return pending;
}
