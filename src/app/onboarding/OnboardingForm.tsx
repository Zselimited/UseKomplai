"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { BUSINESS_TYPES, NIGERIAN_STATES } from "@/lib/nigeria";
import { loadAssessmentAnswers, clearAssessmentAnswers } from "@/lib/assessment";
import {
  assessmentAnswersToEvaluationInput,
  businessProfileToEvaluationInput,
  evaluateCompliance,
  toEngineRules,
} from "@/lib/complianceEngine";
import { getApprovedRules } from "@/lib/supabase/queries";
import YesNoCards from "@/components/YesNoCards";

type YesNo = "yes" | "no" | "";

// Read once, outside React state — loadAssessmentAnswers() is itself
// SSR-safe (it guards on `window` internally), and a lazy useState
// initializer only ever runs on the initial render, so this never touches
// localStorage on every re-render.
function readSavedAssessment() {
  return loadAssessmentAnswers();
}

export default function OnboardingForm() {
  const router = useRouter();

  // If the visitor already completed the public assessment, carry their
  // answers over instead of asking again. Only fields with a direct,
  // honest 1:1 match are prefilled — no guessing. Prefilling via lazy
  // useState initializers (rather than an effect that calls setState)
  // avoids an extra render pass.
  const [legalName, setLegalName] = useState("");
  const [rcBnNumber, setRcBnNumber] = useState("");
  const [businessType, setBusinessType] = useState(() => readSavedAssessment()?.businessType ?? "");
  const [industry, setIndustry] = useState(() => readSavedAssessment()?.industry ?? "");
  const [stateOfOperation, setStateOfOperation] = useState(() => readSavedAssessment()?.state ?? "");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [vatRegistered, setVatRegistered] = useState<YesNo>(() => readSavedAssessment()?.vatRegistered ?? "");
  const [payeRegistered, setPayeRegistered] = useState<YesNo>("");
  const [prefilled] = useState(() => readSavedAssessment() !== null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
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
            p_rc_bn_number: rcBnNumber || null,
            p_business_type: businessType || null,
            p_industry: industry || null,
            p_state_of_operation: stateOfOperation || null,
          }
        );

        if (createError) throw createError;
        businessId = newBusiness.id as string;
      }

      // The assessment collects hasEmployees/paysContractors/
      // sellsTaxableGoods/registered, but onboarding has no separate form
      // control for them (they were already answered pre-signup) — carry
      // them through silently rather than losing them. If the visitor
      // skipped the assessment entirely, these all resolve to null, which
      // is the honest "not answered" state.
      const savedAssessment = loadAssessmentAnswers();
      const assessmentInput = savedAssessment ? assessmentAnswersToEvaluationInput(savedAssessment) : null;

      const parsedEmployees = numberOfEmployees ? Number(numberOfEmployees) : null;
      // A number the user just typed here is a more direct signal than an
      // earlier yes/no from the assessment — prefer it when present.
      const hasEmployeesValue =
        parsedEmployees !== null ? parsedEmployees > 0 : assessmentInput?.has_employees ?? null;
      const isVatRegisteredValue = vatRegistered === "" ? null : vatRegistered === "yes";
      const hasTinValue = tinNumber ? true : assessmentInput?.has_tin ?? null;

      const { error: profileError } = await supabase
        .from("business_profiles")
        .upsert(
          {
            business_id: businessId,
            is_registered: assessmentInput?.is_registered ?? null,
            number_of_employees: parsedEmployees,
            has_employees: hasEmployeesValue,
            uses_contractors: assessmentInput?.uses_contractors ?? null,
            sells_taxable_goods_or_services: assessmentInput?.sells_taxable_goods_or_services ?? null,
            tin_number: tinNumber || null,
            has_tin: hasTinValue,
            is_vat_registered: isVatRegisteredValue,
            paye_currently_remitted: payeRegistered === "" ? null : payeRegistered === "yes",
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
          { business_type: businessType || null },
          {
            is_registered: assessmentInput?.is_registered ?? null,
            has_employees: hasEmployeesValue,
            number_of_employees: parsedEmployees,
            uses_contractors: assessmentInput?.uses_contractors ?? null,
            sells_taxable_goods_or_services: assessmentInput?.sells_taxable_goods_or_services ?? null,
            is_vat_registered: isVatRegisteredValue,
            has_tin: hasTinValue,
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
      {prefilled && (
        <div className="notice">
          We&apos;ve carried over a few answers from your compliance
          assessment — review and adjust anything below.
        </div>
      )}

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
        <label htmlFor="rcBnNumber">Business registration number (RC/BN)</label>
        <input
          id="rcBnNumber"
          value={rcBnNumber}
          onChange={(event) => setRcBnNumber(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="businessType">Business type</label>
        <select
          id="businessType"
          required
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
        >
          <option value="" disabled>
            Select a business type
          </option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="industry">Industry</label>
        <input
          id="industry"
          required
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="stateOfOperation">State</label>
        <select
          id="stateOfOperation"
          required
          value={stateOfOperation}
          onChange={(event) => setStateOfOperation(event.target.value)}
        >
          <option value="" disabled>
            Select a state
          </option>
          {NIGERIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="numberOfEmployees">Number of employees</label>
        <input
          id="numberOfEmployees"
          type="number"
          min={0}
          value={numberOfEmployees}
          onChange={(event) => setNumberOfEmployees(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="tinNumber">TIN (Tax Identification Number)</label>
        <input
          id="tinNumber"
          value={tinNumber}
          onChange={(event) => setTinNumber(event.target.value)}
        />
        <span className="field-hint">Leave blank if you don&apos;t have one yet.</span>
      </div>

      <YesNoCards
        name="vatRegistered"
        label="VAT registered?"
        value={vatRegistered}
        onChange={setVatRegistered}
      />

      <YesNoCards
        name="payeRegistered"
        label="PAYE registered?"
        value={payeRegistered}
        onChange={setPayeRegistered}
      />

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
        {submitting ? "Saving..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
