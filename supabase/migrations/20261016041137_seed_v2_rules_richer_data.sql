-- ============================================================================
-- Rulla — v2 rules: same law, richer conditions
-- ============================================================================
-- The v1 rules (seeded in 20260917194613_seed_vat_rule_v1.sql and
-- 20260917210121_seed_paye_wht_cit_cac_rules_v1.sql, later approved in
-- 20261003145749_approve_v1_rules.sql) were built against a thin
-- assessment that couldn't collect turnover, fixed-asset, or nuanced
-- filing-status data — so VAT and CIT's small-business/company exemption
-- could never be resolved past "needs_review", and PAYE/WHT/CAC couldn't
-- distinguish "already filing" from "never filed" from "overdue".
--
-- The assessment now collects annual turnover bands and nuanced VAT/
-- PAYE/WHT filing status (regularly/sometimes/no/unsure) plus CAC return
-- recency (this_year/last_year/over_a_year_ago/never/unsure) — see
-- 20261016040524_add_detailed_business_profile_fields.sql and
-- src/lib/assessment.ts. This file inserts v2 of all five rules to use
-- that data. The underlying law and citations are UNCHANGED from v1 —
-- only the conditions logic is richer. Quoted source text is not
-- repeated here; see the v1 files for the full citations.
--
-- Inserted as status = 'draft', version_number = 2. v1 stays 'approved'
-- and live (so the product keeps giving real results) until these are
-- reviewed and approved — approving a v2 row should also archive the
-- matching v1 row in the same statement, so only one version is ever
-- live per rule. Not done automatically here; see the commented block
-- at the bottom of this file.
-- ============================================================================

begin;


