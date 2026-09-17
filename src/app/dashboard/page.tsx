import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBusiness, getBusinessProfile, getBusinessObligations } from "@/lib/supabase/queries";
import { STATUS_LABELS, type ObligationStatus } from "@/lib/complianceEngine";
import { IconBuilding, IconHelpCircle } from "@/components/icons";
import SignOutButton from "./SignOutButton";

// The five MVP compliance areas Komplai covers. Only areas with a saved
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
  title: "Dashboard — Komplai",
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
  const obligations = await getBusinessObligations(supabase, business.id);
  const obligationByCode = new Map(obligations.map((o) => [o.ruleCode, o]));

  return (
    <main className="page-wide">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span className="icon-tile" style={{ marginBottom: 0 }}>
            <IconBuilding />
          </span>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>{business.legal_name}</h1>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {business.business_type
                ? BUSINESS_TYPE_LABELS[business.business_type] ?? business.business_type
                : "Business details"}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>

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

      <section className="card">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Compliance Obligations</h2>

        <div>
          {DISPLAY_AREAS.map((area) => {
            const o = obligationByCode.get(area.code);

            if (!o || !o.applicabilityStatus) {
              return (
                <div className="result-card" key={area.code}>
                  <div className="result-card-main">
                    <span className="icon-tile" style={{ marginBottom: 0 }}>
                      <IconHelpCircle />
                    </span>
                    <div>
                      <h4>
                        {area.code} · {area.name}
                      </h4>
                      <p>This compliance area isn&apos;t implemented yet.</p>
                    </div>
                  </div>
                  <span className="status-pill status-not_enough_info">Not yet available</span>
                </div>
              );
            }

            const status = o.applicabilityStatus as ObligationStatus;

            return (
              <div className="result-card" key={area.code}>
                <div className="result-card-main">
                  <span
                    className={`icon-tile ${status === "likely_applicable" ? "green" : ""}`}
                    style={{ marginBottom: 0 }}
                  >
                    <IconHelpCircle />
                  </span>
                  <div>
                    <h4>
                      {area.code} · {area.name}
                    </h4>
                    {o.reason && <p>{o.reason}</p>}
                    {o.sourceAuthority && (
                      <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.35rem" }}>
                        Source: {o.sourceAuthority}
                        {o.sourceUrl && (
                          <>
                            {" — "}
                            <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer">
                              View source →
                            </a>
                          </>
                        )}
                      </p>
                    )}
                    {o.requiresReview && (
                      <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.15rem" }}>
                        This result is flagged for review — confirm with a professional if you rely on it.
                      </p>
                    )}
                  </div>
                </div>
                <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
