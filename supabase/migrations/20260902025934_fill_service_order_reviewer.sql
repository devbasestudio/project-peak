-- The central admin uses a server-side service-role client after validating its
-- one-device OTP session. Preserve the real admin actor on the order as well as
-- on payment_reviews when the approval RPC updates reviewed_by with auth.uid().
create or replace function private.fill_service_order_reviewer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reviewed_by is null
     and new.status in ('approved', 'rejected')
     and coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    select user_id into new.reviewed_by
    from private.admin_users
    order by created_at asc
    limit 1;
  end if;

  if new.status in ('approved', 'rejected') and new.reviewed_by is null then
    raise exception 'Order reviewer identity is unavailable' using errcode = '23502';
  end if;

  return new;
end;
$$;

drop trigger if exists payment_orders_fill_service_reviewer on public.payment_orders;
create trigger payment_orders_fill_service_reviewer
before update of status, reviewed_by on public.payment_orders
for each row execute function private.fill_service_order_reviewer();
