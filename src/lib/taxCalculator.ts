/**
 * Nigeria PAYE + VAT calculator — pure functions, no UI or Supabase coupling.
 *
 * WHT is deliberately not included here. The existing WHT compliance rule
 * (see supabase/migrations/20260917210121_seed_paye_wht_cit_cac_rules_v1.sql)
 * already found that the Nigeria Tax Administration Act, 2025, s.51(1)
 * defers the actual withholding rate to separate regulations that were not
 * located — the same gap applies here, so a WHT calculator would have to
 * guess a rate. Skipped until those regulations are actually sourced.
 *
 * SOURCES (cross-checked across three independent professional summaries —
 * Adeola Oyinlade & Co, owoode.com's rate table, and a second independent
 * search synthesis — all of which state these figures identically):
 *
 *   PAYE bands — Nigeria Tax Act, 2025, Fourth Schedule, effective
 *   1 January 2026. Six bands, first ₦800,000 of chargeable income
 *   tax-free, rising to 25% above ₦50,000,000.
 *
 *   Reliefs — NTA 2025 s.30(2)(a): pension, NHF and NHIS contributions are
 *   deducted from gross income before the bands are applied. Rent relief
 *   is 20% of annual rent paid, capped at ₦500,000. (Housing loan interest
 *   and life insurance premiums are also listed as allowable deductions
 *   under the same section but aren't collected here — out of scope for
 *   this first version.)
 *
 *   VAT rate — 7.5%, unchanged by the 2025 reform (multiple sources
 *   agree the standard rate itself didn't move; what changed is input-VAT
 *   recoverability and the zero-rated/exempt category lists).
 *
 * Not yet verified against the Act's own PDF text directly — the official
 * NRS-hosted copy is 62MB and repeated download attempts were cut short by
 * the server before completing. Revisit with the primary text if a
 * reliable copy becomes available; until then this rests on independent
 * secondary-source agreement rather than a direct quote.
 */

export type PayeBand = {
  /** Lower bound of this band, in naira, inclusive. */
  from: number;
  /** Upper bound, exclusive. null = no upper bound (final band). */
  to: number | null;
  rate: number;
};

export const PAYE_BANDS_2026: PayeBand[] = [
  { from: 0, to: 800_000, rate: 0 },
  { from: 800_000, to: 3_000_000, rate: 0.15 },
  { from: 3_000_000, to: 12_000_000, rate: 0.18 },
  { from: 12_000_000, to: 25_000_000, rate: 0.21 },
  { from: 25_000_000, to: 50_000_000, rate: 0.23 },
  { from: 50_000_000, to: null, rate: 0.25 },
];

export const RENT_RELIEF_RATE = 0.2;
export const RENT_RELIEF_CAP = 500_000;
export const VAT_RATE = 0.075;

export type PayeInput = {
  grossAnnualIncome: number;
  pensionAnnual?: number;
  nhisAnnual?: number;
  nhfAnnual?: number;
  rentAnnual?: number;
};

export type PayeBandBreakdown = {
  from: number;
  to: number | null;
  rate: number;
  taxableInThisBand: number;
  taxInThisBand: number;
};

export type PayeResult = {
  grossAnnualIncome: number;
  totalReliefs: number;
  rentRelief: number;
  chargeableIncome: number;
  annualTax: number;
  monthlyTax: number;
  effectiveRate: number;
  bands: PayeBandBreakdown[];
};

export function calculatePaye(input: PayeInput): PayeResult {
  const gross = Math.max(0, input.grossAnnualIncome || 0);
  const pension = Math.max(0, input.pensionAnnual || 0);
  const nhis = Math.max(0, input.nhisAnnual || 0);
  const nhf = Math.max(0, input.nhfAnnual || 0);
  const rent = Math.max(0, input.rentAnnual || 0);

  const rentRelief = Math.min(rent * RENT_RELIEF_RATE, RENT_RELIEF_CAP);
  const totalReliefs = pension + nhis + nhf + rentRelief;
  const chargeableIncome = Math.max(0, gross - totalReliefs);

  const bands: PayeBandBreakdown[] = [];
  let remaining = chargeableIncome;
  let annualTax = 0;

  for (const band of PAYE_BANDS_2026) {
    const bandWidth = band.to === null ? Infinity : band.to - band.from;
    const taxableInThisBand = Math.min(remaining, bandWidth);
    const taxInThisBand = taxableInThisBand > 0 ? taxableInThisBand * band.rate : 0;

    bands.push({ from: band.from, to: band.to, rate: band.rate, taxableInThisBand, taxInThisBand });

    annualTax += taxInThisBand;
    remaining -= taxableInThisBand;
    if (remaining <= 0) break;
  }

  return {
    grossAnnualIncome: gross,
    totalReliefs,
    rentRelief,
    chargeableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    effectiveRate: gross > 0 ? annualTax / gross : 0,
    bands,
  };
}

export type VatDirection = "exclusive" | "inclusive";

export type VatInput = {
  amount: number;
  direction: VatDirection;
};

export type VatResult = {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
};

/**
 * "exclusive" = amount is the pre-VAT price; VAT is added on top.
 * "inclusive" = amount already includes VAT; this backs the VAT out.
 */
export function calculateVat(input: VatInput): VatResult {
  const amount = Math.max(0, input.amount || 0);

  if (input.direction === "inclusive") {
    const netAmount = amount / (1 + VAT_RATE);
    const vatAmount = amount - netAmount;
    return { netAmount, vatAmount, grossAmount: amount };
  }

  const vatAmount = amount * VAT_RATE;
  return { netAmount: amount, vatAmount, grossAmount: amount + vatAmount };
}
