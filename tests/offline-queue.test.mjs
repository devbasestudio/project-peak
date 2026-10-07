import test from "node:test";
import assert from "node:assert/strict";
import { drainQueue } from "../src/lib/offline/queue-core.ts";
const item = (id, revision = id) => ({ id, revision, createdAt: "now", table: "habit_logs", payload: { program_id: "mine" } });
function store(initial) {
  let rows = initial;
  return { read: async () => structuredClone(rows), update: async (f) => { rows = f(rows); } };
}
test("enqueue during sync is not discarded", async () => {
  const db = store([item("old")]);
  const result = await drainQueue(db, () => true, async () => { await db.update((rows) => [...rows, item("new")]); return true; });
  assert.deepEqual((await db.read()).map((r) => r.id), ["new"]);
  assert.deepEqual(result, { synced: 1, remaining: 1 });
});
test("newer edit to a queued record survives its earlier acknowledgement", async () => {
  const db = store([item("same", "v1")]);
  await drainQueue(db, () => true, async () => { await db.update(() => [item("same", "v2")]); return true; });
  assert.equal((await db.read())[0].revision, "v2");
});
test("failed writes stay queued and another account does not count as pending", async () => {
  const db = store([item("mine"), item("other")]);
  const result = await drainQueue(db, (r) => r.id === "mine", async () => { throw new Error("offline"); });
  assert.equal((await db.read()).length, 2);
  assert.deepEqual(result, { synced: 0, remaining: 1 });
});
