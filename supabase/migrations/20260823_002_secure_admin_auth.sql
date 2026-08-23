begin;

-- A short-lived record created only after the username and password are valid.
create table if not exists public.admin_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_auth_challenges_attempts_check
    check (attempts between 0 and 10),
  constraint admin_auth_challenges_expiry_check
    check (expires_at > created_at)
);

-- A session appears here only after both password and email OTP succeed.
create table if not exists public.admin_verified_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  verified_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  constraint admin_verified_sessions_expiry_check
    check (expires_at > verified_at)
);

create index if not exists admin_auth_challenges_user_expiry_idx
  on public.admin_auth_challenges (user_id, expires_at desc);

create index if not exists admin_auth_challenges_expiry_idx
  on public.admin_auth_challenges (expires_at);

create index if not exists admin_verified_sessions_user_idx
  on public.admin_verified_sessions (user_id);

create index if not exists admin_verified_sessions_expiry_idx
  on public.admin_verified_sessions (expires_at);

alter table public.admin_auth_challenges enable row level security;
alter table public.admin_verified_sessions enable row level security;

-- No anon/authenticated policies are created. Only the server-side secret
-- client may manage these two tables.
revoke all on table
  public.admin_auth_challenges,
  public.admin_verified_sessions
from anon, authenticated;

grant select, insert, update, delete on table
  public.admin_auth_challenges,
  public.admin_verified_sessions
to service_role;

-- All existing admin policies already call this function. Replacing it here
-- upgrades every admin policy at once: approved email + verified session.
create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(coalesce((select auth.jwt()) ->> 'email', '')) in (
      'arilskydrive05@gmail.com',
      'hrmanajement@outlook.com'
    )
    and exists (
      select 1
      from public.admin_verified_sessions as verified
      where verified.session_id::text =
        coalesce((select auth.jwt()) ->> 'session_id', '')
        and verified.user_id = (select auth.uid())
        and verified.expires_at > timezone('utc', now())
    );
$$;

revoke all on function public.is_approved_admin() from public;
grant execute on function public.is_approved_admin() to anon, authenticated;

commit;
