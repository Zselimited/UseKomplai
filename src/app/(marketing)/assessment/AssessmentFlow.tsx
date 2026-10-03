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
import { IconArrowRight, IconCheckCircle } from "@/components/icons";

function isAnswered(question: QuestionDef, answers: AssessmentAnswers) {
  const value = answers[question.id];
  return typeof value === "string" && value.trim() !== "";
}

// How long the selected-option highlight is visible before the quiz moves
// on by itself — long enough to register as feedback, short enough not to
// feel laggy.
const AUTO_ADVANCE_DELAY_MS = 320;

export default function AssessmentFlow() {
  const [answers, setAnswers] = useState<AssessmentAnswers>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"questions" | "results">("questions");
  // Blocks double-clicks/duplicate timers while an auto-advance is pending.
  const [transitioning, setTransitioning] = useState(false);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.skip || !q.skip(answers)),
    [answers]
  );

  const currentQuestion = visibleQuestions[stepIndex];
  const isLast = stepIndex === visibleQuestions.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / visibleQuestions.length) * 100);

  function applyAnswer(prev: AssessmentAnswers, id: keyof AssessmentAnswers, value: string) {
    const next = { ...prev, [id]: value };
    // Keep data honest: if they now say "no employees", don't keep a
    // stale employee-range answer around.
    if (id === "hasEmployees" && value === "no") {
      next.employeeRange = "";
    }
    return next;
  }

  function updateAnswer(id: keyof AssessmentAnswers, value: string) {
    setAnswers((prev) => applyAnswer(prev, id, value));
  }

  function advanceTo(next: AssessmentAnswers) {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }

    // Saved here so onboarding can pick it up and run the real evaluation
    // once there's an authenticated business to save it against — this
    // screen itself never shows a status, so it never needs to reach
    // Supabase at all.
    saveAssessmentAnswers(next);
    setPhase("results");
  }

  // Cards/select answers are unambiguous the moment they're picked, so the
  // quiz advances on its own instead of waiting for a separate "Continue"
  // click — computing `next` directly (rather than reading the `answers`
  // state var) means the save on the final question always has the answer
  // that was just picked, even though this runs after a delay.
  function selectAndAdvance(id: keyof AssessmentAnswers, value: string) {
    if (transitioning) return;
    const next = applyAnswer(answers, id, value);
    setAnswers(next);
    setTransitioning(true);
    window.setTimeout(() => {
      setTransitioning(false);
      advanceTo(next);
    }, AUTO_ADVANCE_DELAY_MS);
  }

  function goBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  // Used by the text question's explicit Continue button only.
  function goNext() {
    advanceTo(answers);
  }

  return (
    <>
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
          <div className={`option-grid ${transitioning ? "is-transitioning" : ""}`}>
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={answers[currentQuestion.id] === option.value}
                className={`option-card ${answers[currentQuestion.id] === option.value ? "is-selected" : ""}`}
                onClick={() => selectAndAdvance(currentQuestion.id, option.value)}
                disabled={transitioning}
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
              disabled={transitioning}
              onChange={(e) => selectAndAdvance(currentQuestion.id, e.target.value)}
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
        {currentQuestion.type === "text" && (
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={goNext}
            disabled={!isAnswered(currentQuestion, answers)}
          >
            {isLast ? "See my assessment" : "Continue"}
            <IconArrowRight className="btn-arrow" />
          </button>
        )}
      </div>
    </div>

    {phase === "results" && (
      <div className="modal-overlay">
        <div className="modal-card">
          <div className="modal-badge">
            <IconCheckCircle />
          </div>
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Assessment complete
          </span>
          <h2 style={{ fontSize: "1.4rem", marginTop: "0.3rem" }}>Congratulations!</h2>
          <p className="muted">
            Your preliminary compliance results are ready. Create a free
            account or log in to see them.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link href="/signup?next=/onboarding" className="btn btn-primary btn-lg">
              Create Free Account
              <IconArrowRight className="btn-arrow" />
            </Link>
            <Link href="/login?next=/onboarding" className="btn btn-outline btn-lg">
              Log in
            </Link>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: "0.75rem" }}
            onClick={() => setPhase("questions")}
          >
            ← Back
          </button>
        </div>
      </div>
    )}
    </>
  );
}
