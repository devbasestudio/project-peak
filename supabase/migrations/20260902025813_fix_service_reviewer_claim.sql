-- PostgREST now exposes JWT claims through request.jwt.claims. Keep the legacy
-- setting as a fallback for older gateways, but use auth.jwt() as the source of
-- truth so service-role calls from the central admin retain an audit actor.
create or replace function private.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or (
      p_user_id is not null
      and exists (select 1 from private.admin_users a where a.user_id = p_user_id)
    );
$$;

revoke all on function private.is_admin(uuid) from public;
grant execute on function private.is_admin(uuid) to authenticated, service_role;

create or replace function private.fill_service_reviewer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reviewer_id is null
     and coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    select user_id into new.reviewer_id
    from private.admin_users
    order by created_at asc
    limit 1;
  end if;

  if new.reviewer_id is null then
    raise exception 'Reviewer identity is unavailable' using errcode = '23502';
  end if;

  return new;
end;
$$;

drop trigger if exists payment_reviews_fill_service_reviewer on public.payment_reviews;
create trigger payment_reviews_fill_service_reviewer
before insert on public.payment_reviews
for each row execute function private.fill_service_reviewer();
