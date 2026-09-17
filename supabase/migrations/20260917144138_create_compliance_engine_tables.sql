-- ============================================================================
-- Komplai — Phase 1, Step 2: the compliance engine layer
-- ============================================================================
-- This migration creates:
--   1. business_profiles     — diagnostic answers for one business (1:1)
--   2. compliance_rules      — stable identity of a rule (e.g. "VAT")
--   3. rule_versions         — a dated, specific set of criteria for a rule
--   4. business_obligations  — "this business is subject to this rule"
--   5. obligation_periods    — one specific due instance (e.g. "VAT — Sept 2026")
--
-- It depends on profiles, businesses, business_members, is_business_member(),
-- and set_updated_at() from the prior migration
-- (20260913212208_create_profiles_businesses_business_members.sql) and does
-- NOT modify that file in any way.
--
-- Design intent:
--   - Column choices (business_type text[], category text, filing_frequency
--     text, etc.) are deliberately left as free text/arrays rather than
--     fixed CHECK lists, so CAC, VAT, PAYE, WHT and CIT can all be
--     represented today without a schema change, and more obligation types
--     can be added later the same way.
--   - No rows of actual rule content are inserted by this migration — only
--     structure. Populating real, reviewed regulatory rules is a separate,
--     deliberate step, not something to fabricate here.
--   - compliance_rules and rule_versions have NO insert/update/delete
--     policies for regular users at all — this is what "keep compliance
--     rules separate from the frontend" means at the database level. For
--     now, rule content can only be managed directly in the SQL Editor
--     (as the postgres role, which bypasses RLS as the table owner). A
--     proper admin-only write path is a future decision, not built here.
--
-- Run this whole file once in the Supabase SQL Editor, AFTER the prior
-- migration has already been applied.
-- ============================================================================


-- ============================================================================
-- 1. business_profiles
-- ============================================================================
-- The diagnostic answers used to determine which obligations apply to a
-- business. One-to-one with businesses. Access follows the same
-- is_business_member() rule as businesses itself — a member can read and
-- fill this in directly (unlike businesses/business_members, inserting a
-- row here never grants anyone new access, so no special function is
-- needed).

create table public.business_profiles (
  id                               uuid primary key default gen_random_uuid(),
  business_id                      uuid not null unique references public.businesses (id) on delete cascade,

  number_of_employees              integer check (number_of_employees >= 0),
  has_employees                    boolean,
  uses_contractors                 boolean,
  estimated_annual_revenue_band    text,
  sells_taxable_goods_or_services  boolean,
  is_vat_registered                boolean,
  has_tin                          boolean,
  tin_number                       text,
  paye_currently_remitted          boolean,
  wht_applies                      boolean,
  last_cac_annual_return_filed_date date,
  last_cit_filing_date             date,
  has_tcc                          boolean,
  known_outstanding_filings        text,

  diagnostic_completed_at          timestamptz,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now()
);

comment on table public.business_profiles is
  'One-to-one diagnostic answers for a business, used to determine which compliance rules apply. estimated_annual_revenue_band is free text on purpose — no fixed bands have been defined yet.';

alter table public.business_profiles enable row level security;

create trigger set_business_profiles_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

create policy business_profiles_select_members
on public.business_profiles
for select
to authenticated
using (public.is_business_member(business_id));

create policy business_profiles_insert_members
on public.business_profiles
for insert
to authenticated
with check (public.is_business_member(business_id));

create policy business_profiles_update_members
on public.business_profiles
for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));


-- ============================================================================
-- 2. compliance_rules
-- ============================================================================
-- The stable identity of a rule — e.g. "VAT" always refers to the same row,
-- regardless of how the underlying criteria change over time. Not sensitive
-- by itself (just a name/category), so any signed-in user may read it. Only
-- rule_versions below carries the actual criteria and draft/approved status.

