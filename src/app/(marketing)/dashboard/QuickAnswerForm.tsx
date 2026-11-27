"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const FILING_STATUS_OPTIONS = [
  { value: "regularly", label: "Yes, regularly" },
  { value: "sometimes", label: "Sometimes" },
  { value: "no", label: "No" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "unsure", label: "Not sure" },
];

const CAC_RETURN_OPTIONS = [
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "over_a_year_ago", label: "Over a year ago" },
  { value: "never", label: "Never" },
  { value: "unsure", label: "Not sure" },
];

const TURNOVER_BAND_OPTIONS = [
  { value: "none", label: "Not generating revenue yet" },
  { value: "under_5m", label: "Below ₦5m" },
  { value: "5m_25m", label: "₦5m–₦25m" },
  { value: "25m_50m", label: "₦25m–₦50m" },
  { value: "50m_100m", label: "₦50m–₦100m" },
  { value: "100m_500m", label: "₦100m–₦500m" },
  { value: "above_500m", label: "Above ₦500m" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "sole_proprietorship", label: "Sole Proprietorship / Business Name" },
  { value: "llc", label: "Limited Liability Company" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "incorporated_trustee", label: "Incorporated Trustee (NGO / Association)" },
  { value: "other", label: "Other" },
];

const FILING_QUESTION_LABELS: Record<string, string> = {
  VAT: "Do you file VAT returns?",
  PAYE: "Do you remit PAYE?",
  WHT: "Do you deduct/remit withholding tax?",
};

const FILING_FIELD_BY_CODE: Record<string, string> = {
  VAT: "vat_filing_status",
  PAYE: "paye_filing_status",
  WHT: "wht_filing_status",
};

export type QuickAnswerValues = {
  businessType: string | null;
  isRegistered: boolean | null;
  hasEmployees: boolean | null;
  usesContractors: boolean | null;
  estimatedAnnualRevenueBand: string | null;
  cacLastReturnStatus: string | null;
  vatFilingStatus: string | null;
  payeFilingStatus: string | null;
  whtFilingStatus: string | null;
};

function useFieldSave(businessId: string) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(table: "business_profiles" | "businesses", patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } =
      table === "business_profiles"
        ? await supabase.from("business_profiles").update(patch).eq("business_id", businessId)
        : await supabase.from("businesses").update(patch).eq("id", businessId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return { save, saving, error, saved };
}

function YesNoRow({
  label,
  value,
  saving,
  onAnswer,
  noLabel = "No",
}: {
  label: string;
  value: boolean | null;
  saving: boolean;
  onAnswer: (value: boolean) => void;
  noLabel?: string;
}) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <p className="modal-quick-edit-label">{label}</p>
      <div className="modal-quick-edit-pills">
        <button
          type="button"
          className={`quick-edit-pill ${value === true ? "is-active" : ""}`}
          disabled={saving}
          onClick={() => onAnswer(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`quick-edit-pill ${value === false ? "is-active" : ""}`}
          disabled={saving}
          onClick={() => onAnswer(false)}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  saving,
  onAnswer,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  saving: boolean;
  onAnswer: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <p className="modal-quick-edit-label">{label}</p>
      <select className="quick-edit-select" value={value ?? ""} disabled={saving} onChange={(event) => onAnswer(event.target.value)}>
        <option value="" disabled>
          Choose one
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function QuickAnswerForm({
  businessId,
  code,
  values,
}: {
  businessId: string;
  code: string;
  values: QuickAnswerValues;
}) {
  const { save, saving, error, saved } = useFieldSave(businessId);

  function savedNote() {
    return saved && !saving ? <p className="quick-edit-saved">Saved — updating your result.</p> : null;
  }

  function errorNote() {
    return error ? (
      <p className="error-text" style={{ fontSize: "0.8rem" }}>
        {error}
      </p>
    ) : null;
  }

  if (code === "CAC") {
    return (
      <div className="modal-quick-edit">
        <YesNoRow
          label="Is your business registered with CAC?"
          value={values.isRegistered}
          saving={saving}
          noLabel="Not yet"
          onAnswer={(v) => save("business_profiles", { is_registered: v })}
        />
        {values.isRegistered && (
          <SelectRow
            label="When did you last file your CAC annual return?"
            value={values.cacLastReturnStatus}
            options={CAC_RETURN_OPTIONS}
            saving={saving}
            onAnswer={(v) => save("business_profiles", { cac_last_return_status: v })}
          />
        )}
        {errorNote()}
        {savedNote()}
      </div>
    );
  }

  if (code === "VAT" || code === "PAYE" || code === "WHT") {
    return (
      <div className="modal-quick-edit">
        {code === "PAYE" && (
          <YesNoRow
            label="Does your business have employees?"
            value={values.hasEmployees}
            saving={saving}
            onAnswer={(v) => save("business_profiles", { has_employees: v })}
          />
        )}
        {code === "WHT" && (
          <YesNoRow
            label="Does your business pay contractors or vendors?"
            value={values.usesContractors}
            saving={saving}
            onAnswer={(v) => save("business_profiles", { uses_contractors: v })}
          />
        )}
        {code === "VAT" && (
          <SelectRow
            label="What's your estimated annual revenue?"
            value={values.estimatedAnnualRevenueBand}
            options={TURNOVER_BAND_OPTIONS}
            saving={saving}
            onAnswer={(v) => save("business_profiles", { estimated_annual_revenue_band: v })}
          />
        )}
        <SelectRow
          label={FILING_QUESTION_LABELS[code]}
          value={
            code === "VAT" ? values.vatFilingStatus : code === "PAYE" ? values.payeFilingStatus : values.whtFilingStatus
          }
          options={FILING_STATUS_OPTIONS}
          saving={saving}
          onAnswer={(v) => save("business_profiles", { [FILING_FIELD_BY_CODE[code]]: v })}
        />
        {errorNote()}
        {savedNote()}
      </div>
    );
  }

  if (code === "CIT") {
    return (
      <div className="modal-quick-edit">
        <YesNoRow
          label="Is your business registered?"
          value={values.isRegistered}
          saving={saving}
          noLabel="Not yet"
          onAnswer={(v) => save("business_profiles", { is_registered: v })}
        />
        <SelectRow
          label="What type of business do you have?"
          value={values.businessType}
          options={BUSINESS_TYPE_OPTIONS}
          saving={saving}
          onAnswer={(v) => save("businesses", { business_type: v })}
        />
        <SelectRow
          label="What's your estimated annual revenue?"
          value={values.estimatedAnnualRevenueBand}
          options={TURNOVER_BAND_OPTIONS}
          saving={saving}
          onAnswer={(v) => save("business_profiles", { estimated_annual_revenue_band: v })}
        />
        {errorNote()}
        {savedNote()}
      </div>
    );
  }

  return null;
}
