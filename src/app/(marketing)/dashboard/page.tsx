import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBusiness, getBusinessProfile, getUserProfile, getApprovedRules, getBusinessObligations } from "@/lib/supabase/queries";
import {
  businessProfileToEvaluationInput,
  evaluateCompliance,
  toEngineRules,
  type ObligationStatus,
} from "@/lib/complianceEngine";
import { getNextDueDate, urgency } from "@/lib/dueDates";
import { IconBuilding, IconClock } from "@/components/icons";
import SignOutButton from "./SignOutButton";
import AccountDetailsCard from "./AccountDetailsCard";
import OfficerCard from "./OfficerCard";
import ObligationsGrid, { type ObligationCardData } from "./ObligationsGrid";

// The five MVP compliance areas Rulla covers. Only areas with a saved
// business_obligations row (i.e. an approved rule existed at onboarding
// time) show a real result — anything else renders as not-yet-available
// rather than a guessed or fabricated status. This always renders all
// five, matching the assessment results page, regardless of how many
// rows actually exist — see the dashboard body below.
const DISPLAY_AREAS = [
  { code: "CAC", name: "CAC Annual Returns" },
  { code: "VAT", name: "Value Added Tax" },
  { code: "PAYE", name: "Pay As You Earn" },
  { code: "WHT", name: "Withholding Tax" },
  { code: "CIT", name: "Company Income Tax" },
];

export const metadata: Metadata = {
  title: "Dashboard — Rulla",
};

function StatusPill({ value }: { value: boolean | null | undefined }) {
  if (value === true) {
    return <span className="status-pill status-likely_applicable">Yes</span>;
  }
  if (value === false) {
    return <span className="status-pill status-may_apply">No</span>;
  }
  return <span className="status-pill status-not_enough_info">Not provided</span>;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  sole_proprietorship: "Sole Proprietorship / Business Name",
  llc: "Limited Liability Company",
  partnership: "Partnership",
  ngo: "NGO",
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

  const obligationCards: ObligationCardData[] = DISPLAY_AREAS.map((area) => {
    const o = obligationByCode.get(area.code);
    return {
      code: area.code,
      name: area.name,
      status: (o?.applicabilityStatus as ObligationStatus | undefined) ?? null,
      reason: o?.reason ?? null,
      sourceAuthority: o?.sourceAuthority ?? null,
      sourceUrl: o?.sourceUrl ?? null,
      requiresReview: o?.requiresReview ?? null,
    };
  });

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
        <AccountDetailsCard profile={userProfile} fallbackEmail={user.email ?? ""} />

        <section className="card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <span className="icon-tile" style={{ marginBottom: 0 }}>
              <IconBuilding />
            </span>
            <div>
              <h2 style={{ fontSize: "1.05rem" }}>{business.legal_name}</h2>
              <p className="muted" style={{ fontSize: "0.82rem" }}>
                {business.business_type
                  ? BUSINESS_TYPE_LABELS[business.business_type] ?? business.business_type
                  : "Business details"}
              </p>
            </div>
          </div>
        </section>

        <OfficerCard />

        <SignOutButton />
      </aside>

      <div className="dashboard-main">
        <section className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Business details</h2>
          <dl className="data-list">
            <div className="data-row">
              <dt>Business name</dt>
              <dd>{business.legal_name}</dd>
            </div>
            <div className="data-row">
              <dt>Business type</dt>
              <dd>
                {business.business_type
                  ? BUSINESS_TYPE_LABELS[business.business_type] ?? business.business_type
                  : "Not provided"}
              </dd>
            </div>
            <div className="data-row">
              <dt>Number of employees</dt>
              <dd>{profile?.number_of_employees ?? "Not provided"}</dd>
            </div>
            <div className="data-row">
              <dt>VAT registered</dt>
              <dd>
                <StatusPill value={profile?.is_vat_registered} />
              </dd>
            </div>
            <div className="data-row">
              <dt>PAYE registered</dt>
              <dd>
                <StatusPill value={profile?.paye_currently_remitted} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Upcoming deadlines</h2>

          {deadlines.length === 0 ? (
            <p className="muted">
              No confirmed deadlines yet — this fills in once an area is
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
                          Cadence known, but Rulla hasn&apos;t confirmed the exact day — check with the Nigeria Revenue Service or a professional.
                        </p>
                      )}
                    </div>
                  </div>
                  {due.kind === "confirmed" ? (
                    <span className={`deadline-badge deadline-${urgency(due.daysUntil)}`}>
                      {due.nextDueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {due.daysUntil < 0
                        ? `${Math.abs(due.daysUntil)}d overdue`
                        : due.daysUntil === 0
                          ? "Due today"
                          : `in ${due.daysUntil}d`}
                    </span>
                  ) : (
                    <span className="deadline-badge deadline-unconfirmed">Not yet confirmed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Compliance Obligations</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Tap a card for the full reasoning and source behind each result.
          </p>
          <ObligationsGrid items={obligationCards} />
        </section>
      </div>
    </main>
  );
}