create table public.compliance_rules (
  id                uuid primary key default gen_random_uuid(),
  rule_code         text not null unique
                    constraint compliance_rules_rule_code_not_blank
                    check (btrim(rule_code) <> ''),
  category          text not null,
  obligation_name   text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.compliance_rules is
  'Stable identity of a compliance rule (e.g. "VAT"). category is free text on purpose (expected values for MVP: tax, corporate) to stay flexible for future obligation types. Actual applicability logic lives in rule_versions, not here.';

alter table public.compliance_rules enable row level security;

create trigger set_compliance_rules_updated_at
before update on public.compliance_rules
for each row execute function public.set_updated_at();

-- Rule identities are not sensitive — any signed-in user may read them.
-- No insert/update/delete policy exists for authenticated users: rule
-- content is managed directly in the SQL Editor for now.
create policy compliance_rules_select_authenticated
on public.compliance_rules
for select
to authenticated
using (true);


-- ============================================================================
-- 3. rule_versions
-- ============================================================================
-- A dated, specific snapshot of a rule's actual criteria and logic. When a
-- regulation changes, a new version row is added — existing versions are
-- never edited to reflect a change, so historical obligation_periods keep
-- referencing exactly the rule text that applied to them at the time.
--
-- status defaults to 'draft'. Only 'approved' versions are ever visible to
-- regular users (see the select policy below) — this is what prevents an
-- unreviewed rule from ever reaching a customer.

create table public.rule_versions (
  id                          uuid primary key default gen_random_uuid(),
  rule_id                     uuid not null references public.compliance_rules (id) on delete cascade,
  version_number              integer not null check (version_number > 0),

  applicable_business_types   text[],
  min_employees               integer check (min_employees >= 0),
  max_employees               integer check (max_employees >= 0),
  min_revenue                 numeric check (min_revenue >= 0),
  max_revenue                 numeric check (max_revenue >= 0),
  filing_frequency            text not null,
  due_date_rule                text not null,
  required_documents           text[],
  required_action_description  text not null,

  effective_date              date not null,
  expiry_date                 date,
  status                      text not null default 'draft'
                              constraint rule_versions_status_check
                              check (status in ('draft', 'approved', 'archived')),
  reviewed_by                 uuid references public.profiles (id) on delete set null,
  last_reviewed_at            timestamptz,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint rule_versions_unique_rule_version unique (rule_id, version_number),
  constraint rule_versions_expiry_after_effective
    check (expiry_date is null or expiry_date > effective_date),
  constraint rule_versions_employee_range
    check (min_employees is null or max_employees is null or min_employees <= max_employees),
  constraint rule_versions_revenue_range
    check (min_revenue is null or max_revenue is null or min_revenue <= max_revenue)
);

comment on table public.rule_versions is
  'A dated snapshot of one rule''s actual applicability criteria and logic. filing_frequency is free text on purpose (expected values for MVP: monthly, quarterly, annually, one_off). Only status = approved rows are visible to regular users.';
comment on column public.rule_versions.applicable_business_types is
  'Free text array on purpose, expected to line up with businesses.business_type values (e.g. sole_proprietorship, llc, partnership, ngo) — not enforced at the database level.';

create index rule_versions_rule_id_idx on public.rule_versions (rule_id);
create index rule_versions_status_idx on public.rule_versions (status);

alter table public.rule_versions enable row level security;

create trigger set_rule_versions_updated_at
before update on public.rule_versions
for each row execute function public.set_updated_at();

-- Regular users only ever see approved versions. Draft/archived rows stay
-- invisible to them, regardless of how the row was reached. No
-- insert/update/delete policy exists for authenticated users — same reason
-- as compliance_rules above.
create policy rule_versions_select_approved
on public.rule_versions
for select
to authenticated
using (status = 'approved');


-- ============================================================================
-- 4. business_obligations
-- ============================================================================
-- "This business is subject to this rule" — an ongoing fact about a
-- business, independent of which rule_version is currently active. Points
-- at the stable rule (compliance_rules), never at a specific version.

create table public.business_obligations (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null references public.businesses (id) on delete cascade,
  rule_id                uuid not null references public.compliance_rules (id) on delete restrict,
  is_active              boolean not null default true,
  first_applicable_date  date,
  generated_at           timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint business_obligations_unique_business_rule unique (business_id, rule_id)
);

comment on table public.business_obligations is
  'Links a business to a rule that applies to it — the personalized register. A business can only have one obligation row per rule.';

create index business_obligations_business_id_idx on public.business_obligations (business_id);
create index business_obligations_rule_id_idx on public.business_obligations (rule_id);

alter table public.business_obligations enable row level security;

create trigger set_business_obligations_updated_at
before update on public.business_obligations
for each row execute function public.set_updated_at();

create policy business_obligations_select_members
on public.business_obligations
for select
to authenticated
using (public.is_business_member(business_id));

create policy business_obligations_insert_members
on public.business_obligations
for insert
to authenticated
with check (public.is_business_member(business_id));

create policy business_obligations_update_members
on public.business_obligations
for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));


