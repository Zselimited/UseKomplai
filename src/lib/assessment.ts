import { BUSINESS_TYPES, NIGERIAN_STATES, EMPLOYEE_RANGES } from "@/lib/nigeria";

export type YesNo = "yes" | "no" | "";
export type YesNoUnsure = "yes" | "no" | "unsure" | "";

export type AssessmentAnswers = {
  businessType: string;
  registered: YesNo;
  state: string;
  industry: string;
  hasEmployees: YesNo;
  employeeRange: string;
  hasTin: YesNo;
  vatRegistered: YesNo;
  paysContractors: YesNo;
  sellsTaxableGoods: YesNoUnsure;
};

export const EMPTY_ANSWERS: AssessmentAnswers = {
  businessType: "",
  registered: "",
  state: "",
  industry: "",
  hasEmployees: "",
  employeeRange: "",
  hasTin: "",
  vatRegistered: "",
  paysContractors: "",
  sellsTaxableGoods: "",
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

const YES_NO_UNSURE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "I'm not sure" },
];

// The full question set. "employeeRange" is skipped entirely when the user
// says they have no employees — keeps the assessment feeling fast rather
// than asking a question whose answer is already implied.
export const QUESTIONS: QuestionDef[] = [
  {
    id: "businessType",
    type: "cards",
    question: "What type of business do you operate?",
    options: BUSINESS_TYPES,
  },
  {
    id: "registered",
    type: "cards",
    question: "Is your business registered?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "state",
    type: "select",
    question: "What state is your business based in?",
    options: NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
  },
  {
    id: "industry",
    type: "text",
    question: "Which industry are you in?",
    placeholder: "e.g. Retail, Consulting, Logistics",
  },
  {
    id: "sellsTaxableGoods",
    type: "cards",
    question: "Does your business sell taxable goods or services?",
    options: YES_NO_UNSURE_OPTIONS,
  },
  {
    id: "hasEmployees",
    type: "cards",
    question: "Do you have employees?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "employeeRange",
    type: "cards",
    question: "How many employees do you have?",
    options: EMPLOYEE_RANGES,
    skip: (answers) => answers.hasEmployees !== "yes",
  },
  {
    id: "hasTin",
    type: "cards",
    question: "Do you have a TIN (Tax Identification Number)?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "vatRegistered",
    type: "cards",
    question: "Are you VAT registered?",
    options: YES_NO_OPTIONS,
  },
  {
    id: "paysContractors",
    type: "cards",
    question: "Do you make payments to contractors or vendors?",
    options: YES_NO_OPTIONS,
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
    // field like sellsTaxableGoods existed) still comes back as a
    // complete, well-typed object instead of missing keys.
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
