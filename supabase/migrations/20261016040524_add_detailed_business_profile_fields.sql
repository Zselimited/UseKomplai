-- ============================================================================
-- Rulla — richer Business Compliance Profile fields
-- ============================================================================
-- The original assessment only collected enough to produce "needs_review"
-- for almost everything (e.g. no turnover data meant VAT/CIT could never
-- resolve their small-business exemption). This adds the fields from the
-- expanded Business Compliance Profile questionnaire so the rule engine
-- can actually reach a confident status more often.
--
-- estimated_annual_revenue_band, last_cac_annual_return_filed_date and the
-- VAT/PAYE/WHT boolean fields already existed from the original schema —
-- this only adds what's genuinely new: nuanced (not just yes/no) filing
-- status for VAT/PAYE/WHT, a qualitative CAC-return-recency field (the
-- questionnaire asks "this year / last year / more than a year ago /
-- never / not sure", which doesn't fit a date column), and multi-state
-- operation + a short business description.
-- ============================================================================

begin;

alter table public.business_profiles
  add column if not exists vat_filing_status text,
  add column if not exists paye_filing_status text,
  add column if not exists wht_filing_status text,
  add column if not exists cac_last_return_status text;

comment on column public.business_profiles.vat_filing_status is
  'One of: regularly, sometimes, no, unsure. Nuanced replacement for is_vat_registered — kept alongside it, not instead of it.';
comment on column public.business_profiles.paye_filing_status is
  'One of: regularly, sometimes, no, not_applicable, unsure.';
comment on column public.business_profiles.wht_filing_status is
  'One of: regularly, sometimes, no, unsure.';
comment on column public.business_profiles.cac_last_return_status is
  'One of: this_year, last_year, over_a_year_ago, never, unsure — directly answers "when did you last file your CAC annual return?" which a date column can''t represent (no exact date is collected).';
comment on column public.business_profiles.estimated_annual_revenue_band is
  'Now populated from a fixed dropdown (see lib/nigeria.ts TURNOVER_BANDS) — one of: none, under_5m, 5m_25m, 25m_50m, 50m_100m, 100m_500m, above_500m.';

alter table public.businesses
  add column if not exists description text,
  add column if not exists operates_in_multiple_states boolean;

comment on column public.businesses.description is
  'Short (1-2 sentence) free-text description of what the business does, from the assessment.';
comment on column public.businesses.operates_in_multiple_states is
  'Whether the business operates in more than one state — distinct from state_of_operation, which is just the main location.';

-- "incorporated_trustee" is the correct CAMA 2020 term (s.848) for the
-- entity type most NGOs actually register under, and is what the CAC
-- rule's conditions now use (see the rule-approval migration below) —
-- rename any existing rows so they keep matching.
update public.businesses set business_type = 'incorporated_trustee' where business_type = 'ngo';

commit;
