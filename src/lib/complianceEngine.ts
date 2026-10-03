/**
 * The Rulla compliance rule engine.
 *
 * This file is deliberately generic. It contains no area-specific logic —
 * no "if VAT", no "if PAYE". It only knows how to read the `conditions`
 * JSON stored on a rule_versions row (see the migration comment for the
 * exact shape) and compare it against a business's profile. All actual
 * regulatory logic lives in the database as data, not here as code.
 *
 * evaluateCompliance(rules, input) is the one entry point. It's a pure
 * function — no Supabase calls, no side effects — so the exact same code
 * runs both in the anonymous, pre-signup assessment (fed from in-memory
 * assessment answers) and again after signup when saving results (fed
 * from the persisted business_profiles row). Same engine, same rules,
 * same answer either way.
 */

import type { AssessmentAnswers, YesNo, YesNoUnsure } from "@/lib/assessment";
import type { Business, BusinessProfile } from "@/lib/supabase/queries";

// ---- Status vocabulary -----------------------------------------------------

export type ObligationStatus =
  | "likely_applicable"
  | "may_apply"
  | "needs_review"
  | "not_enough_info"
  | "not_indicated";

export const STATUS_LABELS: Record<ObligationStatus, string> = {
  likely_applicable: "Likely applicable",
  may_apply: "May apply",
  needs_review: "Needs review",
  not_enough_info: "Not enough information",
  not_indicated: "Not indicated by current answers",
};

// A status of "needs_review" or "not_enough_info" always implies the
// result should be flagged for review — that's a structural fact about
// what those words mean, not a regulatory judgement, so it's safe to
// encode here rather than in rule content.
function statusImpliesReview(status: ObligationStatus): boolean {
  return status === "needs_review" || status === "not_enough_info";
}

// ---- The input every rule is evaluated against -----------------------------
// Field names deliberately match business_profiles/businesses column names
// 1:1, so anyone writing a rule's `conditions` JSON is reading the same
// field names as the database schema — no hidden translation layer.

export type EvaluationInput = {
  business_type: string | null;
  is_registered: boolean | null;
  has_employees: boolean | null;
  number_of_employees: number | null;
  uses_contractors: boolean | null;
  sells_taxable_goods_or_services: boolean | null;
  is_vat_registered: boolean | null;
  has_tin: boolean | null;
};

export const EMPTY_EVALUATION_INPUT: EvaluationInput = {
  business_type: null,
  is_registered: null,
  has_employees: null,
  number_of_employees: null,
  uses_contractors: null,
  sells_taxable_goods_or_services: null,
  is_vat_registered: null,
  has_tin: null,
};

