# Project Peak Supabase setup

Apply `migrations/202608300001_project_peak.sql` to the target project, then:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the app environment. Never expose the management PAT or service-role key to the browser.
2. Enable Google Auth. Google Cloud's redirect URI is `https://gzcostlnfwuvtihuzice.supabase.co/auth/v1/callback`. Add the deployed `/auth/callback` URL and `http://localhost:3000/auth/callback` to the Supabase redirect allow list.
3. After the first owner signs in, call `bootstrap_first_admin` once with that Auth user UUID using the service-role client. The function refuses to run after an admin exists.
4. Fill the KPay account/QR fields in `payment_instructions`; the seed only has the supplied screenshot contact handle.
5. Upload media to immutable versioned paths in `program-media`, insert matching `media_assets` rows, and reference those asset IDs from a draft template. Publish by updating the draft `template_versions.status` to `published`.

`approve_payment_order(order_id, template_version_id?)` is called by a signed-in admin. It atomically approves the order and deep-copies the published template into customer-owned `program_*` rows. Existing customer programs never read mutable template rows.

The customer app calls `complete_session(program_id, day_number, local_date, mutation_id)`. The RPC validates the queue position and every prescribed set, prevents two completed sessions on one phone-local day, and applies Phase 2 progression idempotently.

