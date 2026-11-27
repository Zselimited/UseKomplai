"use client";

import { useState } from "react";
import ObligationsGrid, { ObligationDetailModal, type ObligationCardData, type ProfileAnswers } from "./ObligationsGrid";

function naturalJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export default function ComplianceOverview({
  obligationCards,
  businessId,
  profileAnswers,
  complianceScore,
}: {
  obligationCards: ObligationCardData[];
  businessId: string;
  profileAnswers: ProfileAnswers;
  complianceScore: { percent: number; handledCount: number; totalCount: number };
}) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const activeItem = obligationCards.find((item) => item.code === activeCode) ?? null;
  const attentionAreas = obligationCards.filter((c) => c.needsAction);
  const attentionCodes = attentionAreas.map((a) => a.code);

  let scoreMessage: string;
  if (complianceScore.totalCount === 0) {
    scoreMessage = "Based on what you've told us, no compliance area currently applies to your business. This updates as you add more details.";
  } else if (attentionCodes.length === 0) {
    scoreMessage = "You're up to date on everything Rulla currently checks for your business.";
  } else {
    scoreMessage = `Fill in your ${naturalJoin(attentionCodes)} details, or get a Rulla officer's help, to raise your score.`;
  }

  return (
    <>
      <section className="card compliance-score-card order-m-1" style={{ marginBottom: "1.25rem" }}>
        <div className="compliance-score-ring" style={{ "--score": complianceScore.percent } as React.CSSProperties}>
          <span className="compliance-score-number">{complianceScore.percent}%</span>
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
            {complianceScore.totalCount === 0 ? "Nothing flagged yet" : `${complianceScore.percent}% compliant`}
          </h2>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            {scoreMessage}
          </p>

          {attentionCodes.length > 0 && (
            <div className="score-attention">
              <span className="score-attention-label">Fix now:</span>
              <div className="score-attention-chips">
                {attentionAreas.map((area) => (
                  <button
                    key={area.code}
                    type="button"
                    className="score-attention-chip"
                    onClick={() => setActiveCode(area.code)}
                  >
                    {area.code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card order-m-2" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Compliance Obligations</h2>
        <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Tap a card for the full reasoning and source behind each result.
        </p>
        <ObligationsGrid items={obligationCards} onOpenCode={setActiveCode} />
      </section>

      {activeItem && (
        <ObligationDetailModal
          data={activeItem}
          businessId={businessId}
          profileAnswers={profileAnswers}
          onClose={() => setActiveCode(null)}
        />
      )}
    </>
  );
}
