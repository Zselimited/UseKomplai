-- ============================================================================
-- Komplai — Phase 1, Step 1: profiles, businesses, business_members
-- ============================================================================
-- This migration creates the foundation identity/access layer only:
--   1. profiles          — one row per Supabase Auth user
--   2. businesses        — a company being tracked
--   3. business_members  — who is allowed to access which business
--
-- It intentionally does NOT create business_profiles, compliance_rules,
-- rule_versions, business_obligations, obligation_periods, documents, or
-- any other later-phase table.
--
-- Run this whole file once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto; make sure it's available.
create extension if not exists pgcrypto;


-- ============================================================================
-- 1. profiles
-- ============================================================================
-- Extends Supabase's built-in auth.users with app-level info. We never
-- duplicate authentication itself — profiles.id always equals auth.users.id.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  phone       text,
  role        text not null default 'business_user'
              constraint profiles_role_check
              check (role in ('business_user', 'expert', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per Supabase Auth user. Created automatically by the on_auth_user_created trigger — never inserted directly by the app.';

alter table public.profiles enable row level security;


-- ============================================================================
-- 2. businesses
-- ============================================================================
-- The company being tracked. Ownership/access is handled entirely through
-- business_members below — there is deliberately no owner_id column here.
-- created_by is for record-keeping only and must never be used for access
-- control.

create table public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  legal_name          text not null
                      constraint businesses_legal_name_not_blank
                      check (btrim(legal_name) <> ''),
  trading_name        text,
  rc_bn_number        text,
  business_type       text,
  date_registered     date,
  industry            text,
  state_of_operation  text,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.businesses is
  'A company being tracked in Komplai. Access is controlled via business_members, not via created_by.';
comment on column public.businesses.created_by is
  'Record-keeping only (who created this business). Must NOT be used for access-control checks.';

alter table public.businesses enable row level security;


-- ============================================================================
-- 3. business_members
-- ============================================================================
-- The single source of truth for "who can access this business". For the
-- MVP every business has exactly one member (role = 'owner'), but the shape
-- already supports adding more members/roles later without a schema change.

create table public.business_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         text not null default 'owner'
               constraint business_members_role_check
               check (role in ('owner')),
  created_at   timestamptz not null default now(),

  constraint business_members_unique_business_user unique (business_id, user_id)
);

comment on table public.business_members is
  'Access-control list: which users belong to which business. The only role for MVP is owner.';

create index business_members_user_id_idx on public.business_members (user_id);

alter table public.business_members enable row level security;


-- ============================================================================
-- 4. Shared helper: keep updated_at current
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();


-- ============================================================================
-- 5. Auto-create a profile row whenever someone signs up
-- ============================================================================
-- This is the ONLY way a profiles row is ever created. Because it's
-- SECURITY DEFINER and owned by the migration-running role (postgres), it
-- bypasses RLS on public.profiles when it inserts — regular client code
-- never needs (and is never granted) INSERT access to this table directly.
-- role is always hardcoded to 'business_user' here, so there is no way for
-- a new user to sign up with an elevated role.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'business_user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ============================================================================
-- 6. Prevent a user from changing their own role
-- ============================================================================
-- Regular RLS policies control which ROWS a user can touch, not which
-- COLUMN VALUES they can set within an allowed row. So even though the
-- update policy below lets a user update their own profile row, this
-- trigger separately blocks any attempt to change the role column.
--
-- For now this blocks ALL role changes unconditionally, including via the
-- SQL editor — there is no admin-role-management path yet. That's a
-- deliberate gap: building a safe "admin changes someone's role" function
-- is a Phase 2/3 decision, not something to add silently here.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Changing role directly is not allowed.';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute function public.protect_profile_role();


-- ============================================================================
-- 7. Helper: is the current user a member of a given business?
-- ============================================================================
-- SECURITY DEFINER + a fixed search_path so it safely bypasses RLS on
-- business_members internally (avoiding infinite recursion when
-- business_members' own policies call this same function) while only ever
-- returning a boolean — it never exposes any row data.

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
grant execute on function public.is_business_member(uuid) to authenticated;


-- ============================================================================
-- 8. RLS policies — profiles
-- ============================================================================
-- A user can see and update only their own row. There is no INSERT or
-- DELETE policy at all for authenticated users — rows are only ever
-- created by the handle_new_user trigger above, and deletion is not
-- supported yet.

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- ============================================================================
-- 9. RLS policies — businesses
-- ============================================================================
-- A user can see or edit a business only if they are a member of it.
-- There is deliberately no INSERT policy: businesses are only ever created
-- through the create_business_with_owner() function below, which also
-- creates the matching business_members row in the same transaction.

create policy businesses_select_members
on public.businesses
for select
to authenticated
using (public.is_business_member(id));

create policy businesses_update_members
on public.businesses
for update
to authenticated
using (public.is_business_member(id))
with check (public.is_business_member(id));


-- ============================================================================
-- 10. RLS policies — business_members
-- ============================================================================
-- A user can see membership rows only for businesses they already belong
-- to. There is NO insert/update/delete policy for authenticated users at
-- all — membership can only be created via create_business_with_owner()
-- below. This is what actually closes the "insert my own membership row
-- into someone else's business" hole: it's not that we wrote a clever
-- policy, it's that no direct write path exists for regular users.

create policy business_members_select_own_business
on public.business_members
for select
to authenticated
using (public.is_business_member(business_id));


-- ============================================================================
-- 11. Business creation — secure function
-- ============================================================================
-- Creates a business AND its owning membership row together, atomically.
-- SECURITY DEFINER so it can perform both inserts despite neither table
-- having a client-facing INSERT policy. It always uses auth.uid() for the
-- new membership — there is no user_id parameter, so a caller can never
-- attach a different user (or themselves) to a different, pre-existing
-- business_id. Each call only ever touches the business row it just created.

create or replace function public.create_business_with_owner(
  p_legal_name         text,
  p_trading_name       text default null,
  p_rc_bn_number       text default null,
  p_business_type      text default null,
  p_date_registered    date default null,
  p_industry           text default null,
  p_state_of_operation text default null
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a business.';
  end if;

  if p_legal_name is null or btrim(p_legal_name) = '' then
    raise exception 'legal_name is required.';
  end if;

  insert into public.businesses (
    legal_name, trading_name, rc_bn_number, business_type,
    date_registered, industry, state_of_operation, created_by
  )
  values (
    p_legal_name, p_trading_name, p_rc_bn_number, p_business_type,
    p_date_registered, p_industry, p_state_of_operation, auth.uid()
  )
  returning * into v_business;

  insert into public.business_members (business_id, user_id, role)
  values (v_business.id, auth.uid(), 'owner');

  return v_business;
end;
$$;

revoke all on function public.create_business_with_owner(
  text, text, text, text, date, text, text
) from public;
grant execute on function public.create_business_with_owner(
  text, text, text, text, date, text, text
) to authenticated;
