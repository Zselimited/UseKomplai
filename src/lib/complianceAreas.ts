/**
 * The five compliance areas Rulla currently covers. Shared between the
 * dashboard (what to display) and the reminder cron job (what to check
 * deadlines for) so the two never drift out of sync.
 */
export const COMPLIANCE_AREAS = [
  { code: "CAC", name: "CAC Annual Returns" },
  { code: "VAT", name: "Value Added Tax" },
  { code: "PAYE", name: "Pay As You Earn" },
  { code: "WHT", name: "Withholding Tax" },
  { code: "CIT", name: "Company Income Tax" },
] as const;
