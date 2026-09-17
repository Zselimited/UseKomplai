import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  IconArrowRight,
  IconCheckCircle,
  IconAlertCircle,
  IconClock,
  IconCompass,
  IconClipboardCheck,
  IconLayers,
  IconBuilding,
  IconUsers,
  IconFileText,
  IconShield,
  IconSparkline,
  IconChevronDown,
  IconX2,
  IconEye,
  IconMessageQuestion,
} from "@/components/icons";

const VIZ_ITEMS = [
  { code: "CAC", label: "CAC Annual Returns", status: "likely_applicable", statusLabel: "Likely applicable" },
  { code: "VAT", label: "VAT", status: "needs_review", statusLabel: "Needs review" },
  { code: "PAYE", label: "PAYE", status: "likely_applicable", statusLabel: "Likely applicable" },
  { code: "WHT", label: "Withholding Tax", status: "may_apply", statusLabel: "May apply" },
  { code: "CIT", label: "Company Income Tax", status: "likely_applicable", statusLabel: "Likely applicable" },
];

const VALUE_STRIP = [
  { icon: IconCompass, title: "Understand", body: "Know which compliance areas may apply to your business." },
  { icon: IconClipboardCheck, title: "Assess", body: "Answer a few questions and get a personalised preliminary assessment." },
  { icon: IconAlertCircle, title: "Act", body: "Organise what needs attention and manage it from one place." },
];

const PROBLEMS = [
  {
    n: "01",
    title: "You don't know what applies to your business.",
    body: "Different businesses have different structures, activities, employees and obligations. Finding the relevant requirements shouldn't require searching through endless documents.",
  },
  {
    n: "02",
    title: "Information is scattered everywhere.",
    body: "Rules, guidance, documents and obligations can live across different sources. Komplai brings the information into one organised experience.",
  },
  {
    n: "03",
    title: "It's easy to lose track.",
    body: "Even when you know what needs to be done, keeping up with obligations and what needs attention can become difficult as your business grows.",
  },
];

const HOW_IT_WORKS = [
  { title: "Tell us about your business", body: "Business type, location, industry, employees and other relevant information." },
  { title: "Answer a few questions", body: "A simple, personalised compliance assessment." },
  { title: "See what may apply", body: "Komplai produces a preliminary view of relevant compliance areas." },
  { title: "Manage it in one place", body: "Save your assessment and eventually manage obligations from your dashboard." },
];

const COMPLIANCE_AREAS = [
  { n: "01", code: "CAC", name: "CAC", icon: IconBuilding, description: "Corporate registration and annual compliance." },
  { n: "02", code: "VAT", name: "VAT", icon: IconLayers, description: "Understand VAT-related compliance considerations." },
  { n: "03", code: "PAYE", name: "PAYE", icon: IconUsers, description: "Understand employer-related tax considerations." },
  { n: "04", code: "WHT", name: "WHT", icon: IconFileText, description: "Understand withholding tax considerations." },
  { n: "05", code: "CIT", name: "CIT", icon: IconShield, description: "Understand company income tax considerations." },
];

const WHY_KOMPLAI = [
  { icon: IconCompass, title: "Built around your business", body: "Compliance information is presented based on your business profile." },
  { icon: IconFileText, title: "Clearer information", body: "Turn complicated compliance information into something easier to understand." },
  { icon: IconLayers, title: "One organised place", body: "Keep your compliance information and obligations together." },
  { icon: IconSparkline, title: "Built to grow with you", body: "Start with understanding and assessment, then grow into ongoing compliance management." },
];

const OLD_WAY = [
  "Search different websites",
  "Read long documents",
  "Try to figure out what applies",
  "Track things manually",
  "Ask different people",
  "Hope nothing gets missed",
];

const KOMPLAI_WAY = [
  "Tell us about your business",
  "Get a personalised starting point",
  "Understand what may apply",
  "Organise your obligations",
  "See what needs attention",
  "Manage everything in one place",
];

