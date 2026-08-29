"use client";

import { get, set } from "idb-keyval";
import type { SupabaseClient } from "@supabase/supabase-js";

type QueuedMutation = {
  id: string;
  table: "set_logs" | "habit_logs";
  payload: Record<string, unknown>;
  createdAt: string;
};

const KEY = "project-peak:mutation-queue:v1";

export async function getQueue(): Promise<QueuedMutation[]> {
  return (await get<QueuedMutation[]>(KEY)) ?? [];
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, "createdAt">) {
  const queue = await getQueue();
  const next = [...queue.filter((item) => item.id !== mutation.id), { ...mutation, createdAt: new Date().toISOString() }];
  await set(KEY, next);
}

export async function flushQueue(supabase: SupabaseClient) {
  const queue = await getQueue();
  const remaining: QueuedMutation[] = [];
  for (const mutation of queue) {
    const { error } = await supabase.from(mutation.table).upsert(mutation.payload, {
      onConflict: mutation.table === "set_logs" ? "session_id,program_day_item_id,set_index" : "program_id,local_date",
    });
    if (error) remaining.push(mutation);
  }
  await set(KEY, remaining);
  return { synced: queue.length - remaining.length, remaining: remaining.length };
}
