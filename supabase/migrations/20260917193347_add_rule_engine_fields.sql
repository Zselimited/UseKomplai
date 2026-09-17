-- ============================================================================
-- Komplai — Phase 2, Step 1: rule-engine support columns
-- ============================================================================
-- Purely additive. No table is dropped, renamed, or destroyed. No existing
-- column changes type or is removed. No RLS policy on business_profiles or
-- business_obligations changes — new columns are covered automatically by
-- the existing row-level policies (they're row-scoped, not column-scoped).
--
-- What this adds, and why:
--
--   rule_versions:
--     source_authority   — who the rule comes from (e.g. "Nigeria Revenue
--                           Service (NRS)"). Previously nowhere to store this
--                           at all — every result would have had to hardcode
--                           a source string in the UI, which is exactly what
--                           we're trying to avoid.
--     source_url         — link to the official source, shown as "View
--                           source" on a result.
--     explanation        — the plain-language "why this may apply" text
--                           shown to the user. Content, not code.
--     notes              — internal reviewer notes (not shown to users).
--     requires_review    — baseline default for this rule; the engine may
--                           also derive requires_review from the specific
--                           branch matched (see conditions below).
--     conditions         — the actual applicability logic, as structured
--                           data the engine interprets generically. See the
--                           shape note below.
--
--   business_profiles:
--     is_registered      — direct capture of "Is your business registered?"
--                           from the assessment. Previously only inferred
--                           from whether rc_bn_number happened to be filled
--                           in on businesses, which isn't reliable.
--
--   business_obligations:
--     rule_version_id    — which specific version produced the current
--                           result (for traceability + so a later rule
--                           change doesn't silently alter a past result).
--     applicability_status — the assessment result itself. A genuinely new
--                           vocabulary from obligation_periods.status (which
--                           is a workflow state like "overdue" — completely
--                           different meaning), so it needs its own column
--                           and its own CHECK constraint.
--     reason             — snapshot of the explanation at evaluation time.
--     requires_review    — snapshot of whether this result should prompt a
--                           "confirm with a professional" note.
--     evaluated_at       — when this result was computed.
--
-- conditions jsonb shape (documented here since this is regulatory content
-- infrastructure, not just a column):
--
--   {
--     "branches": [
--       { "when": { "field": "...", "op": "eq", "value": true }, "status": "likely_applicable", "reason": "..." },
--       { "when": { "field": "...", "op": "eq", "value": true }, "status": "needs_review", "reason": "..." }
--     ],
--     "default_status": "not_enough_info"
--   }
--
-- Branches are evaluated in order; the first whose "when" condition is
-- known and true wins. A condition on a field the business hasn't answered
-- (null) is treated as unknown and skipped, not as false. If nothing
-- matches, default_status is used. Each branch's own "reason" (optional)
-- overrides the rule_version's top-level `explanation` for that specific
-- outcome, since why a "not_indicated" result was reached usually differs
-- from why a "needs_review" one was. This is what makes the engine
-- generic — it never contains area-specific logic; it only interprets
-- this shape.
-- ============================================================================

alter table public.rule_versions
  add column source_authority text,
  add column source_url text,
  add column explanation text,
  add column notes text,
  add column requires_review boolean not null default true,
  add column conditions jsonb;

comment on column public.rule_versions.conditions is
  'Structured, ordered branches the engine evaluates generically: { branches: [{ when: {field,op,value}, status }], default_status }. This is the actual applicability logic — never hardcode area-specific conditions in application code.';

alter table public.business_profiles
  add column is_registered boolean;

comment on column public.business_profiles.is_registered is
  'Direct answer to "Is your business registered?" from the assessment — distinct from businesses.rc_bn_number, which may be blank even for a registered business that just hasn''t entered its number yet.';

alter table public.business_obligations
  add column rule_version_id uuid references public.rule_versions (id) on delete set null,
  add column applicability_status text
    constraint business_obligations_applicability_status_check
    check (applicability_status in ('likely_applicable', 'may_apply', 'needs_review', 'not_enough_info', 'not_indicated')),
  add column reason text,
  add column requires_review boolean,
  add column evaluated_at timestamptz;

comment on column public.business_obligations.applicability_status is
  'The assessment result for this business/rule, e.g. "likely_applicable". Distinct vocabulary from obligation_periods.status (a filing workflow state) — never conflate the two.';
comment on column public.business_obligations.rule_version_id is
  'Which specific rule_versions row produced applicability_status/reason, snapshotted at evaluated_at. If that rule_version is later revised, this business''s past result does not silently change.';

create index business_obligations_rule_version_id_idx on public.business_obligations (rule_version_id);


-- ============================================================================
-- Necessary RLS exception: let anonymous visitors read approved rule content
-- ============================================================================
-- This is the one RLS change in this migration, and it's deliberate, not
-- incidental. compliance_rules and rule_versions currently only grant
-- SELECT "to authenticated" — an anonymous visitor's browser session has
-- role "anon", not "authenticated", so today it cannot read rule content
-- at all. Since the public assessment must work before signup (explicit
-- product requirement) and must evaluate against real stored rules rather
-- than a client-side placeholder, anonymous read access to *approved,
-- non-sensitive, non-personalized* regulatory reference content is
-- required for that to be possible.
--
-- Scope of this change is deliberately narrow:
--   - Only SELECT, only on compliance_rules and rule_versions.
--   - rule_versions is still filtered to status = 'approved' for anon,
--     identical to the existing authenticated policy — draft/archived
--     rules remain invisible to everyone who isn't editing them directly
--     in the SQL Editor.
--   - Nothing about businesses, business_members, business_profiles, or
--     business_obligations changes. Anonymous visitors still cannot read
--     or write anything business-scoped.

create policy compliance_rules_select_anon
on public.compliance_rules
for select
to anon
using (true);

create policy rule_versions_select_approved_anon
on public.rule_versions
for select
to anon
using (status = 'approved');