function yesNoToBool(v: YesNo | undefined): boolean | null {
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

function yesNoUnsureToBool(v: YesNoUnsure | undefined): boolean | null {
  if (v === "yes") return true;
  if (v === "no") return false;
  // "unsure" and "not answered" both collapse to "unknown" — that's the
  // honest representation of both cases.
  return null;
}

/** Maps the in-progress (pre-signup) assessment answers to engine input. */
export function assessmentAnswersToEvaluationInput(answers: AssessmentAnswers): EvaluationInput {
  return {
    business_type: answers.businessType || null,
    is_registered: yesNoToBool(answers.registered),
    has_employees: yesNoToBool(answers.hasEmployees),
    // The assessment collects a range ("6-20"), not an exact count — never
    // invented here. number_of_employees only ever comes from onboarding,
    // where the user types a precise number.
    number_of_employees: null,
    uses_contractors: yesNoToBool(answers.paysContractors),
    sells_taxable_goods_or_services: yesNoUnsureToBool(answers.sellsTaxableGoods),
    is_vat_registered: yesNoToBool(answers.vatRegistered),
    has_tin: yesNoToBool(answers.hasTin),
  };
}

/** Maps a persisted (post-signup) business + business_profiles row to engine input. */
export function businessProfileToEvaluationInput(
  business: Pick<Business, "business_type">,
  profile: Partial<BusinessProfile> | null
): EvaluationInput {
  return {
    business_type: business.business_type ?? null,
    is_registered: profile?.is_registered ?? null,
    has_employees: profile?.has_employees ?? null,
    number_of_employees: profile?.number_of_employees ?? null,
    uses_contractors: profile?.uses_contractors ?? null,
    sells_taxable_goods_or_services: profile?.sells_taxable_goods_or_services ?? null,
    is_vat_registered: profile?.is_vat_registered ?? null,
    has_tin: profile?.has_tin ?? null,
  };
}

// ---- The condition format stored in rule_versions.conditions ---------------

type ConditionOp = "eq" | "ne" | "in" | "not_in" | "gte" | "lte" | "gt" | "lt";

export type RuleCondition = {
  field: keyof EvaluationInput;
  op: ConditionOp;
  value: unknown;
};

export type ConditionGroup = RuleCondition | { all: ConditionGroup[] } | { any: ConditionGroup[] };

export type RuleBranch = {
  when: ConditionGroup;
  status: ObligationStatus;
  // Optional — overrides the rule_version's own `explanation` for this
  // specific branch, since "why" genuinely differs between e.g. "you're
  // already registered" and "you said you don't sell taxable goods".
  // Falls back to the rule-level explanation when omitted.
  reason?: string;
};

export type RuleConditions = {
  branches: RuleBranch[];
  default_status: ObligationStatus;
};

/**
 * Evaluates one condition against the input. Returns:
 *   true/false — the condition is known and evaluates that way
 *   null       — the relevant field hasn't been answered, so this
 *                condition cannot be evaluated at all
 * A missing answer is never silently treated as false — that would be
 * guessing.
 */
function evaluateCondition(cond: RuleCondition, input: EvaluationInput): boolean | null {
  const value = input[cond.field];
  if (value === null || value === undefined) return null;

  switch (cond.op) {
    case "eq":
      return value === cond.value;
    case "ne":
      return value !== cond.value;
    case "in":
      return Array.isArray(cond.value) && (cond.value as unknown[]).includes(value);
    case "not_in":
      return Array.isArray(cond.value) && !(cond.value as unknown[]).includes(value);
    case "gte":
      return typeof value === "number" && typeof cond.value === "number" && value >= cond.value;
    case "lte":
      return typeof value === "number" && typeof cond.value === "number" && value <= cond.value;
    case "gt":
      return typeof value === "number" && typeof cond.value === "number" && value > cond.value;
    case "lt":
      return typeof value === "number" && typeof cond.value === "number" && value < cond.value;
    default:
      return null;
  }
}

function isConditionGroup(g: ConditionGroup): g is { all: ConditionGroup[] } | { any: ConditionGroup[] } {
  return "all" in g || "any" in g;
}

function evaluateGroup(group: ConditionGroup, input: EvaluationInput): boolean | null {
  if (!isConditionGroup(group)) {
    return evaluateCondition(group, input);
  }

  if ("all" in group) {
    let sawUnknown = false;
    for (const sub of group.all) {
      const result = evaluateGroup(sub, input);
      if (result === false) return false; // short-circuit: one false makes the whole group false
      if (result === null) sawUnknown = true;
    }
    return sawUnknown ? null : true;
  }

  // "any"
  let sawUnknown = false;
  for (const sub of group.any) {
    const result = evaluateGroup(sub, input);
    if (result === true) return true; // short-circuit: one true makes the whole group true
    if (result === null) sawUnknown = true;
  }
  return sawUnknown ? null : false;
}

// ---- Evaluating one rule and the whole set ---------------------------------

export type EngineRule = {
  ruleId: string;
  ruleVersionId: string;
  code: string;
  name: string;
  conditions: RuleConditions | null;
  explanation: string | null;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  requiresReviewDefault: boolean;
};

export type ComplianceResult = {
  ruleId: string;
  ruleVersionId: string;
  code: string;
  name: string;
  status: ObligationStatus;
  statusLabel: string;
  reason: string;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  requiresReview: boolean;
};

function evaluateOneRule(
  rule: EngineRule,
  input: EvaluationInput
): { status: ObligationStatus; requiresReview: boolean; reason: string | null } {
  const conditions = rule.conditions;

  if (!conditions || conditions.branches.length === 0) {
    // A rule with no structured conditions yet can never produce a
    // confident result — this is a content gap, not a business fact.
    return { status: "not_enough_info", requiresReview: true, reason: null };
  }

  for (const branch of conditions.branches) {
    if (evaluateGroup(branch.when, input) === true) {
      return {
        status: branch.status,
        requiresReview: rule.requiresReviewDefault || statusImpliesReview(branch.status),
        reason: branch.reason ?? null,
      };
    }
  }

  const status = conditions.default_status;
  return { status, requiresReview: rule.requiresReviewDefault || statusImpliesReview(status), reason: null };
}

/**
 * Adapts the raw joined rows from getApprovedRules() (see
 * lib/supabase/queries.ts) into the engine's own EngineRule shape. Kept
 * here rather than in queries.ts so the data-fetching layer doesn't need
 * to know about RuleConditions — it just passes `conditions` through as
 * unknown, and this is the one place that trusts its shape.
 */
export function toEngineRules(
  rows: {
    ruleId: string;
    ruleVersionId: string;
    code: string;
    name: string;
    conditions: unknown;
    explanation: string | null;
    sourceAuthority: string | null;
    sourceUrl: string | null;
    requiresReviewDefault: boolean;
  }[]
): EngineRule[] {
  return rows.map((row) => ({
    ...row,
    conditions: (row.conditions as RuleConditions | null) ?? null,
  }));
}

/**
 * The one entry point. Pure function: same rules + same input always
 * produces the same results, with no hidden state and no Supabase calls.
 */
export function evaluateCompliance(rules: EngineRule[], input: EvaluationInput): ComplianceResult[] {
  return rules.map((rule) => {
    const { status, requiresReview, reason } = evaluateOneRule(rule, input);
    return {
      ruleId: rule.ruleId,
      ruleVersionId: rule.ruleVersionId,
      code: rule.code,
      name: rule.name,
      status,
      statusLabel: STATUS_LABELS[status],
      reason: reason ?? rule.explanation ?? "No explanation has been recorded for this rule yet.",
      sourceAuthority: rule.sourceAuthority,
      sourceUrl: rule.sourceUrl,
      requiresReview,
    };
  });
}
