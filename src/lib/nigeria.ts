// Shared, non-sensitive reference data used by both the onboarding form
// and the public assessment — kept in one place so they never drift apart.

// "incorporated_trustee" is the correct CAMA 2020 term for the entity type
// most NGOs/associations actually register under (see the CAC rule's own
// seed migration, which cites CAMA s.848 for incorporated trustees) — this
// used to be stored as a plain "ngo" value; a migration renames existing
// rows to match.
export const BUSINESS_TYPES = [
  { value: "sole_proprietorship", label: "Sole Proprietorship / Business Name" },
  { value: "llc", label: "Limited Liability Company" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "incorporated_trustee", label: "Incorporated Trustee (NGO / Association)" },
  { value: "other", label: "Other" },
];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

// Matches the Business Compliance Profile brief's employee-count bands
// exactly (replaces the old 1-5/6-20/21-50/50+ set).
export const EMPLOYEE_RANGES = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "51-100", label: "51–100" },
  { value: "above-100", label: "Above 100" },
];

export const TURNOVER_BANDS = [
  { value: "none", label: "Not generating revenue yet" },
  { value: "under_5m", label: "Below ₦5m" },
  { value: "5m_25m", label: "₦5m–₦25m" },
  { value: "25m_50m", label: "₦25m–₦50m" },
  { value: "50m_100m", label: "₦50m–₦100m" },
  { value: "100m_500m", label: "₦100m–₦500m" },
  { value: "above_500m", label: "Above ₦500m" },
];

export const INDUSTRIES = [
  "Agriculture & Agribusiness",
  "Beauty, Cosmetics & Personal Care",
  "Construction & Engineering",
  "Consulting & Professional Services",
  "Education & Training",
  "Energy & Utilities",
  "Entertainment & Media",
  "Fashion & Apparel",
  "Financial Services",
  "Fintech",
  "Food & Beverage",
  "Healthcare & Pharmaceuticals",
  "Hospitality & Tourism",
  "Import & Export",
  "Logistics & Transportation",
  "Manufacturing",
  "Real Estate & Property",
  "Retail & E-commerce",
  "Technology & Software",
  "Telecommunications",
  "Wholesale & Distribution",
  "Non-profit / NGO",
  "Other",
];

export function registrationYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1970; y--) {
    years.push(String(y));
  }
  return years;
}

// "regularly"/"sometimes" both indicate real filing activity (vs. "no"/
// "unsure") — kept as the raw answer rather than collapsed to a boolean,
// so rule conditions can branch on the nuance directly.
export const FILING_STATUS_OPTIONS = [
  { value: "regularly", label: "Yes, regularly" },
  { value: "sometimes", label: "Sometimes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "I'm not sure" },
];

export const PAYE_FILING_STATUS_OPTIONS = [
  { value: "regularly", label: "Yes, regularly" },
  { value: "sometimes", label: "Sometimes" },
  { value: "no", label: "No" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "unsure", label: "I'm not sure" },
];

export const CAC_LAST_RETURN_OPTIONS = [
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "over_a_year_ago", label: "More than 1 year ago" },
  { value: "never", label: "Never" },
  { value: "unsure", label: "I'm not sure" },
];
