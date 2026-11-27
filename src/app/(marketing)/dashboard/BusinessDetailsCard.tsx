"use client";

import { useState } from "react";
import { IconBuilding, IconChevronDown } from "@/components/icons";
import Modal from "@/components/Modal";

const FILING_STATUS_LABELS: Record<string, string> = {
  regularly: "Yes, regularly",
  sometimes: "Sometimes",
  no: "No",
  not_applicable: "Not applicable",
  unsure: "Not sure",
};

function FilingStatusPill({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="status-pill status-not_enough_info">Not provided</span>;
  }
  const label = FILING_STATUS_LABELS[value] ?? value;
  const tone =
    value === "regularly" ? "status-likely_applicable" : value === "sometimes" ? "status-needs_review" : "status-may_apply";
  return <span className={`status-pill ${tone}`}>{label}</span>;
}

const TURNOVER_BAND_LABELS: Record<string, string> = {
  none: "Not generating revenue yet",
  under_5m: "Below ₦5m",
  "5m_25m": "₦5m–₦25m",
  "25m_50m": "₦25m–₦50m",
  "50m_100m": "₦50m–₦100m",
  "100m_500m": "₦100m–₦500m",
  above_500m: "Above ₦500m",
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  sole_proprietorship: "Sole Proprietorship / Business Name",
  llc: "Limited Liability Company",
  partnership: "Partnership",
  llp: "Limited Liability Partnership (LLP)",
  incorporated_trustee: "Incorporated Trustee (NGO / Association)",
  other: "Other",
};

export default function BusinessDetailsCard({
  legalName,
  businessType,
  numberOfEmployees,
  turnoverBand,
  vatFilingStatus,
  payeFilingStatus,
  whtFilingStatus,
}: {
  legalName: string;
  businessType: string | null;
  numberOfEmployees: number | null;
  turnoverBand: string | null | undefined;
  vatFilingStatus: string | null | undefined;
  payeFilingStatus: string | null | undefined;
  whtFilingStatus: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const typeLabel = businessType ? BUSINESS_TYPE_LABELS[businessType] ?? businessType : "Business details";

  return (
    <>
      <button
        type="button"
        className="obligation-card is-neutral"
        style={{ marginBottom: "1.25rem" }}
        onClick={() => setOpen(true)}
      >
        <span className="obligation-card-trigger">
          <span className="obligation-icon">
            <IconBuilding />
          </span>
          <span className="obligation-card-trigger-text">
            <h4>{legalName}</h4>
            <span className="obligation-code" style={{ textTransform: "none" }}>
              {typeLabel}
            </span>
          </span>
          <IconChevronDown className="obligation-chevron" />
        </span>
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="modal-detail-head">
            <span className="obligation-icon">
              <IconBuilding />
            </span>
            <div>
              <h3>{legalName}</h3>
            </div>
          </div>

          <dl className="data-list">
            <div className="data-row">
              <dt>Business type</dt>
              <dd>{businessType ? typeLabel : "Not provided"}</dd>
            </div>
            <div className="data-row">
              <dt>Number of employees</dt>
              <dd>{numberOfEmployees ?? "Not provided"}</dd>
            </div>
            <div className="data-row">
              <dt>Annual turnover</dt>
              <dd>{turnoverBand ? TURNOVER_BAND_LABELS[turnoverBand] ?? turnoverBand : "Not provided"}</dd>
            </div>
            <div className="data-row">
              <dt>Files VAT returns</dt>
              <dd>
                <FilingStatusPill value={vatFilingStatus} />
              </dd>
            </div>
            <div className="data-row">
              <dt>Remits PAYE</dt>
              <dd>
                <FilingStatusPill value={payeFilingStatus} />
              </dd>
            </div>
            <div className="data-row">
              <dt>Deducts/remits WHT</dt>
              <dd>
                <FilingStatusPill value={whtFilingStatus} />
              </dd>
            </div>
          </dl>
        </Modal>
      )}
    </>
  );
}
