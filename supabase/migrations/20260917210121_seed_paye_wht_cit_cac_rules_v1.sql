-- ============================================================================
-- Komplai — Phase 3: seed PAYE, WHT, CIT and CAC (all v1, all draft)
-- ============================================================================
-- Content only, additive, reversible — same pattern as the VAT seed file
-- (20260917194613_seed_vat_rule_v1.sql). All four rules land as
-- status = 'draft': invisible to every real user (anon and authenticated
-- alike) until a human reviews the sources below and runs the UPDATE at
-- the bottom of this file per rule. Safe to run more than once (every
-- insert is a no-op on conflict).
--
-- To reverse (before approval): delete the four compliance_rules rows by
-- rule_code; rule_versions rows cascade with them (rule_versions.rule_id
-- has "on delete cascade"). No other table is touched by this file.
--
--   delete from public.compliance_rules where rule_code in ('PAYE','WHT','CIT','CAC');
--
-- All four use the same EvaluationInput fields already collected and
-- persisted by the existing assessment/onboarding flow (has_employees,
-- uses_contractors, is_registered, business_type) — no assessment or
-- schema changes were needed for this phase; that gap was already closed
-- when VAT was implemented.
--
-- Wrapped in one explicit transaction covering all four rules: either
-- every compliance_rules row and its matching rule_versions row land
-- together, or none of them do. Without this, a SQL client that
-- auto-commits each statement independently can leave compliance_rules
-- rows committed while their rule_versions inserts are lost — exactly the
-- state this file has recovered from once already.
-- ============================================================================

begin;


-- ============================================================================
-- PAYE — Pay As You Earn
-- ============================================================================
-- SOURCE: Nigeria Tax Administration Act, 2025, 2025 No. 5 (commenced
-- 1 January 2026), s.14.
-- Reference: https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act
--
--   s.14(1): "An employer shall file a return with the relevant tax
--   authority for all emoluments paid to its employees, not later than
--   31st January of each year in respect of all employees in its
--   employment in the preceding year."
--
-- WHY requires_review = true even for "likely_applicable": s.14 verifies
-- only the ANNUAL return deadline. Monthly deduction/remittance mechanics
-- are governed by Chapter Two of the Nigeria Tax Act, 2025 (taxation of
-- income of persons) and by regulations, neither independently verified
-- line-by-line for this rule. The Personal Income Tax Act, Cap. P8 LFN
-- 2004 (which historically governed PAYE administration) is repealed by
-- the Nigeria Tax Act, 2025 repeal schedule — its substance is understood
-- to be consolidated into the new framework, but this has not been traced
-- provision-by-provision.

