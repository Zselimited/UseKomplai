import {
  BUSINESS_TYPES,
  NIGERIAN_STATES,
  EMPLOYEE_RANGES,
  TURNOVER_BANDS,
  INDUSTRIES,
  FILING_STATUS_OPTIONS,
  PAYE_FILING_STATUS_OPTIONS,
  CAC_LAST_RETURN_OPTIONS,
  registrationYearOptions,
} from "@/lib/nigeria";

export type YesNo = "yes" | "no" | "";

export type AssessmentAnswers = {
  registered: YesNo;
  businessType: string;
  cacRegNumber: string;
  yearRegistered: string;
  industry: string;
  businessDescription: string;
  state: string;
  multiState: YesNo;
  annualTurnover: string;
  hasEmployees: YesNo;
  employeeRange: string;
  paysContractors: YesNo;
  vatFilingStatus: string;
  payeFilingStatus: string;
  whtFilingStatus: string;
  cacLastReturn: string;
};

export const EMPTY_ANSWERS: AssessmentAnswers = {
  registered: "",
  businessType: "",
  cacRegNumber: "",
  yearRegistered: "",
  industry: "",
  businessDescription: "",
  state: "",
  multiState: "",
  annualTurnover: "",
  hasEmployees: "",
  employeeRange: "",
  paysContractors: "",
  vatFilingStatus: "",
  payeFilingStatus: "",
  whtFilingStatus: "",
  cacLastReturn: "",
};

export type QuestionDef =
  | {
      id: keyof AssessmentAnswers;
      type: "cards";
      question: string;
      options: { value: string; label: string }[];
      skip?: (answers: AssessmentAnswers) => boolean;
    }
  | {
      id: keyof AssessmentAnswers;
      type: "select";
      question: string;
      options: { value: string; label: string }[];
      skip?: (answers: AssessmentAnswers) => boolean;
    }
  | {
      id: keyof AssessmentAnswers;
      type: "text";
      question: string;
      placeholder?: string;
      skip?: (answers: AssessmentAnswers) => boolean;
    };

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Matches the Business Compliance Profile brief's 16-question set (minus
// TIN, which no rule condition ever used — see complianceEngine.ts) in
// the brief's own order. Filing-status questions deliberately keep their
// nuanced answer ("regularly"/"sometimes"/"no"/"unsure") rather than
// collapsing to yes/no, so the rule engine can treat "sometimes" and "no"
// differently instead of guessing.
export const QUESTIONS: QuestionDef[] = [
  {
    id: "registered",
    type: "cards",
    question: "Is your business registered with CAC?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "businessType",
    type: "cards",
    question: "What is your legal structure?",
    options: BUSINESS_TYPES,
  },
  {
    id: "cacRegNumber",
    type: "text",
    question: "What is your CAC registration number?",
    placeholder: "RC / BN number",
    skip: (answers) => answers.registered !== "yes",
  },
  {
    id: "yearRegistered",
    type: "select",
    question: "What year was your business registered?",
    options: registrationYearOptions().map((y) => ({ value: y, label: y })),
    skip: (answers) => answers.registered !== "yes",
  },
  {
    id: "industry",
    type: "select",
    question: "What industry does your business operate in?",
    options: INDUSTRIES.map((i) => ({ value: i, label: i })),
  },
  {
    id: "businessDescription",
    type: "text",
    question: "Briefly describe what your business does.",
    placeholder: "A sentence or two is enough",
  },
  {
    id: "state",
    type: "select",
    question: "Which state is your main business location?",
    options: NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
  },
  {
    id: "multiState",
    type: "cards",
    question: "Do you operate in more than one state?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "annualTurnover",
    type: "cards",
    question: "What was your approximate annual turnover in the last financial year?",
    options: TURNOVER_BANDS,
  },
  {
    id: "hasEmployees",
    type: "cards",
    question: "Do you currently have employees?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "employeeRange",
    type: "cards",
    question: "How many employees do you currently have?",
    options: EMPLOYEE_RANGES,
    skip: (answers) => answers.hasEmployees !== "yes",
  },
  {
    id: "paysContractors",
    type: "cards",
    question: "Do you regularly pay contractors, consultants, landlords or other service providers?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "vatFilingStatus",
    type: "cards",
    question: "Do you currently file VAT returns?",
    options: FILING_STATUS_OPTIONS,
  },
  {
    id: "payeFilingStatus",
    type: "cards",
    question: "Do you currently remit PAYE for employees?",
    options: PAYE_FILING_STATUS_OPTIONS,
    skip: (answers) => answers.hasEmployees !== "yes",
  },
  {
    id: "whtFilingStatus",
    type: "cards",
    question: "Do you currently deduct or remit WHT?",
    options: FILING_STATUS_OPTIONS,
  },
  {
    id: "cacLastReturn",
    type: "select",
    question: "When did you last file your CAC Annual Return?",
    options: CAC_LAST_RETURN_OPTIONS,
    skip: (answers) => answers.registered !== "yes",
  },
];

// ---- localStorage bridge between the anonymous assessment and onboarding ----
// No database table is used for this — answers live only in the visitor's
// browser until they create an account, at which point onboarding reads
// and clears this to prefill the real business_profiles row.

const STORAGE_KEY = "komplai_assessment_answers";

export function saveAssessmentAnswers(answers: AssessmentAnswers) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Ignore — private browsing / storage disabled. Non-critical.
  }
}

export function loadAssessmentAnswers(): AssessmentAnswers | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Merge over EMPTY_ANSWERS so an older saved payload (from before a
    // field existed) still comes back as a complete, well-typed object
    // instead of missing keys.
    return { ...EMPTY_ANSWERS, ...(JSON.parse(raw) as Partial<AssessmentAnswers>) };
  } catch {
    return null;
  }
}

export function clearAssessmentAnswers() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
