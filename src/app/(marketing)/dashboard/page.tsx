import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBusiness, getBusinessProfile, getUserProfile, getApprovedRules, getBusinessObligations } from "@/lib/supabase/queries";
import {
  businessProfileToEvaluationInput,
  evaluateCompliance,
  toEngineRules,
  computeComplianceScore,
  isAreaHandled,
  type ObligationStatus,
} from "@/lib/complianceEngine";
import { getNextDueDate, urgency } from "@/lib/dueDates";
import { COMPLIANCE_AREAS } from "@/lib/complianceAreas";
import { IconClock } from "@/components/icons";
import SignOutButton from "./SignOutButton";
import AccountDetailsCard from "./AccountDetailsCard";
import BusinessDetailsCard from "./BusinessDetailsCard";
import OfficerCard from "./OfficerCard";
import ObligationsGrid, { type ObligationCardData } from "./ObligationsGrid";

// Only areas with a saved business_obligations row (i.e. an approved rule
// existed at onboarding time) show a real result — anything else renders
// as not-yet-available rather than a guessed or fabricated status. This
// always renders all five, matching the assessment results page,
// regardless of how many rows actually exist — see the dashboard body
// below.
const DISPLAY_AREAS = COMPLIANCE_AREAS;

export const metadata: Metadata = {
  title: "Dashboard | Rulla",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const business = await getUserBusiness(supabase);

  if (!business) {
    redirect("/onboarding");
  }

  const profile = await getBusinessProfile(supabase, business.id);
  const userProfile = await getUserProfile(supabase);

  // Re-run the engine against the currently approved rules on every view,
  // rather than trusting whatever was saved at onboarding time — a rule
  // can be approved (or re-versioned) after someone has already signed
  // up, and their results should reflect that, not a stale snapshot.
  const rules = toEngineRules(await getApprovedRules(supabase));
  if (rules.length > 0) {
    const evaluationInput = businessProfileToEvaluationInput(business, profile);
    const results = evaluateCompliance(rules, evaluationInput);

    await supabase.from("business_obligations").upsert(
      results.map((r) => ({
        business_id: business.id,
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
  }

  const obligations = await getBusinessObligations(supabase, business.id);
  const obligationByCode = new Map(obligations.map((o) => [o.ruleCode, o]));

  const filingStatus = {
    vat: profile?.vat_filing_status ?? null,
    paye: profile?.paye_filing_status ?? null,
    wht: profile?.wht_filing_status ?? null,
    cacLastReturn: profile?.cac_last_return_status ?? null,
  };

  const obligationCards: ObligationCardData[] = DISPLAY_AREAS.map((area) => {
    const o = obligationByCode.get(area.code);
    const status = (o?.applicabilityStatus as ObligationStatus | undefined) ?? null;
    return {
      code: area.code,
      name: area.name,
      status,
      reason: o?.reason ?? null,
      sourceAuthority: o?.sourceAuthority ?? null,
      sourceUrl: o?.sourceUrl ?? null,
      requiresReview: o?.requiresReview ?? null,
      // Only prompt someone to act once there's an actual result to act on
      // — "not yet available" areas have nothing to point them at yet.
      needsAction: status !== null && !isAreaHandled({ code: area.code, status }, filingStatus),
    };
  });

  const complianceScore = computeComplianceScore(
    obligationCards.map((c) => ({ code: c.code, status: c.status })),
    filingStatus
  );
  const attentionAreas = obligationCards.filter((c) => c.needsAction);

  // Only an obligation Rulla is actually confident applies gets a deadline
  // shown — there's no point telling someone when a filing is due for an
  // area that doesn't (or might not) apply to them.
  const deadlines = DISPLAY_AREAS.filter((area) => obligationByCode.get(area.code)?.applicabilityStatus === "likely_applicable")
    .map((area) => ({
      area,
      due: getNextDueDate(area.code, business.business_type),
    }))
    .sort((a, b) => {
      if (a.due.kind === "confirmed" && b.due.kind === "confirmed") return a.due.daysUntil - b.due.daysUntil;
      if (a.due.kind === "confirmed") return -1;
      if (b.due.kind === "confirmed") return 1;
      return 0;
    });

  return (
    <main className="page-wide dashboard-shell">
      <aside className="dashboard-rail">
        <div className="order-m-3">
          <AccountDetailsCard profile={userProfile} fallbackEmail={user.email ?? ""} businessName={business.legal_name} />
        </div>

        <div className="order-m-4">
          <BusinessDetailsCard
            legalName={business.legal_name}
            businessType={business.business_type}
            numberOfEmployees={profile?.number_of_employees ?? null}
            turnoverBand={profile?.estimated_annual_revenue_band}
            vatFilingStatus={profile?.vat_filing_status}
            payeFilingStatus={profile?.paye_filing_status}
            whtFilingStatus={profile?.wht_filing_status}
          />
        </div>

        <div className="order-m-6">
          <OfficerCard />
        </div>

        <div className="order-m-7">
          <SignOutButton />
        </div>
      </aside>

      <div className="dashboard-main">
        <section className="card compliance-score-card order-m-1" style={{ marginBottom: "1.25rem" }}>
          <div className="compliance-score-ring" style={{ "--score": complianceScore.percent } as React.CSSProperties}>
            <span className="compliance-score-number">{complianceScore.percent}%</span>
          </div>
          <div>
            {complianceScore.totalCount === 0 ? (
              <>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Nothing flagged yet</h2>
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  Based on what you&apos;ve told us, no compliance area
                  currently applies to your business. This updates as you
                  add more details.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  {complianceScore.percent}% compliant
                </h2>
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  Based on the {complianceScore.totalCount} area
                  {complianceScore.totalCount === 1 ? "" : "s"} that
                  currently apply to your business. Not a legal
                  certification, just a quick status snapshot.
                </p>
              </>
            )}

            {attentionAreas.length > 0 && (
              <div className="score-attention">
                <span className="score-attention-label">Still needs attention:</span>
                <div className="score-attention-chips">
                  {attentionAreas.map((area) => (
                    <span key={area.code} className="score-attention-chip">
                      {area.code}
                    </span>
                  ))}
                </div>
                <p className="score-attention-hint">Tap its card below for how to fix it.</p>
              </div>
            )}
          </div>
        </section>

        <section className="card order-m-2" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Compliance Obligations</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Tap a card for the full reasoning and source behind each result.
          </p>
          <ObligationsGrid
            items={obligationCards}
            businessId={business.id}
            profileAnswers={{
              businessType: business.business_type,
              isRegistered: profile?.is_registered ?? null,
              hasEmployees: profile?.has_employees ?? null,
              usesContractors: profile?.uses_contractors ?? null,
              estimatedAnnualRevenueBand: profile?.estimated_annual_revenue_band ?? null,
              cacLastReturnStatus: profile?.cac_last_return_status ?? null,
              vatFilingStatus: profile?.vat_filing_status ?? null,
              payeFilingStatus: profile?.paye_filing_status ?? null,
              whtFilingStatus: profile?.wht_filing_status ?? null,
            }}
          />
        </section>

        <section className="card order-m-5" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Upcoming deadlines</h2>

          {deadlines.length === 0 ? (
            <p className="muted">
              No confirmed deadlines yet. This fills in once an area is
              marked likely applicable to your business.
            </p>
          ) : (
            <div className="deadline-list">
              {deadlines.map(({ area, due }) => (
                <div className="deadline-row" key={area.code}>
                  <div className="deadline-row-main">
                    <span className="icon-tile" style={{ marginBottom: 0 }}>
                      <IconClock />
                    </span>
                    <div>
                      <h4>
                        {area.code} · {due.label}
                      </h4>
                      {due.kind === "unconfirmed" && (
                        <p className="muted" style={{ fontSize: "0.82rem" }}>
                          Cadence known, but Rulla hasn&apos;t confirmed the exact day. Check with the Nigeria Revenue Service or a professional.
                        </p>
                      )}
                    </div>
                  </div>
                  {due.kind === "confirmed" ? (
                    <div className="deadline-row-actions">
                      <span className={`deadline-badge deadline-${urgency(due.daysUntil)}`}>
                        {due.nextDueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {due.daysUntil < 0
                          ? `${Math.abs(due.daysUntil)}d overdue`
                          : due.daysUntil === 0
                            ? "Due today"
                            : `in ${due.daysUntil}d`}
                      </span>
                      <a
                        href={`/api/ics?code=${area.code}&date=${due.nextDueDate.toISOString().slice(0, 10)}&label=${encodeURIComponent(`${area.code} · ${due.label}`)}`}
                        className="btn btn-outline deadline-add-btn"
                      >
                        Add to calendar
                      </a>
                    </div>
                  ) : (
                    <span className="deadline-badge deadline-unconfirmed">Not yet confirmed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
