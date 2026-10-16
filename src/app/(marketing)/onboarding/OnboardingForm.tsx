"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { loadAssessmentAnswers, clearAssessmentAnswers } from "@/lib/assessment";
import {
  assessmentAnswersToEvaluationInput,
  businessProfileToEvaluationInput,
  evaluateCompliance,
  toEngineRules,
} from "@/lib/complianceEngine";
import { getApprovedRules } from "@/lib/supabase/queries";

// localStorage doesn't exist during SSR, so reading it during the initial
// render (e.g. a lazy useState initializer) produces a different result
// on the server (no localStorage -> false) than on the client's first
// paint, which is a hydration mismatch. useSyncExternalStore is the
// React-provided tool for exactly this: it renders getServerSnapshot's
// value through hydration, then re-syncs to getSnapshot's value right
// after, with no mismatch warning.
function subscribeNever() {
  return () => {};
}
function getHasAssessmentSnapshot() {
  return loadAssessmentAnswers() !== null;
}
function getHasAssessmentServerSnapshot() {
  return false;
}

export default function OnboardingForm() {
  const router = useRouter();

  // The expanded assessment now collects everything compliance-relevant
  // (registration status, turnover, filing status for VAT/PAYE/WHT,
  // CAC return history, business type, industry, state...) — the only
  // thing it doesn't ask is the business's actual NAME, since that isn't
  // a compliance fact. Exact employee count is offered here too, as a
  // refinement over the assessment's range band.
  const [legalName, setLegalName] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const hasAssessment = useSyncExternalStore(
    subscribeNever,
    getHasAssessmentSnapshot,
    getHasAssessmentServerSnapshot
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const savedAssessment = loadAssessmentAnswers();
      const assessmentInput = savedAssessment ? assessmentAnswersToEvaluationInput(savedAssessment) : null;

      // If this user already has a business (e.g. they're retrying after
      // a previous partial failure), reuse it instead of creating a
      // second one.
      const { data: existingBusiness, error: existingBusinessError } =
        await supabase.from("businesses").select("id").limit(1).maybeSingle();

      if (existingBusinessError) throw existingBusinessError;

      let businessId = existingBusiness?.id as string | undefined;

      if (!businessId) {
        const { data: newBusiness, error: createError } = await supabase.rpc(
          "create_business_with_owner",
          {
            p_legal_name: legalName,
            p_rc_bn_number: savedAssessment?.cacRegNumber || null,
            p_business_type: savedAssessment?.businessType || null,
            p_industry: savedAssessment?.industry || null,
            p_state_of_operation: savedAssessment?.state || null,
          }
        );

        if (createError) throw createError;
        businessId = newBusiness.id as string;
      }

      // description/operates_in_multiple_states/date_registered aren't
      // part of create_business_with_owner's signature (that function is
      // deliberately narrow) — set them with a follow-up update, which
      // businesses_update_members already allows for a business this user
      // belongs to.
      const yearRegistered = savedAssessment?.yearRegistered;
      await supabase
        .from("businesses")
        .update({
          description: savedAssessment?.businessDescription || null,
          operates_in_multiple_states: assessmentInput?.operates_in_multiple_states ?? null,
          // Only the year is collected, not a full date — approximated to
          // 1 January of that year, which is enough for "how long has
          // this business existed" purposes.
          date_registered: yearRegistered ? `${yearRegistered}-01-01` : null,
        })
        .eq("id", businessId);

      const parsedEmployees = numberOfEmployees ? Number(numberOfEmployees) : null;
      // A number typed here is a more direct signal than the assessment's
      // yes/no — prefer it when present.
      const hasEmployeesValue =
        parsedEmployees !== null ? parsedEmployees > 0 : assessmentInput?.has_employees ?? null;

      const { error: profileError } = await supabase
        .from("business_profiles")
        .upsert(
          {
            business_id: businessId,
            is_registered: assessmentInput?.is_registered ?? null,
            number_of_employees: parsedEmployees,
            has_employees: hasEmployeesValue,
            uses_contractors: assessmentInput?.uses_contractors ?? null,
            estimated_annual_revenue_band: assessmentInput?.annual_turnover_band ?? null,
            vat_filing_status: assessmentInput?.vat_filing_status ?? null,
            paye_filing_status: assessmentInput?.paye_filing_status ?? null,
            wht_filing_status: assessmentInput?.wht_filing_status ?? null,
            cac_last_return_status: assessmentInput?.cac_last_return_status ?? null,
            diagnostic_completed_at: new Date().toISOString(),
          },
          { onConflict: "business_id" }
        );

      if (profileError) throw profileError;

      // Save the actual compliance result now that we have a real,
      // authenticated business — re-running the same pure engine used in
      // the anonymous assessment, against the now-persisted profile.
      const rules = toEngineRules(await getApprovedRules(supabase));
      if (rules.length > 0) {
        const evaluationInput = businessProfileToEvaluationInput(
          {
            business_type: savedAssessment?.businessType || null,
            operates_in_multiple_states: assessmentInput?.operates_in_multiple_states ?? null,
          },
          {
            is_registered: assessmentInput?.is_registered ?? null,
            has_employees: hasEmployeesValue,
            number_of_employees: parsedEmployees,
            uses_contractors: assessmentInput?.uses_contractors ?? null,
            estimated_annual_revenue_band: assessmentInput?.annual_turnover_band ?? null,
            vat_filing_status: assessmentInput?.vat_filing_status ?? null,
            paye_filing_status: assessmentInput?.paye_filing_status ?? null,
            wht_filing_status: assessmentInput?.wht_filing_status ?? null,
            cac_last_return_status: assessmentInput?.cac_last_return_status ?? null,
          }
        );
        const results = evaluateCompliance(rules, evaluationInput);

        const { error: obligationsError } = await supabase.from("business_obligations").upsert(
          results.map((r) => ({
            business_id: businessId,
            rule_id: r.ruleId,
            rule_version_id: r.ruleVersionId,
            applicability_status: r.status,
            reason: r.reason,
            requires_review: r.requiresReview,
            evaluated_at: new Date().toISOString(),
            is_active: true,
          })),
          { onConflict: "business_id,rule_id" }
        );

        if (obligationsError) throw obligationsError;
      }

      clearAssessmentAnswers();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="notice">
        {hasAssessment
          ? "We've saved your compliance assessment answers. Just confirm your business name below to finish setting up your account."
          : "You haven't completed a compliance assessment yet — you can still create your account now and take the assessment from your dashboard any time."}
      </div>

      <div className="field">
        <label htmlFor="legalName">Business name</label>
        <input
          id="legalName"
          required
          value={legalName}
          onChange={(event) => setLegalName(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="numberOfEmployees">Exact number of employees (optional)</label>
        <input
          id="numberOfEmployees"
          type="number"
          min={0}
          value={numberOfEmployees}
          onChange={(event) => setNumberOfEmployees(event.target.value)}
        />
        <span className="field-hint">
          Leave blank to just use the range you gave in the assessment.
        </span>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
        {submitting ? "Saving..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