const FUTURE = [
  { icon: IconEye, title: "Understand", body: "Make complex compliance information easier to understand." },
  { icon: IconSparkline, title: "Monitor", body: "Keep track of obligations and what needs attention." },
  { icon: IconMessageQuestion, title: "Ask", body: "Eventually interact with your compliance information through intelligent assistance." },
];

const WHO_FOR = [
  { icon: IconCompass, title: "Founders", body: "Understand the compliance requirements that may affect your business." },
  { icon: IconSparkline, title: "Growing Businesses", body: "Keep compliance organised as your business becomes more complex." },
  { icon: IconLayers, title: "Finance & Operations Teams", body: "Get a clearer view of business compliance information." },
  { icon: IconUsers, title: "Professional Advisors", body: "Use organised compliance information to support clients." },
];

const FAQ = [
  {
    q: "What is Komplai?",
    a: "Komplai is a platform that helps Nigerian businesses understand, assess and organise the compliance areas that may apply to them, in one place.",
  },
  {
    q: "Who is Komplai for?",
    a: "Founders, growing businesses, finance and operations teams, and professional advisors who want a clearer view of business compliance.",
  },
  {
    q: "Can I check my compliance without creating an account?",
    a: "Yes. The compliance assessment is free to start and doesn't require an account — you'll only need one if you want to save your results.",
  },
  {
    q: "How does the compliance assessment work?",
    a: "You answer a short series of questions about your business — type, registration status, employees and a few others — and Komplai gives you a preliminary view of which compliance areas may be relevant.",
  },
  {
    q: "Does Komplai provide legal or tax advice?",
    a: "No. Komplai provides informational compliance guidance, not professional legal or tax advice. Actual requirements depend on your specific business and current law.",
  },
  {
    q: "Which compliance areas does Komplai cover?",
    a: "Today, Komplai covers CAC annual returns, VAT, PAYE, withholding tax and company income tax, with more areas planned.",
  },
  {
    q: "Can I save my assessment?",
    a: "Yes. Once you complete the assessment, you can create a free account to save your results and continue from your dashboard.",
  },
  {
    q: "How does Komplai determine what may apply to my business?",
    a: "Your answers are compared against general compliance criteria to produce a preliminary view. It's a starting point, not a final determination — always confirm specifics for your situation.",
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
              Komplai helps Nigerian businesses understand, assess and
              organise their compliance obligations — without the
              confusion.
            </p>
            <div className="hero-cta-row">
              <Link href="/assessment" className="btn btn-primary btn-lg">
                Check My Compliance
                <IconArrowRight className="btn-arrow" />
              </Link>
              <Link href="/explore" className="btn btn-outline btn-lg">
                Explore Komplai
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

      {/* ============ 2. Trust / value strip ============ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="statement">
            <h2>Compliance shouldn&apos;t be something you discover when there&apos;s a problem.</h2>
          </Reveal>
          <div className="value-strip-grid" style={{ marginTop: "2.5rem" }}>
            {VALUE_STRIP.map((item, i) => (
              <Reveal key={item.title} className={`card reveal-delay-${i + 1}`}>
                <span className="icon-tile">
                  <item.icon />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 3. The problem ============ */}
      <section className="section">
        <div className="container">
          <Reveal className="statement">
            <span className="section-index">01 — The problem</span>
            <h2>Running a business is complicated enough. Compliance shouldn&apos;t be.</h2>
          </Reveal>

          <div className="problem-grid">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.n} className={`problem-card reveal-delay-${i + 1}`}>
                <div className="card-number">{p.n}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4. How it works ============ */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="section-index">02 — How Komplai works</span>
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

      {/* ============ 5. Personalized assessment ============ */}
      <section className="section" style={{ background: "var(--white)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="split-grid">
            <div className="split-copy">
              <span className="section-index">03 — The assessment</span>
              <h2>What does compliance look like for YOUR business?</h2>
              <p style={{ marginTop: "0.85rem", marginBottom: "1.75rem", fontSize: "1.05rem" }}>
                Answer a few simple questions and get a personalised view
                of the compliance areas that may apply to your business.
              </p>
              <Link href="/assessment" className="btn btn-primary btn-lg">
                Start My Compliance Assessment
                <IconArrowRight className="btn-arrow" />
              </Link>
              <div className="hero-microcopy" style={{ marginTop: "1.25rem" }}>
                <IconCheckCircle />
                Start free — create an account only if you want to save your results.
              </div>
            </div>

            <Reveal className="split-visual">
              <div className="viz-panel mini-assessment-card" aria-hidden="true">
                <div className="assessment-progress-head">
                  <span>Question 4 of 8</span>
                  <span>50%</span>
                </div>
                <div className="assessment-progress-track">
                  <div className="assessment-progress-fill" style={{ width: "50%" }} />
                </div>
                <h4>Does your business have employees?</h4>
                <div className="option-grid">
                  <div className="option-card is-selected">
                    Yes
                    <span className="check">
                      <IconCheckCircle />
                    </span>
                  </div>
                  <div className="option-card">
                    No<span className="check" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 6. Compliance areas ============ */}
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

      {/* ============ 7. Product experience ============ */}
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

      {/* ============ 8. Why Komplai ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Built around your business, not a generic checklist.</h2>
          </div>
          <div className="why-grid">
            {WHY_KOMPLAI.map((item, i) => (
              <Reveal key={item.title} className={`card reveal-delay-${(i % 4) + 1}`}>
                <span className="icon-tile green">
                  <item.icon />
                </span>
                <h3 style={{ fontSize: "1rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.88rem" }}>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 9. The difference ============ */}
      <section className="section">
        <div className="container">
          <Reveal className="statement">
            <span className="section-index">04 — The difference</span>
            <h2>Compliance shouldn&apos;t feel like detective work.</h2>
          </Reveal>

          <div className="compare-grid">
            <Reveal className="compare-col negative">
              <h3>The old way</h3>
              {OLD_WAY.map((item) => (
                <div className="compare-row" key={item}>
                  <IconX2 />
                  {item}
                </div>
              ))}
            </Reveal>
            <Reveal className="compare-col positive reveal-delay-2">
              <h3>With Komplai</h3>
              {KOMPLAI_WAY.map((item) => (
                <div className="compare-row" key={item}>
                  <IconCheckCircle />
                  {item}
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 10. Future intelligence ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What we&apos;re building next</span>
            <h2>A smarter way to manage business compliance.</h2>
            <p>
              Komplai is being built to bring compliance rules, official
              information, business data and intelligent assistance
              together in one place.
            </p>
          </div>

          <div className="future-grid">
            {FUTURE.map((item, i) => (
              <Reveal key={item.title} className={`card reveal-delay-${i + 1}`} >
                <span className="icon-tile">
                  <item.icon />
                </span>
                <h3 style={{ fontSize: "1rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.88rem" }}>{item.body}</p>
                <span className="building-tag">
                  <IconClock />
                  In development
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 11. Who it's for ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Built for the people who deal with compliance.</h2>
          </div>
          <div className="who-grid">
            {WHO_FOR.map((item, i) => (
              <Reveal key={item.title} className={`card reveal-delay-${(i % 4) + 1}`}>
                <span className="icon-tile">
                  <item.icon />
                </span>
                <h3 style={{ fontSize: "0.98rem" }}>{item.title}</h3>
                <p style={{ fontSize: "0.86rem" }}>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 12. FAQ ============ */}
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

      {/* ============ 13. Final CTA ============ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="final-cta">
              <h2>Know what may apply to your business.</h2>
              <p style={{ maxWidth: "50ch", margin: "0 auto" }}>
                Start with a few simple questions and get a clearer view
                of your business compliance.
              </p>
              <div className="cta-row">
                <Link href="/assessment" className="btn btn-primary btn-lg">
                  Check My Compliance
                  <IconArrowRight className="btn-arrow" />
                </Link>
                <Link href="/explore" className="btn btn-outline btn-lg">
                  Explore Compliance
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
