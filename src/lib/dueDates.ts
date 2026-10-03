/**
 * Computes the next filing deadline for a compliance area, where the
 * underlying rule research actually supports a specific day — not a
 * guess. This is deliberately NOT data-driven like complianceEngine.ts:
 * rule_versions.due_date_rule is free text for humans, not a structured
 * schedule, and only three of the five areas have a single, unconditional
 * day verified (see citations below). The other two (WHT, CIT) already
 * documented in their seed migrations that the exact day isn't confirmed
 * — this file reflects that honestly instead of inventing a date.
 */

export type DueDateInfo =
  | { kind: "confirmed"; nextDueDate: Date; label: string; daysUntil: number }
  | { kind: "unconfirmed"; label: string };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Next occurrence of a given day-of-month (e.g. the 21st), rolling to next month if already passed. */
function nextMonthlyDay(day: number, today: Date): Date {
  const base = startOfDay(today);
  const candidate = new Date(base.getFullYear(), base.getMonth(), day);
  if (candidate < base) {
    return new Date(base.getFullYear(), base.getMonth() + 1, day);
  }
  return candidate;
}

/** Next occurrence of a given month/day (1-indexed month), rolling to next year if already passed. */
function nextYearlyDate(month: number, day: number, today: Date): Date {
  const base = startOfDay(today);
  const candidate = new Date(base.getFullYear(), month - 1, day);
  if (candidate < base) {
    return new Date(base.getFullYear() + 1, month - 1, day);
  }
  return candidate;
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * ruleCode is one of CAC/VAT/PAYE/WHT/CIT. businessType matters only for
 * CAC, since CAMA 2020 sets a different deadline per entity type.
 */
export function getNextDueDate(
  ruleCode: string,
  businessType: string | null,
  today: Date = new Date()
): DueDateInfo {
  switch (ruleCode) {
    case "VAT": {
      // Nigeria Tax Administration Act, 2025, s.22(1): returns due on or
      // before the 21st day of the following month — i.e. a recurring
      // 21st-of-the-month deadline.
      const nextDueDate = nextMonthlyDay(21, today);
      return { kind: "confirmed", nextDueDate, label: "Monthly VAT return", daysUntil: daysBetween(today, nextDueDate) };
    }
    case "PAYE": {
      // NTAA 2025 s.14(1): annual return due 31 January.
      const nextDueDate = nextYearlyDate(1, 31, today);
      return { kind: "confirmed", nextDueDate, label: "Annual PAYE return", daysUntil: daysBetween(today, nextDueDate) };
    }
    case "CAC": {
      if (businessType === "sole_proprietorship") {
        // CAMA 2020 s.822(1): business names, due 30 June each year.
        const nextDueDate = nextYearlyDate(6, 30, today);
        return { kind: "confirmed", nextDueDate, label: "CAC annual return", daysUntil: daysBetween(today, nextDueDate) };
      }
      // Companies (s.417) are tied to the AGM cycle with no fixed day;
      // incorporated trustees (s.848) get a window (30 Jun–31 Dec), not a
      // single date. Neither resolves to one confirmed day.
      return { kind: "unconfirmed", label: "CAC annual return — exact date depends on your AGM/registration date" };
    }
    case "WHT":
      // NTAA 2025 s.51(1) defers the exact remittance day to regulations
      // that weren't located — see the WHT rule's own seed migration.
      return { kind: "unconfirmed", label: "Monthly WHT remittance — exact day not yet confirmed" };
    case "CIT":
      // Nigeria Tax Act, 2025, s.56 doesn't itself fix a return deadline
      // distinct from the rate — see the CIT rule's own seed migration.
      return { kind: "unconfirmed", label: "Annual CIT return — exact deadline not yet confirmed" };
    default:
      return { kind: "unconfirmed", label: "Filing deadline not yet confirmed" };
  }
}

export function urgency(daysUntil: number): "overdue" | "urgent" | "soon" | "later" {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 7) return "urgent";
  if (daysUntil <= 30) return "soon";
  return "later";
}