insert into public.compliance_rules (rule_code, category, obligation_name)
values ('PAYE', 'tax', 'Pay As You Earn')
on conflict (rule_code) do nothing;

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  1,
  'annually',
  'Annually, not later than 31 January following the year of assessment, for the employer''s return of emoluments and tax deducted. Nigeria Tax Administration Act, 2025, s.14(1).',
  'If PAYE applies: deduct income tax from employee salaries each pay period and file an annual return of emoluments and tax deducted by 31 January following the year. Confirm exact remittance timing and computation with the Nigeria Revenue Service or a professional, as these are set out in Chapter Two of the Nigeria Tax Act, 2025 and separate regulations which Komplai has not yet verified in full.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'PAYE (Pay As You Earn) is the system under which employers deduct income tax from employee salaries and remit it to the tax authority. Employers with employees are generally required to operate PAYE and file an annual return of emoluments and deductions under the Nigeria Tax Administration Act, 2025.',
  'Verified: Nigeria Tax Administration Act, 2025, s.14(1) — the employer''s ANNUAL return, due 31 January. Not independently verified: monthly deduction/remittance computation mechanics (governed by Chapter Two of the Nigeria Tax Act, 2025 and separate regulations). The Personal Income Tax Act, Cap. P8 LFN 2004 is repealed per the Nigeria Tax Act, 2025 repeal schedule. requires_review = true reflects that remittance-level detail has not been independently verified, even though the underlying "does this business have a PAYE obligation" question is well-supported for any business with employees.',
  true,
  '{
    "branches": [
      {
        "when": { "field": "has_employees", "op": "eq", "value": true },
        "status": "likely_applicable",
        "reason": "You indicated your business has employees. Employers are generally required to operate PAYE and file an annual return of employee emoluments and tax deducted under the Nigeria Tax Administration Act, 2025."
      },
      {
        "when": { "field": "has_employees", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "Based on your answer that your business has no employees, PAYE employer obligations do not appear to apply — revisit this if you take on employees."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'PAYE'
on conflict (rule_id, version_number) do nothing;


-- ============================================================================
-- WHT — Withholding Tax
-- ============================================================================
-- SOURCE: Nigeria Tax Administration Act, 2025, ss.28, 51.
-- Reference: https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act
--
--   s.51(1): "Where any payment is made to a person, the person making
--   the payment shall, at the date when payment is made or otherwise
--   settled, deduct the tax at the rate prescribed in regulations
--   relating to deduction of tax at source."
--
--   s.28: "Every person who has an obligation to deduct and remit tax
--   under this Act or any other tax legislation shall render monthly
--   returns to the appropriate tax authority, as specified in the
--   regulation issued for that purpose."
--
-- WHY status is capped at "needs_review" and never "likely_applicable":
-- s.51(1) explicitly defers the applicable RATE to separate regulations,
-- which have not been located or reviewed. No minimum-threshold exemption
-- for withholding tax was found in either the Nigeria Tax Administration
-- Act, 2025 or the Nigeria Tax Act, 2025 (both searched directly for this
-- phase) — older regulations under the pre-2026 regime reportedly carried
-- per-transaction minimums, but these have not been confirmed to carry
-- forward, so nothing is encoded here. This is a materially thinner
-- evidence base than VAT or PAYE, hence the more conservative cap.

insert into public.compliance_rules (rule_code, category, obligation_name)
values ('WHT', 'tax', 'Withholding Tax')
on conflict (rule_code) do nothing;

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  1,
  'monthly',
  'Monthly returns are required for tax deducted and remitted at source (Nigeria Tax Administration Act, 2025, s.28); the exact remittance deadline and rate are prescribed in separate regulations relating to deduction of tax at source (s.51), which Komplai has not yet located or verified.',
  'If withholding tax applies to a payment your business makes: deduct tax at the applicable rate before paying the recipient, and remit it monthly to the relevant tax authority. Confirm the applicable rate, any minimum threshold, and exact remittance deadline with the Nigeria Revenue Service or a professional — these are set out in regulations Komplai has not yet verified.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'Withholding tax is tax deducted at source from certain payments (such as to contractors, vendors, or professionals) and remitted to the tax authority on behalf of the recipient, as an advance payment against their final tax liability.',
  'Verified: Nigeria Tax Administration Act, 2025, s.51(1) establishes the general deduction-at-source obligation; s.28 establishes a monthly return cadence for anyone with a deduct-and-remit obligation. Not verified: the actual rate(s) and any minimum threshold, which s.51(1) itself defers to "regulations relating to deduction of tax at source" — a separate instrument not reviewed for this rule. No numeric threshold was found in either the Nigeria Tax Administration Act, 2025 or the Nigeria Tax Act, 2025 (both searched directly). Status is deliberately capped at needs_review (never likely_applicable) until those regulations are located and reviewed.',
  true,
  '{
    "branches": [
      {
        "when": { "field": "uses_contractors", "op": "eq", "value": true },
        "status": "needs_review",
        "reason": "You indicated your business makes payments to contractors or vendors. Certain payments require tax to be deducted at source under the Nigeria Tax Administration Act, 2025, s.51 — the specific rate and any minimum threshold are set out in separate regulations which Komplai has not yet verified."
      },
      {
        "when": { "field": "uses_contractors", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "Based on your answer that your business does not make payments to contractors or vendors, withholding tax obligations do not appear to apply — revisit this if that changes."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'WHT'
on conflict (rule_id, version_number) do nothing;


-- ============================================================================
-- CIT — Company Income Tax
-- ============================================================================
-- SOURCE: Nigeria Tax Act, 2025, 2025 No. 7 (commenced 1 January 2026),
-- s.56 and the Act's Interpretation clause ("small company").
-- Reference: https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act
--
--   s.56: "Tax shall be levied, for each year of assessment in respect of
--   total profits of every company, in the case of— (a) a small company,
--   at 0%; and (b) any other company, at the rate of 30 per cent from the
--   commencement of this Act."
--
--   Interpretation clause: "'small company' means a company that earns
--   gross turnover of N50,000,000 or less per annum with total fixed
--   assets not exceeding N250,000,000, provided that any business
--   providing professional services shall not be classified as a small
--   company;"
--
-- IMPORTANT — do not confuse with the VAT rule's "Small Business"
-- definition: that one (Nigeria Tax Administration Act, 2025, s.147) uses
-- a DIFFERENT turnover threshold (N100,000,000). This is a separate
-- defined term, "small company" (Nigeria Tax Act, 2025, Interpretation
-- clause), at N50,000,000, used specifically for the CIT rate. Confirmed
-- by direct text search that neither Act cross-references the other's
-- term for this purpose — they are genuinely two different tests.
--
-- WHY "likely_applicable" for a registered LLC despite the rate being
-- uncertain: s.56 makes every company (small or not) part of the CIT
-- chargeable framework and subject to a filing obligation — the 0%/30%
-- question affects how much is owed, not whether the filing obligation
-- itself exists. Komplai does not yet collect turnover/fixed-asset data,
-- so which rate applies is left to requires_review and the explanation
-- text, not to the status.

insert into public.compliance_rules (rule_code, category, obligation_name)
values ('CIT', 'tax', 'Company Income Tax')
on conflict (rule_code) do nothing;

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  1,
  'annually',
  'Annually, for each year of assessment, per the Nigeria Tax Act, 2025, s.56. Komplai has not independently verified the exact company income tax return filing deadline (distinct from the rate itself) for this version.',
  'If CIT applies: file an annual company income tax return. Whether tax is actually payable depends on your rate — companies are taxed at 30%, except a "small company" (gross turnover of N50,000,000 or less per year and total fixed assets of N250,000,000 or less, and not a professional services business), which is taxed at 0%. Confirm your classification with the Nigeria Revenue Service or a professional.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'Company Income Tax is charged on the profits of registered companies. Under the Nigeria Tax Act, 2025, the rate is 30% for most companies, but a qualifying "small company" is taxed at 0%. Sole proprietorships and partnerships are generally not "companies" for this purpose and are taxed differently.',
  'Verified: Nigeria Tax Act, 2025, s.56 (rate: 30% standard, 0% for a "small company") and the Act''s own Interpretation clause defining "small company" as gross turnover <= N50,000,000 and fixed assets <= N250,000,000, excluding professional services. This is a DIFFERENT defined term and threshold from the VAT rule''s "Small Business" (Nigeria Tax Administration Act, 2025, s.147, N100,000,000) — confirmed by direct text search that the two Acts use separate, non-cross-referencing definitions. Komplai does not collect turnover/fixed-asset data, so the 0%-vs-30% question cannot be resolved; status reflects only whether the CIT filing framework applies at all, not the rate. Partnership and NGO treatment under this Act has not been separately verified for this version, hence needs_review rather than not_indicated for those business types.',
  true,
  '{
    "branches": [
      {
        "when": { "all": [ { "field": "is_registered", "op": "eq", "value": true }, { "field": "business_type", "op": "eq", "value": "llc" } ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is a registered Limited Liability Company. Registered companies are generally subject to the Company Income Tax framework under the Nigeria Tax Act, 2025 — whether you pay 0% or 30% depends on whether you qualify as a small company (turnover and fixed-asset thresholds we have not yet collected)."
      },
      {
        "when": { "field": "business_type", "op": "in", "value": ["partnership", "ngo"] },
        "status": "needs_review",
        "reason": "Partnerships and NGOs can have different Company Income Tax treatment from standard limited liability companies, which Komplai has not yet independently verified — confirm your specific position with a professional."
      },
      {
        "when": { "field": "business_type", "op": "eq", "value": "sole_proprietorship" },
        "status": "not_indicated",
        "reason": "Sole proprietorships (business names) are generally not \"companies\" for Company Income Tax purposes and are typically taxed differently — this does not appear to apply based on your business type."
      },
      {
        "when": { "field": "is_registered", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "Company Income Tax applies to registered companies — based on your answer that your business isn''t registered, this does not appear to apply yet."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'CIT'
on conflict (rule_id, version_number) do nothing;


-- ============================================================================
-- CAC — Corporate Affairs Commission Annual Returns
-- ============================================================================
-- SOURCE: Companies and Allied Matters Act, 2020 ("CAMA"), ss.417, 418,
-- 419, 420 (companies), 822 (business names), 848 (incorporated
-- trustees). This is a wholly different regulator and statute from the
-- Nigeria Revenue Service / tax Acts above.
-- Reference: https://www.cac.gov.ng/wp-content/uploads/2020/12/CAMA-NOTE-BOOK-FULL-VERSION.pdf
-- (official CAC-hosted copy; fetched via a verified mirror after cac.gov.ng
-- blocked automated retrieval — content cross-checked, not guessed).
--
--   s.417 (companies): "Every company shall, once at least in every year,
--   make and deliver to the Commission an annual return... Provided that
--   a company need not make a return under this section either in the
--   year of its incorporation or, if it is not required by section 237 to
--   hold an annual general meeting during the following year, in that
--   year."
--
--   s.822(1) (business names): "Every individual, firm or corporation
--   carrying on business under a registered business name shall, not
--   later than the 30th day of June in each year, except the calendar
--   year in which the business name is registered, deliver to the
--   Commission a return..."
--
--   s.848(1) (incorporated trustees, e.g. many NGOs): "The trustees of the
--   association shall, not earlier than 30th June or later than 31st
--   December each year (other than the year in which it is
--   incorporated), submit to the Commission a return..."
--
-- WHY one generic rule rather than branching by entity type: all three
-- verified provisions converge on the same shape — an annual return is
-- owed by every registered entity type in our business_type list,
-- exempt in the year of registration, with the exact form/window
-- differing by entity type. Komplai does not yet ask enough to determine
-- exactly which CAMA section governs a given business, so the reason
-- text names the general obligation and points out that the specific
-- deadline depends on entity type, rather than guessing a single date.

insert into public.compliance_rules (rule_code, category, obligation_name)
values ('CAC', 'corporate', 'CAC Annual Returns')
on conflict (rule_code) do nothing;

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  1,
  'annually',
  'Annually, except in the year of registration/incorporation. The exact window differs by entity type: business names, not later than 30 June each year (CAMA s.822(1)); incorporated trustees, between 30 June and 31 December each year (CAMA s.848(1)); companies, once at least every year, generally tied to the annual general meeting cycle (CAMA s.417).',
  'File your annual return with the Corporate Affairs Commission each year (after your first year of registration). The required form and exact window depend on your business structure — business name, company, or incorporated trustee (e.g. many NGOs). Confirm the specific form and deadline for your entity type with the Corporate Affairs Commission.',
  '2020-01-01',
  'draft',
  'Corporate Affairs Commission (CAC) — Companies and Allied Matters Act, 2020',
  'https://www.cac.gov.ng/wp-content/uploads/2020/12/CAMA-NOTE-BOOK-FULL-VERSION.pdf',
  'Registered businesses in Nigeria are generally required to file an annual return with the Corporate Affairs Commission to confirm they remain active and keep their registration in good standing. The exact form and timing depend on whether the business is registered as a business name, a company, or an incorporated trustee.',
  'Verified directly against CAMA, 2020 (official CAC-hosted PDF, retrieved via a working mirror after cac.gov.ng blocked automated fetches — content not taken from a secondary summary): s.417 (companies, exempt in year of incorporation), s.822 (business names, due 30 June annually, exempt in year of registration), s.848 (incorporated trustees, due between 30 June-31 Dec, exempt in year of incorporation). This rule is unrelated to the Nigeria Revenue Service / tax Acts used for VAT, PAYE, WHT and CIT — CAC is a separate regulator under a separate statute. Not verified for this version: the specific "42 days after AGM" deadline commonly cited by secondary sources for companies — the Act text found only "once at least in every year" tied to the AGM/s.237 exemption, so that more precise figure is not encoded. effective_date reflects CAMA 2020''s own commencement, not the 2026 tax reform (this rule is independent of that reform).',
  true,
  '{
    "branches": [
      {
        "when": { "field": "is_registered", "op": "eq", "value": true },
        "status": "likely_applicable",
        "reason": "You indicated your business is registered. Registered businesses generally have an annual return obligation to the Corporate Affairs Commission (exempt in their first year) — the exact form and deadline depend on whether you are registered as a business name, a company, or an incorporated trustee."
      },
      {
        "when": { "field": "is_registered", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "CAC annual return obligations apply once a business is formally registered — based on your answer, this does not appear to apply yet, though registering itself may be a separate requirement depending on your business structure."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'CAC'
on conflict (rule_id, version_number) do nothing;

commit;


-- ============================================================================
-- NOT run automatically. Review each source above independently, then
-- approve only the ones you're satisfied with — one at a time or all
-- together:
--
-- update public.rule_versions set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'PAYE') and version_number = 1;
--
-- update public.rule_versions set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'WHT') and version_number = 1;
--
-- update public.rule_versions set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'CIT') and version_number = 1;
--
-- update public.rule_versions set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'CAC') and version_number = 1;
-- ============================================================================
