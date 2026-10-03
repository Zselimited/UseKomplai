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
import { IconArrowRight, IconCheckCircle, IconLock } from "@/components/icons";

// The five MVP compliance areas, in display order. The real evaluation
// happens after signup (see OnboardingForm.tsx) — this screen never
// fetches or computes a result itself, so it works even if Supabase is
// temporarily unreachable; only login/signup actually need the network.
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
  const [phase, setPhase] = useState<"questions" | "results">("questions");

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

  function goNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    // Saved here so onboarding can pick it up and run the real evaluation
    // once there's an authenticated business to save it against — this
    // screen itself never shows a status, so it never needs to reach
    // Supabase at all.
    saveAssessmentAnswers(answers);
    setPhase("results");
  }

  if (phase === "results") {
    return (
      <div className="assessment-shell">
        <div className="assessment-results-intro">
          <span className="eyebrow">Assessment complete</span>
          <h1 style={{ fontSize: "1.7rem" }}>Your preliminary results are ready.</h1>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            We&apos;ve assessed your business across all five compliance
            areas below. Log in or create a free account to view your
            results.
          </p>
        </div>

        <div className="disclaimer-box">
          This will be a general, preliminary view based on the answers
          you gave — not professional tax or legal advice. Actual
          requirements depend on your specific business, current laws,
          regulations and official guidance.
        </div>

        <div>
          {DISPLAY_AREAS.map((area) => (
            <div className="locked-row" key={area.code}>
              <span className="locked-row-label">
                {area.code} · {area.name}
              </span>
              <IconLock />
            </div>
          ))}
        </div>

        <div className="card" style={{ textAlign: "center", marginTop: "2rem" }}>
          <h3>Log in to view your result.</h3>
          <p style={{ marginBottom: "1.25rem" }}>
            Create a free account to unlock your results, complete your
            business profile, and track it all from your own dashboard.
          </p>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link href="/signup?next=/onboarding" className="btn btn-primary btn-lg">
              Create Free Account to View Result
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