-- ============================================================================
-- 5. obligation_periods
-- ============================================================================
-- One specific due instance of an obligation (e.g. "VAT — September 2026").
-- Records which rule_version was in effect when it was generated, so the
-- historical record stays accurate even if that rule is amended later.
--
-- business_id is intentionally duplicated here (it's derivable by joining
-- through business_obligations) so the RLS policy below can be a single
-- direct check instead of a multi-level join — the same pattern used for
-- documents/reminders/etc. in the overall design. A trigger keeps it
-- honest so it can never drift from the parent business_obligation.

create table public.obligation_periods (
  id                      uuid primary key default gen_random_uuid(),
  business_obligation_id  uuid not null references public.business_obligations (id) on delete cascade,
  rule_version_id         uuid not null references public.rule_versions (id) on delete restrict,
  business_id             uuid not null references public.businesses (id) on delete cascade,

  period_label            text not null,
  due_date                date not null,
  status                  text not null default 'upcoming'
                          constraint obligation_periods_status_check
                          check (status in ('upcoming', 'action_required', 'in_progress', 'awaiting_user_action', 'completed', 'overdue')),
  completed_at            timestamptz,
  completed_by            uuid references public.profiles (id) on delete set null,
  notes                   text,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint obligation_periods_unique_label unique (business_obligation_id, period_label),
  constraint obligation_periods_completed_consistency
    check ((status = 'completed') = (completed_at is not null))
);

comment on table public.obligation_periods is
  'One specific due instance of a business_obligation, e.g. "VAT — September 2026". business_id is denormalized from business_obligations for simpler, safer RLS — kept in sync by a trigger.';

create index obligation_periods_business_id_idx on public.obligation_periods (business_id);
create index obligation_periods_business_obligation_id_idx on public.obligation_periods (business_obligation_id);
create index obligation_periods_rule_version_id_idx on public.obligation_periods (rule_version_id);
create index obligation_periods_due_date_idx on public.obligation_periods (due_date);
create index obligation_periods_status_idx on public.obligation_periods (status);

alter table public.obligation_periods enable row level security;

create trigger set_obligation_periods_updated_at
before update on public.obligation_periods
for each row execute function public.set_updated_at();

-- Keep business_id honest: it must always match the business_id of the
-- business_obligation this period belongs to, even though it's stored
-- redundantly for RLS simplicity.
create or replace function public.check_obligation_period_business_id()
returns trigger
language plpgsql
as $$
begin
  if new.business_id <> (
    select business_id from public.business_obligations where id = new.business_obligation_id
  ) then
    raise exception 'business_id does not match the business_obligation''s business_id.';
  end if;
  return new;
end;
$$;

create trigger check_obligation_period_business_id_trigger
before insert or update on public.obligation_periods
for each row execute function public.check_obligation_period_business_id();

create policy obligation_periods_select_members
on public.obligation_periods
for select
to authenticated
using (public.is_business_member(business_id));

create policy obligation_periods_insert_members
on public.obligation_periods
for insert
to authenticated
with check (public.is_business_member(business_id));

create policy obligation_periods_update_members
on public.obligation_periods
for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));
