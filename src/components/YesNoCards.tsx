"use client";

import { IconCheckCircle } from "./icons";

export default function YesNoCards({
  name,
  value,
  onChange,
  label,
}: {
  name: string;
  value: "yes" | "no" | "";
  onChange: (value: "yes" | "no") => void;
  label: string;
}) {
  return (
    <fieldset className="field" style={{ border: "none", padding: 0 }}>
      <legend style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.35rem" }}>
        {label}
      </legend>
      <div className="option-grid" role="radiogroup" aria-label={label}>
        {(["yes", "no"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            name={name}
            className={`option-card ${value === option ? "is-selected" : ""}`}
            onClick={() => onChange(option)}
          >
            {option === "yes" ? "Yes" : "No"}
            <span className="check">
              <IconCheckCircle />
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
