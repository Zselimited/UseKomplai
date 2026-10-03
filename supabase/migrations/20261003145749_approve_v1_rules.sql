-- ============================================================================
-- Rulla — approve all five v1 compliance rules (VAT, PAYE, WHT, CIT, CAC)
-- ============================================================================
-- Each rule's source citations, logic, and known gaps were reviewed
-- individually with the product owner on 2026-10-03 (see
-- 20260917194613_seed_vat_rule_v1.sql and
-- 20260917210121_seed_paye_wht_cit_cac_rules_v1.sql for the full research
-- behind each one). All five were approved as-is, with their existing
-- requires_review flags and "needs_review"/"likely_applicable" caps left
-- untouched — approval here only changes rule_versions.status so these
-- become visible to real users; it does not change the underlying
-- conditions or confidence level encoded in each rule.
-- ============================================================================

begin;

update public.rule_versions set status = 'approved', last_reviewed_at = now()
where rule_id = (select id from public.compliance_rules where rule_code = 'VAT') and version_number = 1;

update public.rule_versions set status = 'approved', last_reviewed_at = now()
where rule_id = (select id from public.compliance_rules where rule_code = 'PAYE') and version_number = 1;

update public.rule_versions set status = 'approved', last_reviewed_at = now()
where rule_id = (select id from public.compliance_rules where rule_code = 'WHT') and version_number = 1;

update public.rule_versions set status = 'approved', last_reviewed_at = now()
where rule_id = (select id from public.compliance_rules where rule_code = 'CIT') and version_number = 1;

update public.rule_versions set status = 'approved', last_reviewed_at = now()
where rule_id = (select id from public.compliance_rules where rule_code = 'CAC') and version_number = 1;

commit;
