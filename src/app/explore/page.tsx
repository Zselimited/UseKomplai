import type { Metadata } from "next";
import Link from "next/link";
import {
  IconArrowRight,
  IconBuilding,
  IconLayers,
  IconUsers,
  IconFileText,
  IconShield,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Explore Compliance Areas — Rulla",
  description:
    "A general overview of the CAC, VAT, PAYE, withholding tax and company income tax areas Rulla covers for Nigerian businesses.",
};

// Static, general-knowledge descriptions only — no specific rates,
// thresholds, or deadlines are stated here. Real, reviewed rule content
// lives in the compliance_rules / rule_versions tables and is what
// Rulla will eventually show once a business's obligations are
// generated — this page is just an overview of the categories Rulla
// covers, for visitors who haven't signed up yet.
const CATEGORIES = [
  {
    code: "CAC",
    name: "CAC Annual Returns",
    icon: IconBuilding,
    description:
      "Registered businesses in Nigeria are expected to file annual returns with the Corporate Affairs Commission (CAC) to keep their registration in good standing.",
  },
  {
    code: "VAT",
    name: "Value Added Tax (VAT)",
    icon: IconLayers,
    description:
      "Businesses that sell taxable goods or services may need to charge, collect, and remit VAT to the tax authorities on a recurring basis.",
  },
  {
    code: "PAYE",
    name: "Pay As You Earn (PAYE)",
    icon: IconUsers,
    description:
      "Employers are generally required to deduct income tax from employee salaries and remit it to the relevant state tax authority.",
  },
  {
    code: "WHT",
    name: "Withholding Tax (WHT)",
    icon: IconFileText,
    description:
      "Certain business transactions require tax to be withheld at source and remitted to the tax authority on behalf of the other party.",
  },
  {
    code: "CIT",
    name: "Company Income Tax (CIT)",
    icon: IconShield,
    description:
      "Registered companies are generally required to file and pay income tax on their profits to the Federal Inland Revenue Service (FIRS).",
  },
];

export default function ExplorePage() {
  return (
    <main className="page-wide">
      <section className="hero" style={{ padding: "1rem 0 2.5rem", maxWidth: "640px" }}>
        <span className="eyebrow">Compliance areas</span>
        <h1>Compliance categories</h1>
        <p style={{ marginTop: "0.75rem", fontSize: "1.05rem" }}>
          A general overview of the areas Rulla covers. To see exactly
          which of these apply to your business, take the free assessment.
        </p>
        <div className="cta-row">
          <Link href="/assessment" className="btn btn-primary btn-lg">
            Check My Business Compliance
            <IconArrowRight className="btn-arrow" />
          </Link>
        </div>
      </section>

      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <div className="compliance-card" key={category.code}>
            <span className="icon-tile">
              <category.icon />
            </span>
            <div className="code">{category.code}</div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: "2rem", fontSize: "0.85rem" }}>
        This page is a general overview, not personalized advice — actual
        applicability depends on your specific business. Rulla does not
        yet cover pension, NSITF, ITF, NHF, or industry-specific licences.
      </p>
    </main>
  );
}
