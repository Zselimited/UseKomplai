import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  IconArrowRight,
  IconCheckCircle,
  IconAlertCircle,
  IconClock,
  IconLayers,
  IconBuilding,
  IconUsers,
  IconFileText,
  IconShield,
  IconChevronDown,
} from "@/components/icons";

const VIZ_ITEMS = [
  { code: "CAC", label: "CAC Annual Returns", status: "likely_applicable", statusLabel: "Likely applicable" },
  { code: "VAT", label: "VAT", status: "needs_review", statusLabel: "Needs review" },
  { code: "PAYE", label: "PAYE", status: "likely_applicable", statusLabel: "Likely applicable" },
  { code: "WHT", label: "Withholding Tax", status: "may_apply", statusLabel: "May apply" },
  { code: "CIT", label: "Company Income Tax", status: "likely_applicable", statusLabel: "Likely applicable" },
];

const HOW_IT_WORKS = [
  { title: "Tell us about your business", body: "Business type, location, industry, employees and other relevant information." },
  { title: "Answer a few questions", body: "A simple, personalised compliance assessment." },
  { title: "See what may apply", body: "Rulla produces a preliminary view of relevant compliance areas." },
  { title: "Manage it in one place", body: "Save your assessment and eventually manage obligations from your dashboard." },
];

const COMPLIANCE_AREAS = [
  { n: "01", code: "CAC", name: "CAC", icon: IconBuilding, description: "Corporate registration and annual compliance." },
  { n: "02", code: "VAT", name: "VAT", icon: IconLayers, description: "Understand VAT-related compliance considerations." },
  { n: "03", code: "PAYE", name: "PAYE", icon: IconUsers, description: "Understand employer-related tax considerations." },
  { n: "04", code: "WHT", name: "WHT", icon: IconFileText, description: "Understand withholding tax considerations." },
  { n: "05", code: "CIT", name: "CIT", icon: IconShield, description: "Understand company income tax considerations." },
];

