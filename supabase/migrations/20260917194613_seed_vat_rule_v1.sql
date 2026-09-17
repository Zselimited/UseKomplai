-- ============================================================================
-- Komplai — Phase 2, Step 2: seed the first real rule (VAT, v1)
-- ============================================================================
-- Content only — no schema changes in this file. This is deliberately a
-- separate file from the schema migration, per the "keep regulatory
-- content separate from UI/schema code" goal: updating a rule later means
-- writing a new file like this one, never touching application code or
-- the table structure.
--
-- Inserted with status = 'draft'. Per the existing rule_versions RLS
-- policies, draft rows are invisible to every real user (anon and
-- authenticated alike) — this rule will not appear anywhere in the
-- product until a human reviews the source below and explicitly runs the
-- UPDATE at the bottom of this file to approve it.
--
-- Safe to run more than once — both inserts are no-ops on conflict.
--
-- Wrapped in an explicit transaction: either the compliance_rules row and
-- its rule_versions row both land, or neither does. Without this, a SQL
-- client that auto-commits each statement independently can leave a
-- compliance_rules row committed while its rule_versions insert is lost —
-- exactly the state this file has recovered from once already.
--
-- ----------------------------------------------------------------------------
-- SOURCE
-- ----------------------------------------------------------------------------
-- Nigeria Tax Administration Act, 2025, 2025 No. 5 (Federal Republic of
-- Nigeria Official Gazette No. 117, Vol. 112, 26 June 2025; commenced 1
-- January 2026) — sections 22 and 147.
-- Cross-checked against Nigeria Tax Act, 2025, 2025 No. 7 (same Gazette
-- series) — the substantive act, Chapter Six (VAT), sections 144-149 —
-- which contains no separate "Small Business"/"Small Company" definition
-- and no VAT-specific registration threshold of its own.
-- Reference page: https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act
--
-- Quoted directly from the Act text:
--
--   Section 22(1): "A taxable person shall, in respect of Value Added Tax
--   (VAT), with or without a notice and whether or not an economic
--   activity has taken place, submit a return to the Service in the
--   prescribed form, on or before the 21st day of the following month."
--
--   Section 22(4): "The provision of subsection (1) of this section shall
--   not apply to a small business."
--
--   Section 22(5): "A small business may, subject to a written notice
--   addressed to the Service, choose to opt out of the exemption granted
--   to small businesses under this Part including registration, charging
--   of tax on its taxable supplies and filing of returns."
--
--   Section 147 ("In this Act—", the Interpretation clause — NOT section
--   22 itself): "'Small Business' means a business that earns gross
--   turnover of N100,000,000.00 or less per annum with total fixed assets
--   not more than N250,000,000.00 provided that any business providing
--   professional services shall not be classified as a small business ;"
--   Verified byte-for-byte against the raw extracted gazette text: the
--   turnover test is "or less" (inclusive) and the fixed-assets test is
--   "not more than" (also inclusive) — not "less than" for either.
--
--   A commonly-cited secondary-source figure of a separate N25,000,000
--   VAT registration threshold does NOT appear anywhere in either Act.
--   That figure's actual legal basis, the VAT Act (Modification) Order,
--   2021, is expressly revoked by s.198(1) of the Nigeria Tax Act, 2025,
--   and the old VAT Act itself (Cap. V1 LFN 2004) is repealed by s.196(k)
--   of the same Act. Treated as obsolete pre-2026 law, not encoded here.
--
-- ----------------------------------------------------------------------------
-- WHY requires_review = true, and why "needs_review" rather than
-- "likely_applicable" for a business that sells taxable goods/services
-- ----------------------------------------------------------------------------
-- Whether VAT applies turns partly on the small-business turnover/fixed-
-- asset threshold above. Komplai's assessment does not yet collect
-- turnover or fixed-asset figures — only whether a business sells taxable
-- goods/services and whether it's already VAT registered. Rather than
-- guess past that gap, a business that isn't already registered but does
-- sell taxable goods/services is marked "needs_review", with the
-- explanation naming the exact threshold so the business can check it
-- themselves. Only a business that says it's already VAT registered gets
-- "likely_applicable" — that's a direct fact, not a threshold judgement.
-- ============================================================================

