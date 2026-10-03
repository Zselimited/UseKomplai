"use client";

import { useState } from "react";
import { STATUS_LABELS, type ObligationStatus } from "@/lib/complianceEngine";
import { IconCheckCircle, IconAlertCircle, IconHelpCircle, IconChevronDown } from "@/components/icons";

export type ObligationCardData = {
  code: string;
  name: string;
  status: ObligationStatus | null;
  reason: string | null;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  requiresReview: boolean | null;
};

const THEME: Record<string, { tone: string; Icon: typeof IconCheckCircle }> = {
  likely_applicable: { tone: "positive", Icon: IconCheckCircle },
  needs_review: { tone: "warning", Icon: IconAlertCircle },
  may_apply: { tone: "warning", Icon: IconAlertCircle },
  not_indicated: { tone: "neutral", Icon: IconHelpCircle },
  not_enough_info: { tone: "neutral", Icon: IconHelpCircle },
};

function ObligationCard({ data, index }: { data: ObligationCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const theme = (data.status && THEME[data.status]) || THEME.not_enough_info;
  const Icon = theme.Icon;
  const label = data.status ? STATUS_LABELS[data.status] : "Not yet available";

  return (
    <div
      className={`obligation-card is-${theme.tone} ${open ? "is-open" : ""}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <button
        type="button"
        className="obligation-card-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="obligation-icon">
          <Icon />
        </span>
        <span className="obligation-card-trigger-text">
          <span className="obligation-code">{data.code}</span>
          <h4>{data.name}</h4>
        </span>
        <IconChevronDown className="obligation-chevron" />
      </button>

      <span className="obligation-status-badge">{label}</span>

      <div className="obligation-detail-wrap">
        <div className="obligation-detail">
          <p>{data.reason ?? "This compliance area isn't implemented yet."}</p>
          {data.sourceAuthority && (
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
              Source: {data.sourceAuthority}
              {data.sourceUrl && (
                <>
                  {" — "}
                  <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                    View source →
                  </a>
                </>
              )}
            </p>
          )}
          {data.requiresReview && (
            <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.25rem" }}>
              Flagged for review — confirm with a professional if you rely on it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ObligationsGrid({ items }: { items: ObligationCardData[] }) {
  return (
    <div className="obligation-grid">
      {items.map((item, i) => (
        <ObligationCard key={item.code} data={item} index={i} />
      ))}
    </div>
  );
}
