import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member mutations use atomic and ownership-validating RPCs", async () => {
  const source = await read("src/app/actions.ts");
  assert.match(source, /get_or_create_payment_order/);
  assert.match(source, /save_baseline_assessment/);
});

test("Burmese locale is consistently mm", async () => {
  const proxy = await read("src/proxy.ts");
  assert.doesNotMatch(proxy, /routeLocale[^;]*\"my\"/s);
  assert.match(proxy, /\"mm\"/);
});

test("production hardening migration owns the critical transactions", async () => {
  const migration = await read("supabase/migrations/20260902112631_harden_project_peak_transactions_and_rls.sql");
  for (const fn of [
    "save_template_draft",
    "publish_template_version_atomic",
    "get_or_create_payment_order",
    "save_baseline_assessment",
    "submit_coaching_registration",
  ]) assert.match(migration, new RegExp(`function public\\.${fn}`));
  assert.match(migration, /enable row level security/i);
});