begin;

insert into public.compliance_rules (rule_code, category, obligation_name)
values ('VAT', 'tax', 'Value Added Tax')
on conflict (rule_code) do nothing;

insert into public.rule_versions (
  rule_id,
  version_number,
  filing_frequency,
  due_date_rule,
  required_action_description,
  effective_date,
  status,
  source_authority,
  source_url,
  explanation,
  notes,
  requires_review,
  conditions
)
select
  cr.id,
  1,
  'monthly',
  'Monthly, on or before the 21st day of the following month, for businesses that do not qualify for the small-business exemption. Nigeria Tax Administration Act, 2025, s.22(1).',
  'If VAT applies to your business: register with the Nigeria Revenue Service, charge VAT on taxable supplies, and file monthly returns by the 21st day of the following month. Check whether your business qualifies for the small-business exemption (gross turnover of N100,000,000 or less per year and total fixed assets of N250,000,000 or less, and not a professional services business) before registering.',
  '2026-01-01',
  'draft',
  'Nigeria Revenue Service (NRS) — Nigeria Tax Administration Act, 2025',
  'https://www.nrs.gov.ng/tax-laws/nigeria-tax-administration-act',
  'VAT is a consumption tax charged on the supply of most goods and services in Nigeria. Businesses that make taxable supplies are generally required to register, charge VAT and file monthly returns, unless they qualify for the small-business exemption under the Nigeria Tax Administration Act, 2025.',
  'Small-business VAT exemption threshold (N100m turnover / N250m fixed assets, excluding professional services) is defined in the Nigeria Tax Administration Act, 2025, s.147 (Interpretation), applied via s.22. Komplai does not yet collect turnover or fixed-asset data, so this rule cannot fully resolve the exemption on its own — hence requires_review = true, and "needs_review" (not "likely_applicable") for a business that sells taxable goods/services but isn''t yet VAT registered. Revisit once turnover/fixed-asset fields exist in the assessment. Checked and ruled out: a secondary-source claim of a separate N25,000,000 VAT registration threshold does not appear in either the Nigeria Tax Administration Act, 2025 or the Nigeria Tax Act, 2025 (Chapter Six, ss.144-149) — its apparent legal basis, the VAT Act (Modification) Order 2021, is expressly revoked by NTA 2025 s.198(1), and the old VAT Act (Cap. V1 LFN 2004) is repealed by s.196(k). Not encoded as current law. If a new post-commencement Order or NRS regulation is later identified that changes this, this rule must be revised as a new version, not edited in place.',
  true,
  '{
    "branches": [
      {
        "when": { "field": "is_vat_registered", "op": "eq", "value": true },
        "status": "likely_applicable",
        "reason": "You indicated your business is already VAT registered, so VAT obligations apply under the Nigeria Tax Administration Act, 2025."
      },
      {
        "when": { "field": "sells_taxable_goods_or_services", "op": "eq", "value": true },
        "status": "needs_review",
        "reason": "Businesses that sell taxable goods or services are generally required to register for VAT and file monthly returns, unless they qualify as a small business (gross turnover of N100,000,000 or less per year and total fixed assets of N250,000,000 or less, and not a professional services business) under the Nigeria Tax Administration Act, 2025. We do not yet have enough information about your turnover or fixed assets to confirm whether this exemption applies to you."
      },
      {
        "when": { "field": "sells_taxable_goods_or_services", "op": "eq", "value": false },
        "status": "not_indicated",
        "reason": "Based on your answer that your business does not sell taxable goods or services, VAT registration and filing obligations do not appear to apply — revisit this if your business activities change."
      }
    ],
    "default_status": "not_enough_info"
  }'::jsonb
from public.compliance_rules cr
where cr.rule_code = 'VAT'
on conflict (rule_id, version_number) do nothing;

commit;


-- ============================================================================
-- NOT run automatically. After you've reviewed the source above yourself,
-- run this separately (in the SQL Editor, or as its own follow-up
-- migration) to make this rule visible to real users:
--
-- update public.rule_versions
-- set status = 'approved', last_reviewed_at = now()
-- where rule_id = (select id from public.compliance_rules where rule_code = 'VAT')
--   and version_number = 1;
-- ============================================================================
