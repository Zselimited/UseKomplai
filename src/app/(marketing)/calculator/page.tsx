import type { Metadata } from "next";
import CalculatorClient from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Tax Calculator — Rulla",
  description: "Estimate PAYE and VAT using the 2026 Nigeria Tax Act rates.",
};

export default function CalculatorPage() {
  return (
    <main>
      <section className="section section-dark">
        <div className="container" style={{ maxWidth: 820 }}>
          <span className="eyebrow">Tax tools</span>
          <h1 className="display-heading">
            Nigeria Tax <em>Calculator</em>
          </h1>
          <p style={{ marginTop: "0.5rem" }}>
            Estimate PAYE and VAT using the Nigeria Tax Act, 2025 rates
            (effective 1 January 2026). This is an estimate for planning
            purposes, not a filing figure — confirm with the Nigeria
            Revenue Service or a professional before relying on it.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <CalculatorClient />
        </div>
      </section>
    </main>
  );
}