const FAQ = [
  {
    q: "What is Rulla?",
    a: "Rulla is a platform that helps Nigerian businesses understand, assess and organise the compliance areas that may apply to them, in one place.",
  },
  {
    q: "Can I check my compliance without creating an account?",
    a: "Yes. The compliance assessment is free to start and doesn't require an account — you'll only need one if you want to save your results.",
  },
  {
    q: "How does the compliance assessment work?",
    a: "You answer a short series of questions about your business — type, registration status, employees and a few others — and Rulla gives you a preliminary view of which compliance areas may be relevant.",
  },
  {
    q: "Does Rulla provide legal or tax advice?",
    a: "No. Rulla provides informational compliance guidance, not professional legal or tax advice. Actual requirements depend on your specific business and current law.",
  },
  {
    q: "Which compliance areas does Rulla cover?",
    a: "Today, Rulla covers CAC annual returns, VAT, PAYE, withholding tax and company income tax, with more areas planned.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ============ 1. Hero ============ */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Business compliance, made simpler.</span>
            <h1>Your business compliance. Finally in one place.</h1>
            <p>
              Rulla helps Nigerian businesses understand, assess and
              organise their compliance obligations — without the
              confusion.
            </p>
            <div className="hero-cta-row">
              <Link href="/assessment" className="btn btn-primary btn-lg">
                Check My Compliance
                <IconArrowRight className="btn-arrow" />
              </Link>
              <Link href="/explore" className="btn btn-outline btn-lg">
                Explore Rulla
              </Link>
            </div>
            <div className="hero-microcopy">
              <IconCheckCircle />
              No account needed to start.
            </div>
          </div>

          <div className="product-viz" aria-hidden="true">
            <div className="viz-floater f1" />
            <div className="viz-floater f2" />
            <div className="viz-panel">
              <div className="viz-panel-head">
                <h4>Compliance Overview</h4>
                <span className="viz-tag">Sample data</span>
              </div>

              <div className="viz-profile-row">
                <span className="viz-avatar">
                  <IconBuilding className="h-4 w-4" />
                </span>
                <div>
                  <div className="biz-name">Business Profile</div>
                  <div className="biz-meta">LLC · Lagos · 8 employees</div>
                </div>
              </div>

              <div className="viz-progress-track">
                <div className="viz-progress-fill" />
              </div>

              <div className="viz-items">
                {VIZ_ITEMS.map((item) => (
                  <div className="viz-item" key={item.code}>
                    <span className="viz-item-label">
                      <span className="viz-item-code">{item.code}</span>
                      {item.label}
                    </span>
                    <span className={`status-pill status-${item.status}`}>
                      {item.status === "likely_applicable" && <IconCheckCircle />}
                      {item.status === "needs_review" && <IconAlertCircle />}
                      {item.status === "may_apply" && <IconClock />}
                      {item.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
              <p className="viz-disclaimer">
                Illustrative product preview — not real regulatory data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ How it works ============ */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From questions to clarity.</h2>
          </div>

          <Reveal>
            <div className="timeline">
              <div className="timeline-fill" />
              {HOW_IT_WORKS.map((step, i) => (
                <div className="timeline-step" key={step.title}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ Compliance areas ============ */}
      <section className="section" id="compliance-areas">
        <div className="container">
          <div className="section-head">
            <h2>Understand the areas that matter to your business.</h2>
          </div>
          <div className="compliance-grid">
            {COMPLIANCE_AREAS.map((area) => (
              <Link href="/explore" className="compliance-card" key={area.code}>
                <div className="compliance-card-head">
                  <span className="icon-tile" style={{ marginBottom: 0 }}>
                    <area.icon />
                  </span>
                  <span className="card-number-sm">{area.n}</span>
                </div>
                <div className="code">{area.code}</div>
                <h3>{area.name}</h3>
                <p>{area.description}</p>
                <span className="explore-link">
                  Explore <IconArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Product experience ============ */}
      <section className="section" id="product">
        <div className="container">
          <div className="section-head">
            <h2>One place to understand your compliance position.</h2>
          </div>

          <Reveal>
            <div className="dashboard-mock">
              <div className="dashboard-mock-topbar">
                <span className="dashboard-mock-dot" />
                <span className="dashboard-mock-dot" />
                <span className="dashboard-mock-dot" />
              </div>
              <div className="dashboard-mock-body">
                <aside className="dashboard-mock-sidebar">
                  <div className="nav-item active">Overview</div>
                  <div className="nav-item">Obligations</div>
                  <div className="nav-item">Documents</div>
                  <div className="nav-item">Calendar</div>
                  <div className="nav-item">Settings</div>
                </aside>
                <div className="dashboard-mock-main">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <h3 style={{ fontSize: "1.05rem" }}>Compliance Overview</h3>
                    <span className="sample-tag">Sample data</span>
                  </div>

                  <div className="dashboard-mock-columns">
                    <div>
                      <h4 style={{ fontSize: "0.85rem", marginBottom: "0.65rem", color: "var(--muted)" }}>
                        Compliance areas
                      </h4>
                      <div className="viz-items">
                        {VIZ_ITEMS.map((item) => (
                          <div className="viz-item" key={item.code}>
                            <span className="viz-item-label">
                              <span className="viz-item-code">{item.code}</span>
                              {item.label}
                            </span>
                            <span className={`status-pill status-${item.status}`}>
                              {item.statusLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "0.85rem", marginBottom: "0.65rem", color: "var(--muted)" }}>
                        Business Profile
                      </h4>
                      <div className="card-flat" style={{ marginBottom: "1.25rem" }}>
                        <div className="mini-profile-list">
                          <div className="mini-profile-row">
                            <span>Business type</span>
                            <span>LLC</span>
                          </div>
                          <div className="mini-profile-row">
                            <span>Industry</span>
                            <span>Retail</span>
                          </div>
                          <div className="mini-profile-row">
                            <span>State</span>
                            <span>Lagos</span>
                          </div>
                          <div className="mini-profile-row">
                            <span>Employees</span>
                            <span>8</span>
                          </div>
                          <div className="mini-profile-row">
                            <span>VAT status</span>
                            <span>Registered</span>
                          </div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: "0.85rem", marginBottom: "0.65rem", color: "var(--muted)" }}>
                        What needs your attention
                      </h4>
                      <div className="attention-row">
                        <IconAlertCircle />
                        VAT marked as needs review
                      </div>
                      <div className="attention-row">
                        <IconClock />
                        WHT marked as may apply
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Frequently asked questions.</h2>
          </div>
          <div className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <IconChevronDown className="chevron" />
                </summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
