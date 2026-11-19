-- Run in a new Supabase project's SQL Editor. Safe to run again.
create table if not exists public.viewer_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) < 64000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.viewer_settings enable row level security;
revoke all on public.viewer_settings from anon;
grant select, insert, update on public.viewer_settings to authenticated;
drop policy if exists settings_select_own on public.viewer_settings;
create policy settings_select_own on public.viewer_settings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists settings_insert_own on public.viewer_settings;
create policy settings_insert_own on public.viewer_settings for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists settings_update_own on public.viewer_settings;
create policy settings_update_own on public.viewer_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.save_viewer_settings(p_payload jsonb, p_expected_revision bigint)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security invoker set search_path = public, pg_temp as $$
declare saved public.viewer_settings; current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) >= 64000 then raise exception 'invalid_settings'; end if;
  if p_expected_revision = 0 then
    insert into public.viewer_settings(user_id,payload) values(current_user_id,p_payload)
      on conflict(user_id) do nothing returning * into saved;
  else
    update public.viewer_settings as s set payload=p_payload, revision=s.revision+1, updated_at=clock_timestamp()
      where s.user_id=current_user_id and s.revision=p_expected_revision returning s.* into saved;
  end if;
  if saved.user_id is null then raise exception 'settings_conflict'; end if;
  return query select saved.revision, saved.updated_at;
end; $$;
revoke all on function public.save_viewer_settings(jsonb,bigint) from public, anon;
grant execute on function public.save_viewer_settings(jsonb,bigint) to authenticated;
