import type { SupabaseClient } from "@supabase/supabase-js";

export type Business = {
  id: string;
  legal_name: string;
  trading_name: string | null;
  rc_bn_number: string | null;
  business_type: string | null;
  date_registered: string | null;
  industry: string | null;
  state_of_operation: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessProfile = {
  id: string;
  business_id: string;
  is_registered: boolean | null;
  number_of_employees: number | null;
  has_employees: boolean | null;
  uses_contractors: boolean | null;
  estimated_annual_revenue_band: string | null;
  sells_taxable_goods_or_services: boolean | null;
  is_vat_registered: boolean | null;
  has_tin: boolean | null;
  tin_number: string | null;
  paye_currently_remitted: boolean | null;
  wht_applies: boolean | null;
  has_tcc: boolean | null;
  diagnostic_completed_at: string | null;
};

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

/**
 * The current user's own profiles row. No filter is needed beyond RLS —
 * profiles_select_own already restricts this to exactly one row
 * (auth.uid() = id), so an unfiltered select behaves like "my profile".
 */
export async function getUserProfile(supabase: SupabaseClient): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Returns the first business the current user is a member of (via RLS —
 * this can only ever return businesses they legitimately belong to), or
 * null if they have none yet. Rulla only supports one business per user
 * for now, so "first" is effectively "their" business.
 */
export async function getUserBusiness(
  supabase: SupabaseClient
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, legal_name, trading_name, rc_bn_number, business_type, date_registered, industry, state_of_operation, created_at, updated_at"
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getBusinessProfile(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from("business_profiles")
    .select(
      "id, business_id, is_registered, number_of_employees, has_employees, uses_contractors, estimated_annual_revenue_band, sells_taxable_goods_or_services, is_vat_registered, has_tin, tin_number, paye_currently_remitted, wht_applies, has_tcc, diagnostic_completed_at"
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// ---- Rule engine support ----------------------------------------------------

export type EngineRuleRow = {
  ruleId: string;
  ruleVersionId: string;
  code: string;
  name: string;
  conditions: unknown;
  explanation: string | null;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  requiresReviewDefault: boolean;
};

/**
 * Fetches every approved rule_version, joined with its stable rule
 * identity. Works both for anonymous visitors (the public assessment) and
 * signed-in users — RLS filters to status = 'approved' either way, so
 * there is exactly one code path for "what rules exist" regardless of who
 * is asking. Returns raw joined rows; callers reshape into EngineRule[]
 * (see complianceEngine.ts) themselves, since the exact `rule_versions`
 * <-> `compliance_rules` join shape PostgREST returns isn't itself the
 * engine's public type.
 */
export async function getApprovedRules(supabase: SupabaseClient): Promise<EngineRuleRow[]> {
  const { data, error } = await supabase
    .from("rule_versions")
    .select(
      "id, rule_id, conditions, explanation, source_authority, source_url, requires_review, effective_date, compliance_rules!inner(rule_code, obligation_name)"
    )
    .eq("status", "approved")
    .order("effective_date", { ascending: false });

  if (error) {
    throw error;
  }

  // If a rule somehow has more than one approved version, keep only the
  // most recently effective one per rule_id (the query above is already
  // ordered newest-first, so the first occurrence wins).
  const seenRuleIds = new Set<string>();
  const rows: EngineRuleRow[] = [];

  for (const row of data ?? []) {
    if (seenRuleIds.has(row.rule_id)) continue;
    seenRuleIds.add(row.rule_id);

    // Supabase's generic client types this embedded relation loosely;
    // narrow it defensively rather than trusting a generated type we
    // don't have (no codegen is set up for this project).
    const relation = row.compliance_rules as unknown as
      | { rule_code: string; obligation_name: string }
      | { rule_code: string; obligation_name: string }[]
      | null;
    const rule = Array.isArray(relation) ? relation[0] : relation;
    if (!rule) continue;

    rows.push({
      ruleId: row.rule_id,
      ruleVersionId: row.id,
      code: rule.rule_code,
      name: rule.obligation_name,
      conditions: row.conditions,
      explanation: row.explanation,
      sourceAuthority: row.source_authority,
      sourceUrl: row.source_url,
      requiresReviewDefault: row.requires_review,
    });
  }

  return rows;
}

export type BusinessObligationRow = {
  ruleCode: string;
  ruleName: string;
  applicabilityStatus: string | null;
  reason: string | null;
  requiresReview: boolean | null;
  evaluatedAt: string | null;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  effectiveDate: string | null;
};

/**
 * The saved compliance results for one business. This only reads
 * business_obligations rows — it never runs the engine itself. Callers
 * that need results to reflect the currently approved rules (e.g. the
 * dashboard) must re-run and save them first; see dashboard/page.tsx.
 */
export async function getBusinessObligations(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessObligationRow[]> {
  const { data, error } = await supabase
    .from("business_obligations")
    .select(
      "applicability_status, reason, requires_review, evaluated_at, compliance_rules!inner(rule_code, obligation_name), rule_versions(source_authority, source_url, effective_date)"
    )
    .eq("business_id", businessId);

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((row) => {
    const ruleRelation = row.compliance_rules as unknown as
      | { rule_code: string; obligation_name: string }
      | { rule_code: string; obligation_name: string }[]
      | null;
    const rule = Array.isArray(ruleRelation) ? ruleRelation[0] : ruleRelation;
    if (!rule) return [];

    const versionRelation = row.rule_versions as unknown as
      | { source_authority: string | null; source_url: string | null; effective_date: string | null }
      | { source_authority: string | null; source_url: string | null; effective_date: string | null }[]
      | null;
    const version = Array.isArray(versionRelation) ? versionRelation[0] : versionRelation;

    return [
      {
        ruleCode: rule.rule_code,
        ruleName: rule.obligation_name,
        applicabilityStatus: row.applicability_status,
        reason: row.reason,
        requiresReview: row.requires_review,
        evaluatedAt: row.evaluated_at,
        sourceAuthority: version?.source_authority ?? null,
        sourceUrl: version?.source_url ?? null,
        effectiveDate: version?.effective_date ?? null,
      },
    ];
  });
}
