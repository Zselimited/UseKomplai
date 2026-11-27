"use client";

import { useState } from "react";
import { STATUS_LABELS, type ObligationStatus } from "@/lib/complianceEngine";
import { buildOfficerWhatsAppLink } from "@/lib/whatsapp";
import { IconCheckCircle, IconAlertCircle, IconHelpCircle, IconChevronDown } from "@/components/icons";
import Modal from "@/components/Modal";

export type ObligationCardData = {
  code: string;
  name: string;
  status: ObligationStatus | null;
  reason: string | null;
  sourceAuthority: string | null;
  sourceUrl: string | null;
  requiresReview: boolean | null;
  needsAction: boolean;
};

const THEME: Record<string, { tone: string; Icon: typeof IconCheckCircle }> = {
  likely_applicable: { tone: "positive", Icon: IconCheckCircle },
  needs_review: { tone: "warning", Icon: IconAlertCircle },
  may_apply: { tone: "warning", Icon: IconAlertCircle },
  not_indicated: { tone: "neutral", Icon: IconHelpCircle },
  not_enough_info: { tone: "neutral", Icon: IconHelpCircle },
};

function ObligationCardTrigger({ data, index, onOpen }: { data: ObligationCardData; index: number; onOpen: () => void }) {
  const theme = (data.status && THEME[data.status]) || THEME.not_enough_info;
  const Icon = theme.Icon;
  const label = data.status ? STATUS_LABELS[data.status] : "Not yet available";

  return (
    <button
      type="button"
      className={`obligation-card is-${theme.tone}`}
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={onOpen}
    >
      <span className="obligation-card-trigger">
        <span className="obligation-icon">
          <Icon />
        </span>
        <span className="obligation-card-trigger-text">
          <span className="obligation-code">{data.code}</span>
          <h4>{data.name}</h4>
        </span>
        <IconChevronDown className="obligation-chevron" />
      </span>

      <span className="obligation-status-badge">{label}</span>
    </button>
  );
}

function ObligationDetailModal({ data, onClose }: { data: ObligationCardData; onClose: () => void }) {
  const theme = (data.status && THEME[data.status]) || THEME.not_enough_info;
  const Icon = theme.Icon;
  const label = data.status ? STATUS_LABELS[data.status] : "Not yet available";

  // Every card gets a confident next step, not just the ones flagged as
  // needing action — a "not applicable" result is still worth a second
  // opinion or a pointer to the official rule, not a dead end.
  let actionPrompt: string;
  let whatsAppMessage: string;
  if (data.status === null) {
    actionPrompt = "Questions about this area?";
    whatsAppMessage = `Hi, I have a question about ${data.code} (${data.name}) on Rulla.`;
  } else if (data.needsAction) {
    actionPrompt = `Need help getting your ${data.code} sorted?`;
    whatsAppMessage = `Hi, I need help getting my ${data.code} (${data.name}) sorted on Rulla.`;
  } else {
    actionPrompt = "Want a Rulla officer to confirm this is right for your business?";
    whatsAppMessage = `Hi, I'd like a Rulla officer to double-check my ${data.code} (${data.name}) status on Rulla.`;
  }
  const whatsAppLink = buildOfficerWhatsAppLink(whatsAppMessage);

  return (
    <Modal onClose={onClose}>
      <div className="modal-detail-head">
        <span className="obligation-icon">
          <Icon />
        </span>
        <div>
          <span className="obligation-code">{data.code}</span>
          <h3>{data.name}</h3>
        </div>
      </div>

      <span className="obligation-status-badge" style={{ margin: "0 0 1rem" }}>
        {label}
      </span>

      <div className="modal-detail-body">
        <p>{data.reason ?? "This compliance area isn't implemented yet."}</p>
        {data.sourceAuthority && <p className="modal-detail-source">Source: {data.sourceAuthority}</p>}

        <p className="modal-action-prompt">{actionPrompt}</p>
        <div className="modal-action-buttons">
          {data.sourceUrl && (
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-action btn-action-source">
              Official source
            </a>
          )}
          <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="btn-action btn-action-officer">
            Contact a Rulla officer today
          </a>
        </div>
      </div>
    </Modal>
  );
}

export default function ObligationsGrid({ items }: { items: ObligationCardData[] }) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const activeItem = items.find((item) => item.code === activeCode) ?? null;

  return (
    <div className="obligation-grid">
      {items.map((item, i) => (
        <ObligationCardTrigger key={item.code} data={item} index={i} onOpen={() => setActiveCode(item.code)} />
      ))}

      {activeItem && <ObligationDetailModal data={activeItem} onClose={() => setActiveCode(null)} />}
    </div>
  );
}
