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

export default function QuickAnswerForm({
  businessId,
  code,
  isRegistered,
  cacLastReturnStatus,
  vatFilingStatus,
  payeFilingStatus,
  whtFilingStatus,
}: {
  businessId: string;
  code: string;
  isRegistered: boolean | null;
  cacLastReturnStatus: string | null;
  vatFilingStatus: string | null;
  payeFilingStatus: string | null;
  whtFilingStatus: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase.from("business_profiles").update(patch).eq("business_id", businessId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  if (code === "CAC") {
    return (
      <div className="modal-quick-edit">
        <p className="modal-quick-edit-label">Is your business registered with CAC?</p>
        <div className="modal-quick-edit-pills">
          <button
            type="button"
            className={`quick-edit-pill ${isRegistered === true ? "is-active" : ""}`}
            disabled={saving}
            onClick={() => save({ is_registered: true })}
          >
            Yes
          </button>
          <button
            type="button"
            className={`quick-edit-pill ${isRegistered === false ? "is-active" : ""}`}
            disabled={saving}
            onClick={() => save({ is_registered: false })}
          >
            Not yet
          </button>
        </div>

        {isRegistered && (
          <>
            <p className="modal-quick-edit-label" style={{ marginTop: "0.85rem" }}>
              When did you last file your CAC annual return?
            </p>
            <select
              className="quick-edit-select"
              value={cacLastReturnStatus ?? ""}
              disabled={saving}
              onChange={(event) => save({ cac_last_return_status: event.target.value })}
            >
              <option value="" disabled>
                Choose one
              </option>
              {CAC_RETURN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </>
        )}

        {error && (
          <p className="error-text" style={{ fontSize: "0.8rem" }}>
            {error}
          </p>
        )}
        {saved && !saving && <p className="quick-edit-saved">Saved — updating your result.</p>}
      </div>
    );
  }

  const filingField = FILING_FIELD_BY_CODE[code];
  if (!filingField) return null;

  const currentValue = code === "VAT" ? vatFilingStatus : code === "PAYE" ? payeFilingStatus : whtFilingStatus;

  return (
    <div className="modal-quick-edit">
      <p className="modal-quick-edit-label">{FILING_QUESTION_LABELS[code]}</p>
      <select
        className="quick-edit-select"
        value={currentValue ?? ""}
        disabled={saving}
        onChange={(event) => save({ [filingField]: event.target.value })}
      >
        <option value="" disabled>
          Choose one
        </option>
        {FILING_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="error-text" style={{ fontSize: "0.8rem" }}>
          {error}
        </p>
      )}
      {saved && !saving && <p className="quick-edit-saved">Saved — updating your result.</p>}
    </div>
  );
}
