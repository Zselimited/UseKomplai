"use client";

import { useMemo, useState } from "react";
import { calculatePaye, calculateVat, VAT_RATE, type VatDirection } from "@/lib/taxCalculator";

function naira(n: number) {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

function PayeCalculator() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [grossInput, setGrossInput] = useState("");
  const [pension, setPension] = useState("");
  const [nhis, setNhis] = useState("");
  const [nhf, setNhf] = useState("");
  const [rent, setRent] = useState("");

  const toAnnual = (v: string) => {
    const n = Number(v) || 0;
    return period === "monthly" ? n * 12 : n;
  };

  const result = useMemo(
    () =>
      calculatePaye({
        grossAnnualIncome: toAnnual(grossInput),
        pensionAnnual: Number(pension) || 0,
        nhisAnnual: Number(nhis) || 0,
        nhfAnnual: Number(nhf) || 0,
        rentAnnual: Number(rent) || 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grossInput, pension, nhis, nhf, rent, period]
  );

  const hasInput = (Number(grossInput) || 0) > 0;

  return (
    <div className="calc-grid">
      <div className="card">
        <div className="field-toggle-row">
          <button
            type="button"
            className={`toggle-btn ${period === "monthly" ? "is-active" : ""}`}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`toggle-btn ${period === "annual" ? "is-active" : ""}`}
            onClick={() => setPeriod("annual")}
          >
            Annual
          </button>
        </div>

        <div className="field">
          <label htmlFor="gross">Gross salary ({period})</label>
          <input
            id="gross"
            type="number"
            min={0}
            placeholder="e.g. 500,000"
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
          />
        </div>

        <p className="muted" style={{ fontSize: "0.85rem", margin: "1.25rem 0 0.75rem" }}>
          Optional deductions (annual figures, reduce taxable income)
        </p>

        <div className="field">
          <label htmlFor="pension">Pension (PFA) — annual</label>
          <input id="pension" type="number" min={0} placeholder="e.g. 96,000" value={pension} onChange={(e) => setPension(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="nhis">NHIS contribution — annual</label>
          <input id="nhis" type="number" min={0} placeholder="e.g. 36,000" value={nhis} onChange={(e) => setNhis(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="nhf">NHF contribution — annual</label>
          <input id="nhf" type="number" min={0} placeholder="e.g. 24,000" value={nhf} onChange={(e) => setNhf(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rent">Annual rent paid</label>
          <input id="rent" type="number" min={0} placeholder="e.g. 600,000" value={rent} onChange={(e) => setRent(e.target.value)} />
          <span className="field-hint">Relief is 20% of rent paid, capped at ₦500,000.</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Result</h3>

        {!hasInput ? (
          <p className="muted">Enter a gross salary to see your estimate.</p>
        ) : (
          <>
            <dl className="data-list" style={{ marginBottom: "1.25rem" }}>
              <div className="data-row">
                <dt>Chargeable income (annual)</dt>
                <dd>{naira(result.chargeableIncome)}</dd>
              </div>
              <div className="data-row">
                <dt>Total reliefs applied</dt>
                <dd>{naira(result.totalReliefs)}</dd>
              </div>
              <div className="data-row">
                <dt>Annual PAYE</dt>
                <dd>{naira(result.annualTax)}</dd>
              </div>
              <div className="data-row">
                <dt>Monthly PAYE</dt>
                <dd>{naira(result.monthlyTax)}</dd>
              </div>
              <div className="data-row">
                <dt>Effective rate</dt>
                <dd>{(result.effectiveRate * 100).toFixed(1)}%</dd>
              </div>
            </dl>

            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}>
              Band breakdown
            </p>
            <div className="band-table">
              {result.bands.map((b) => (
                <div className="band-row" key={b.from}>
                  <span>
                    {naira(b.from)} – {b.to === null ? "above" : naira(b.to)} ({Math.round(b.rate * 100)}%)
                  </span>
                  <span>{naira(b.taxInThisBand)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VatCalculator() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<VatDirection>("exclusive");

  const result = useMemo(
    () => calculateVat({ amount: Number(amount) || 0, direction }),
    [amount, direction]
  );

  const hasInput = (Number(amount) || 0) > 0;

  return (
    <div className="calc-grid">
      <div className="card">
        <div className="field-toggle-row">
          <button
            type="button"
            className={`toggle-btn ${direction === "exclusive" ? "is-active" : ""}`}
            onClick={() => setDirection("exclusive")}
          >
            Amount excludes VAT
          </button>
          <button
            type="button"
            className={`toggle-btn ${direction === "inclusive" ? "is-active" : ""}`}
            onClick={() => setDirection("inclusive")}
          >
            Amount includes VAT
          </button>
        </div>

        <div className="field">
          <label htmlFor="vatAmount">Amount</label>
          <input
            id="vatAmount"
            type="number"
            min={0}
            placeholder="e.g. 150,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="field-hint">Standard VAT rate: {(VAT_RATE * 100).toFixed(1)}%.</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Result</h3>
        {!hasInput ? (
          <p className="muted">Enter an amount to see the VAT breakdown.</p>
        ) : (
          <dl className="data-list">
            <div className="data-row">
              <dt>Net amount (excl. VAT)</dt>
              <dd>{naira(result.netAmount)}</dd>
            </div>
            <div className="data-row">
              <dt>VAT ({(VAT_RATE * 100).toFixed(1)}%)</dt>
              <dd>{naira(result.vatAmount)}</dd>
            </div>
            <div className="data-row">
              <dt>Gross amount (incl. VAT)</dt>
              <dd>{naira(result.grossAmount)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

export default function CalculatorClient() {
  const [tab, setTab] = useState<"paye" | "vat">("paye");

  return (
    <div>
      <div className="field-toggle-row" style={{ marginBottom: "1.5rem" }}>
        <button type="button" className={`toggle-btn ${tab === "paye" ? "is-active" : ""}`} onClick={() => setTab("paye")}>
          PAYE
        </button>
        <button type="button" className={`toggle-btn ${tab === "vat" ? "is-active" : ""}`} onClick={() => setTab("vat")}>
          VAT
        </button>
      </div>

      {tab === "paye" ? <PayeCalculator /> : <VatCalculator />}

      <div className="card-flat" style={{ marginTop: "2rem", fontSize: "0.82rem" }}>
        <strong>2026 PAYE bands</strong> (Nigeria Tax Act, 2025, Fourth Schedule): 0% on the
        first ₦800,000 · 15% up to ₦3,000,000 · 18% up to ₦12,000,000 · 21% up to
        ₦25,000,000 · 23% up to ₦50,000,000 · 25% above ₦50,000,000. VAT standard
        rate: 7.5%. Withholding tax isn&apos;t included here — its exact rates are set
        in separate regulations Rulla hasn&apos;t yet verified.
      </div>
    </div>
  );
}
