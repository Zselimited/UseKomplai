import type { Metadata } from "next";
import AssessmentFlow from "./AssessmentFlow";

export const metadata: Metadata = {
  title: "Compliance Assessment — Rulla",
  description:
    "Answer a few questions and get a preliminary, personalised view of the compliance areas that may apply to your Nigerian business.",
};

// Public — no login required. This is intentionally NOT in proxy.ts's
// protected-paths list.
export default function AssessmentPage() {
  return <AssessmentFlow />;
}
