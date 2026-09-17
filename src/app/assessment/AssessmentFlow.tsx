"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  EMPTY_ANSWERS,
  saveAssessmentAnswers,
  type AssessmentAnswers,
  type QuestionDef,
} from "@/lib/assessment";
import {
  evaluateCompliance,
  assessmentAnswersToEvaluationInput,
  toEngineRules,
  type ComplianceResult,
  type ObligationStatus,
} from "@/lib/complianceEngine";
import { getApprovedRules } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import {
  IconArrowRight,
  IconCheckCircle,
  IconAlertCircle,
  IconInfoCircle,
  IconHelpCircle,
} from "@/components/icons";

const STATUS_ICON: Record<ObligationStatus, typeof IconCheckCircle> = {
  likely_applicable: IconCheckCircle,
  may_apply: IconInfoCircle,
  needs_review: IconAlertCircle,
  not_enough_info: IconHelpCircle,
  not_indicated: IconHelpCircle,
};

// The five MVP compliance areas, in display order. The engine only ever
// returns a result for areas that actually have an approved rule in the
// database — everything else here renders as "not yet available" rather
// than a guessed or fabricated result.
const DISPLAY_AREAS = [
  { code: "CAC", name: "CAC Annual Returns" },
  { code: "VAT", name: "Value Added Tax" },
  { code: "PAYE", name: "Pay As You Earn" },
  { code: "WHT", name: "Withholding Tax" },
  { code: "CIT", name: "Company Income Tax" },
];

function isAnswered(question: QuestionDef, answers: AssessmentAnswers) {
  const value = answers[question.id];
  return typeof value === "string" && value.trim() !== "";
}

export default function AssessmentFlow() {
  const [answers, setAnswers] = useState<AssessmentAnswers>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"questions" | "loading" | "results" | "error">("questions");
  const [results, setResults] = useState<ComplianceResult[]>([]);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.skip || !q.skip(answers)),
    [answers]
  );

  const currentQuestion = visibleQuestions[stepIndex];
  const isLast = stepIndex === visibleQuestions.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / visibleQuestions.length) * 100);

  function updateAnswer(id: keyof AssessmentAnswers, value: string) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Keep data honest: if they now say "no employees", don't keep a
      // stale employee-range answer around.
      if (id === "hasEmployees" && value === "no") {
        next.employeeRange = "";
      }
      return next;
    });
  }

  function goBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  async function goNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    saveAssessmentAnswers(answers);
    setPhase("loading");

    try {
      const rows = await getApprovedRules(supabase);
      const input = assessmentAnswersToEvaluationInput(answers);
      const computed = evaluateCompliance(toEngineRules(rows), input);
      setResults(computed);
      setPhase("results");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <div className="assessment-shell">
        <div className="assessment-results-intro">
          <span className="eyebrow">Preliminary results</span>
          <h1 style={{ fontSize: "1.7rem" }}>Working out what may apply...</h1>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="assessment-shell">
        <div className="assessment-results-intro">
          <h1 style={{ fontSize: "1.7rem" }}>Something went wrong</h1>
          <p className="muted">
            We couldn&apos;t load your assessment results. Please check your
            connection and try again.
          </p>
        </div>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const resultByCode = new Map(results.map((r) => [r.code, r]));

    return (
      <div className="assessment-shell">
        <div className="assessment-results-intro">
          <span className="eyebrow">Preliminary results</span>
          <h1 style={{ fontSize: "1.7rem" }}>Your preliminary compliance assessment</h1>
        </div>

        <div className="disclaimer-box">
          This is a general, preliminary view based on the answers you gave
          — not professional tax or legal advice. Actual requirements
          depend on your specific business, current laws, regulations and
          official guidance.
        </div>

        <div>
          {DISPLAY_AREAS.map((area, i) => {
            const r = resultByCode.get(area.code);

            if (!r) {
              return (
                <div className="result-card" key={area.code} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="result-card-main">
                    <span className="icon-tile" style={{ marginBottom: 0 }}>
                      <IconHelpCircle />
                    </span>
                    <div>
                      <h4>
                        {area.code} · {area.name}
                      </h4>
                      <p>This compliance area isn&apos;t part of the assessment yet.</p>
                    </div>
                  </div>
                  <span className="status-pill status-not_enough_info">Not yet available</span>
                </div>
              );
            }

            const Icon = STATUS_ICON[r.status];
            return (
              <div className="result-card" key={area.code} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="result-card-main">
                  <span
                    className={`icon-tile ${r.status === "likely_applicable" ? "green" : ""}`}
                    style={{ marginBottom: 0 }}
                  >
                    <Icon />
                  </span>
                  <div>
                    <h4>
                      {r.code} · {r.name}
                    </h4>
                    <p>{r.reason}</p>
                    {r.sourceAuthority && (
                      <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.35rem" }}>
                        Source: {r.sourceAuthority}
                        {r.sourceUrl && (
                          <>
                            {" — "}
                            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
                              View source →
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`status-pill status-${r.status}`}>{r.statusLabel}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ textAlign: "center", marginTop: "2rem" }}>
          <h3>Save your assessment and continue with Komplai.</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            Create a free account to save this assessment, complete your
            business profile, and track it from your dashboard.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link href="/signup?next=/onboarding" className="btn btn-primary btn-lg">
              Create Free Account
              <IconArrowRight className="btn-arrow" />
            </Link>
            <Link href="/login?next=/onboarding" className="btn btn-outline btn-lg">
              Log in
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPhase("questions");
              setStepIndex(visibleQuestions.length - 1);
            }}
          >
            ← Edit my answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-shell">
      <div className="assessment-progress-head">
        <span>
          Step {stepIndex + 1} / {visibleQuestions.length}
        </span>
        <span>{progressPct}%</span>
      </div>
      <div className="assessment-progress-track">
        <div className="assessment-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="assessment-question" key={currentQuestion.id}>
        <h2>{currentQuestion.question}</h2>

        {currentQuestion.type === "cards" && (
          <div className="option-grid">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={answers[currentQuestion.id] === option.value}
                className={`option-card ${answers[currentQuestion.id] === option.value ? "is-selected" : ""}`}
                onClick={() => updateAnswer(currentQuestion.id, option.value)}
              >
                {option.label}
                <span className="check">
                  <IconCheckCircle />
                </span>
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === "select" && (
          <div className="field" style={{ marginBottom: "2rem" }}>
            <select
              aria-label={currentQuestion.question}
              value={answers[currentQuestion.id]}
              onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            >
              <option value="" disabled>
                Select an option
              </option>
              {currentQuestion.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentQuestion.type === "text" && (
          <div className="field" style={{ marginBottom: "2rem" }}>
            <input
              aria-label={currentQuestion.question}
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id]}
              onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="assessment-nav-row">
        <button type="button" className="btn btn-outline" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={goNext}
          disabled={!isAnswered(currentQuestion, answers)}
        >
          {isLast ? "See my assessment" : "Continue"}
          <IconArrowRight className="btn-arrow" />
        </button>
      </div>
    </div>
  );
}