-- ============================================================================
-- VAT v2 — turnover-aware
-- ============================================================================
-- Still can't fully resolve the small-business exemption (fixed-assets
-- data isn't collected), but turnover ABOVE the ₦100,000,000 threshold
-- alone is enough to confidently rule the exemption OUT (both the
-- turnover and fixed-assets tests must be met to qualify), which v1
-- couldn't do at all.

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  2,
  'monthly',
  'Monthly, on or before the 21st day of the following month, for businesses that do not qualify for the small-business exemption. Nigeria Tax Administration Act, 2025, s.22(1).',
  'If VAT applies to your business: register with the Nigeria Revenue Service, charge VAT on taxable supplies, and file monthly returns by the 21st day of the following month. Check whether your business qualifies for the small-business exemption (gross turnover of N100,000,000 or less per year and total fixed assets of N250,000,000 or less, and not a professional services business) before registering.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'VAT is a consumption tax charged on the supply of most goods and services in Nigeria. Businesses that make taxable supplies are generally required to register, charge VAT and file monthly returns, unless they qualify for the small-business exemption under the Nigeria Tax Administration Act, 2025.',
  'v2: uses annual_turnover_band (now collected) to confidently rule OUT the small-business exemption when turnover exceeds N100,000,000 — the fixed-assets test (N250,000,000) is still not collected, so the exemption itself still can''t be fully CONFIRMED, only ruled out. Same source/thresholds as v1 (Nigeria Tax Administration Act, 2025, ss.22, 147).',
  true,
  '{
    "branches": [
      {
        "when": { "field": "vat_filing_status", "op": "in", "value": ["regularly", "sometimes"] },
        "status": "likely_applicable",
        "reason": "You indicated you currently file VAT returns, so VAT obligations apply under the Nigeria Tax Administration Act, 2025."
      },
      {
        "when": { "all": [
          { "field": "vat_filing_status", "op": "in", "value": ["no", "unsure"] },
          { "field": "annual_turnover_band", "op": "in", "value": ["100m_500m", "above_500m"] }
        ] },
        "status": "likely_applicable",
        "reason": "Your turnover is above the small-business exemption threshold (gross turnover over N100,000,000), so VAT registration and filing are likely required even though you indicated you are not currently filing — this should be reviewed promptly."
      },
      {
        "when": { "all": [
          { "field": "vat_filing_status", "op": "in", "value": ["no", "unsure"] },
          { "field": "annual_turnover_band", "op": "eq", "value": "none" }
        ] },
        "status": "not_indicated",
        "reason": "Based on your answer that your business is not yet generating revenue, VAT registration and filing obligations do not appear to apply yet — revisit this once you have taxable sales."
      },
      {
        "when": { "all": [
          { "field": "vat_filing_status", "op": "in", "value": ["no", "unsure"] },
          { "field": "annual_turnover_band", "op": "in", "value": ["under_5m", "5m_25m", "25m_50m", "50m_100m"] }
        ] },
        "status": "needs_review",
        "reason": "Your turnover appears to be at or below the small-business exemption threshold (gross turnover of N100,000,000 or less), provided your total fixed assets are N250,000,000 or less and you are not a professional-services business — Rulla does not yet collect fixed-asset data, so confirm your exemption status directly."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'VAT'
on conflict (rule_id, version_number) do nothing;


-- ============================================================================
-- PAYE v2 — filing-status-aware
-- ============================================================================

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  2,
  'annually',
  'Annually, not later than 31 January following the year of assessment, for the employer''s return of emoluments and tax deducted. Nigeria Tax Administration Act, 2025, s.14(1).',
  'If PAYE applies: deduct income tax from employee salaries each pay period and file an annual return of emoluments and tax deducted by 31 January following the year. Confirm exact remittance timing and computation with the Nigeria Revenue Service or a professional, as these are set out in Chapter Two of the Nigeria Tax Act, 2025 and separate regulations which Rulla has not yet verified in full.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'PAYE (Pay As You Earn) is the system under which employers deduct income tax from employee salaries and remit it to the tax authority. Employers with employees are generally required to operate PAYE and file an annual return of emoluments and deductions under the Nigeria Tax Administration Act, 2025.',
  'v2: uses paye_filing_status (now collected) to flag a likely compliance gap when a business has employees but is not remitting, rather than giving the same reason regardless of current practice. Same source/verification status as v1 (NTAA 2025 s.14(1) verified; monthly remittance mechanics still not independently verified).',
  true,
  '{
    "branches": [
      {
        "when": { "all": [
          { "field": "has_employees", "op": "eq", "value": true },
          { "field": "paye_filing_status", "op": "eq", "value": "regularly" }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business has employees and remits PAYE regularly — keep filing the annual return of employee emoluments and tax deducted by 31 January under the Nigeria Tax Administration Act, 2025."
      },
      {
        "when": { "all": [
          { "field": "has_employees", "op": "eq", "value": true },
          { "field": "paye_filing_status", "op": "in", "value": ["sometimes", "no", "unsure"] }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business has employees but is not consistently remitting PAYE — employers are generally required to operate PAYE and file an annual return by 31 January under the Nigeria Tax Administration Act, 2025. This may be a compliance gap worth addressing promptly."
      },
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
-- WHT v2 — filing-status-aware (still capped at needs_review)
-- ============================================================================
-- Status is still deliberately capped at needs_review, never
-- likely_applicable, for the same reason as v1: the exact rate is
-- deferred to regulations that were not located. wht_filing_status only
-- changes the REASON given, not the confidence ceiling.

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  2,
  'monthly',
  'Monthly returns are required for tax deducted and remitted at source (Nigeria Tax Administration Act, 2025, s.28); the exact remittance deadline and rate are prescribed in separate regulations relating to deduction of tax at source (s.51), which Rulla has not yet located or verified.',
  'If withholding tax applies to a payment your business makes: deduct tax at the applicable rate before paying the recipient, and remit it monthly to the relevant tax authority. Confirm the applicable rate, any minimum threshold, and exact remittance deadline with the Nigeria Revenue Service or a professional — these are set out in regulations Rulla has not yet verified.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'Withholding tax is tax deducted at source from certain payments (such as to contractors, vendors, or professionals) and remitted to the tax authority on behalf of the recipient, as an advance payment against their final tax liability.',
  'v2: uses wht_filing_status (now collected) to distinguish "already deducting WHT, confirm the rate" from "making payments but not deducting WHT, possible compliance gap" — status stays capped at needs_review either way, same as v1, since the rate itself (NTAA 2025 s.51(1)) is still deferred to unlocated regulations.',
  true,
  '{
    "branches": [
      {
        "when": { "all": [
          { "field": "uses_contractors", "op": "eq", "value": true },
          { "field": "wht_filing_status", "op": "in", "value": ["regularly", "sometimes"] }
        ] },
        "status": "needs_review",
        "reason": "You indicated your business makes payments to contractors or vendors and already deducts or remits WHT — confirm you are applying the correct rate, since the Nigeria Tax Administration Act, 2025, s.51 defers the exact rate to separate regulations Rulla has not yet verified."
      },
      {
        "when": { "all": [
          { "field": "uses_contractors", "op": "eq", "value": true },
          { "field": "wht_filing_status", "op": "in", "value": ["no", "unsure"] }
        ] },
        "status": "needs_review",
        "reason": "You indicated your business makes payments to contractors or vendors but is not currently deducting WHT — certain payments require tax to be deducted at source under the Nigeria Tax Administration Act, 2025, s.51. This may be a compliance gap worth reviewing."
      },
      {
        "when": { "field": "uses_contractors", "op": "eq", "value": true },
        "status": "needs_review",
        "reason": "You indicated your business makes payments to contractors or vendors. Certain payments require tax to be deducted at source under the Nigeria Tax Administration Act, 2025, s.51 — the specific rate and any minimum threshold are set out in separate regulations which Rulla has not yet verified."
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
-- CIT v2 — turnover-aware + expanded business types
-- ============================================================================
-- business_type now includes llp and incorporated_trustee (renamed from
-- ngo) and other, alongside sole_proprietorship/llc/partnership.

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  2,
  'annually',
  'Annually, for each year of assessment, per the Nigeria Tax Act, 2025, s.56. Rulla has not independently verified the exact company income tax return filing deadline (distinct from the rate itself) for this version.',
  'If CIT applies: file an annual company income tax return. Whether tax is actually payable depends on your rate — companies are taxed at 30%, except a "small company" (gross turnover of N50,000,000 or less per year and total fixed assets of N250,000,000 or less, and not a professional services business), which is taxed at 0%. Confirm your classification with the Nigeria Revenue Service or a professional.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'Company Income Tax is charged on the profits of registered companies. Under the Nigeria Tax Act, 2025, the rate is 30% for most companies, but a qualifying "small company" is taxed at 0%. Sole proprietorships and partnerships are generally not "companies" for this purpose and are taxed differently.',
  'v2: uses annual_turnover_band (now collected) to give a specific reason when turnover is above the N50,000,000 small-company threshold (standard 30% rate likely applies) versus at/below it (may qualify for 0%, pending the still-uncollected fixed-assets test) — status is likely_applicable either way since the filing obligation itself applies regardless of rate, matching v1''s reasoning. business_type now also covers llp and incorporated_trustee (renamed from ngo — see CAC rule and the CAMA s.848 citation) and other. Same source/thresholds as v1 (Nigeria Tax Act, 2025, s.56 and Interpretation clause).',
  true,
  '{
    "branches": [
      {
        "when": { "all": [
          { "field": "is_registered", "op": "eq", "value": true },
          { "field": "business_type", "op": "eq", "value": "llc" },
          { "field": "annual_turnover_band", "op": "in", "value": ["50m_100m", "100m_500m", "above_500m"] }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is a registered Limited Liability Company with turnover above N50,000,000 — the standard 30% Company Income Tax rate likely applies, and an annual CIT return is required under the Nigeria Tax Act, 2025."
      },
      {
        "when": { "all": [
          { "field": "is_registered", "op": "eq", "value": true },
          { "field": "business_type", "op": "eq", "value": "llc" }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is a registered Limited Liability Company. Registered companies are generally subject to the Company Income Tax framework under the Nigeria Tax Act, 2025 — based on your turnover you may qualify for the 0% small-company rate (turnover of N50,000,000 or less and fixed assets of N250,000,000 or less, which Rulla does not yet collect), but the filing obligation itself applies either way."
      },
      {
        "when": { "field": "business_type", "op": "in", "value": ["partnership", "llp", "incorporated_trustee", "other"] },
        "status": "needs_review",
        "reason": "Partnerships, LLPs, incorporated trustees and other structures can have different Company Income Tax treatment from standard limited liability companies, which Rulla has not independently verified for each — confirm your specific position with a professional."
      },
      {
        "when": { "field": "business_type", "op": "eq", "value": "sole_proprietorship" },
        "status": "not_indicated",
        "reason": "Sole proprietorships (business names) are generally not \"companies\" for Company Income Tax purposes and are typically taxed differently — this does not appear to apply based on your business type."
      },
      {
        "when": { "field": "is_registered", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "Company Income Tax applies to registered companies — based on your answer that your business is not registered, this does not appear to apply yet."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'CIT'
on conflict (rule_id, version_number) do nothing;


-- ============================================================================
-- CAC v2 — return-recency-aware
-- ============================================================================

insert into public.rule_versions (
  rule_id, version_number, filing_frequency, due_date_rule,
  required_action_description, effective_date, status,
  source_authority, source_url, explanation, notes, requires_review, conditions
)
select
  cr.id,
  2,
  'annually',
  'Annually, except in the year of registration/incorporation. The exact window differs by entity type: business names, not later than 30 June each year (CAMA s.822(1)); incorporated trustees, between 30 June and 31 December each year (CAMA s.848(1)); companies, once at least every year, generally tied to the annual general meeting cycle (CAMA s.417).',
  'File your annual return with the Corporate Affairs Commission each year (after your first year of registration). The required form and exact window depend on your business structure — business name, company, or incorporated trustee (e.g. many NGOs). Confirm the specific form and deadline for your entity type with the Corporate Affairs Commission.',
  '2020-01-01',
  'draft',
  'Corporate Affairs Commission (CAC) — Companies and Allied Matters Act, 2020',
  'https://www.cac.gov.ng/wp-content/uploads/2020/12/CAMA-NOTE-BOOK-FULL-VERSION.pdf',
  'Registered businesses in Nigeria are generally required to file an annual return with the Corporate Affairs Commission to confirm they remain active and keep their registration in good standing. The exact form and timing depend on whether the business is registered as a business name, a company, or an incorporated trustee.',
  'v2: uses cac_last_return_status (now collected) to flag businesses that have never filed or have not filed in over a year as needing prompt attention, versus those up to date this year or likely due soon (last year) — status is likely_applicable in every registered case (the obligation exists regardless), but the reason text now reflects actual filing recency. Same source/citations as v1 (CAMA 2020 ss.417, 822, 848).',
  true,
  '{
    "branches": [
      {
        "when": { "all": [
          { "field": "is_registered", "op": "eq", "value": true },
          { "field": "cac_last_return_status", "op": "in", "value": ["never", "over_a_year_ago"] }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is registered but has not filed a CAC annual return in over a year (or ever) — this needs prompt attention. The exact form and deadline depend on whether you are registered as a business name, a company, or an incorporated trustee."
      },
      {
        "when": { "all": [
          { "field": "is_registered", "op": "eq", "value": true },
          { "field": "cac_last_return_status", "op": "eq", "value": "this_year" }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is registered and filed its CAC annual return this year — you appear up to date, but confirm the exact next deadline for your entity type."
      },
      {
        "when": { "all": [
          { "field": "is_registered", "op": "eq", "value": true },
          { "field": "cac_last_return_status", "op": "eq", "value": "last_year" }
        ] },
        "status": "likely_applicable",
        "reason": "You indicated your business is registered and last filed its CAC annual return last year — your next return is likely due soon. Confirm the exact deadline for your entity type."
      },
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
-- NOT run automatically. After reviewing each rule's conditions above,
-- approve a v2 row and archive its v1 counterpart in the SAME statement,
-- so exactly one version per rule is ever live:
--
-- update public.rule_versions set status = 'archived'
-- where rule_id = (select id from public.compliance_rules where rule_code = 'VAT') and version_number = 1;
-- update public.rule_versions set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'VAT') and version_number = 2;
--
-- (repeat the pair for PAYE, WHT, CIT, CAC)
-- ============================================================================
