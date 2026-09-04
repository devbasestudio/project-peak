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

test("member guidance is fixed in the app instead of admin-authored blocks", async () => {
  const guide = await read("src/components/app-shell/fixed-guide-screen.tsx");
  for (const variant of ["baseline", "workout", "phase2", "completion"]) {
    assert.match(guide, new RegExp(`${variant}:`));
  }
  assert.match(guide, /စမ်းပြဖို့ မဟုတ်ဘူး/);
  assert.match(guide, /လုပ်ရမှာ သုံးခုပဲ/);
  for (const route of [
    "src/app/[locale]/app/page.tsx",
    "src/app/[locale]/app/baseline/page.tsx",
    "src/app/[locale]/app/workout/page.tsx",
    "src/app/[locale]/app/completion/page.tsx",
  ]) {
    const source = await read(route);
    assert.doesNotMatch(source, /program_blocks|program_documents/);
  }
});

test("member exercise videos stream through an authenticated same-origin range endpoint", async () => {
  const workout = await read("src/app/[locale]/app/workout/page.tsx");
  const mediaRoute = await read("src/app/api/member-media/[assetId]/route.ts");
  assert.match(workout, /\/api\/member-media\/\$\{video\.asset_id\}/);
  assert.doesNotMatch(workout, /createSignedUrl/);
  assert.match(mediaRoute, /auth\.getUser\(\)/);
  assert.match(mediaRoute, /from\("media_assets"\)/);
  assert.match(mediaRoute, /request\.headers\.get\("range"\)/);
  assert.match(mediaRoute, /upstream\.body/);
  assert.match(mediaRoute, /private, max-age=300/);
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

test("the saved weekly date is enforced before a member can train", async () => {
  const workout = await read("src/app/[locale]/app/workout/page.tsx");
  const completion = await read("src/app/[locale]/app/completion/page.tsx");
  const migration = await read("supabase/migrations/20260903063037_align_member_flow_with_final_challenge.sql");
  assert.match(workout, /scheduledDay\.scheduled_date > today/);
  assert.match(workout, /app\/rest/);
  assert.match(completion, /finalSlot\.scheduled_date > today/);
  assert.match(migration, /function private\.enforce_weekly_schedule_gate/);
  assert.match(migration, /v_scheduled_date > v_today/);
});

test("Day 48 is an atomic final challenge instead of a regular workout", async () => {
  const action = await read("src/app/customer-actions.ts");
  const migration = await read("supabase/migrations/20260903063037_align_member_flow_with_final_challenge.sql");
  const workout = await read("src/app/[locale]/app/workout/page.tsx");
  assert.match(action, /complete_final_challenge/);
  assert.match(migration, /function public\.complete_final_challenge/);
  assert.match(migration, /day_number = 48/);
  assert.match(migration, /session_type, status/);
  assert.match(migration, /'challenge', 'completed'/);
  assert.match(workout, />= 47\) redirect\(`\/\$\{locale\}\/app\/completion`\)/);
});

test("regular workout completion opens a dedicated summary and learning screen", async () => {
  const player = await read("src/components/app-shell/workout-player.tsx");
  const route = await read("src/app/[locale]/app/session-complete/page.tsx");
  const view = await read("src/components/app-shell/session-complete-view.tsx");
  assert.match(player, /app\/session-complete\?day=/);
  assert.match(route, /program_day_assets/);
  assert.match(view, /Today’s work is done/);
  assert.match(view, /variant="phase2"/);
});

test("a rejected payment returns the member to a fresh reference step", async () => {
  const page = await read("src/app/[locale]/app/page.tsx");
  const dashboard = await read("src/components/app-shell/customer-dashboard.tsx");
  const account = await read("src/components/app-shell/account-panel.tsx");
  const migration = await read("supabase/migrations/20260902112631_harden_project_peak_transactions_and_rls.sql");

  assert.match(page, /review_note/);
  assert.match(dashboard, /orderNeedsReplacement/);
  assert.match(dashboard, /Reference အသစ်ထုတ်မယ်/);
  assert.match(dashboard, /window\.setInterval\(refresh, 10_000\)/);
  assert.match(account, /Create a new payment reference/);
  assert.match(migration, /status in \('awaiting_payment', 'submitted', 'approved'\)/);
  assert.doesNotMatch(migration, /status in \('awaiting_payment', 'submitted', 'approved', 'rejected'\)/);
});
