import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getNextDueDate, type DueDateInfo } from "@/lib/dueDates";
import { COMPLIANCE_AREAS } from "@/lib/complianceAreas";

// Runs daily (see vercel.json). For every business with at least one
// likely_applicable obligation that has a confirmed next due date, sends
// an email at three thresholds — 7 days out, 1 day out, and due today —
// each exactly once per (business, rule, due date), enforced by
// reminder_log's unique constraint rather than by trusting the cron
// schedule to run perfectly.

export const dynamic = "force-dynamic";

type Threshold = { key: "soon_7d" | "soon_1d" | "due_today"; maxDays: number };

const THRESHOLDS: Threshold[] = [
  { key: "due_today", maxDays: 0 },
  { key: "soon_1d", maxDays: 1 },
  { key: "soon_7d", maxDays: 7 },
];

function thresholdLabel(key: Threshold["key"]): string {
  if (key === "due_today") return "due today";
  if (key === "soon_1d") return "due tomorrow";
  return "due within a week";
}

async function sendReminderEmail(args: {
  to: string;
  businessName: string;
  ruleCode: string;
  ruleName: string;
  dueDate: Date;
  daysUntil: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const from = process.env.REMINDER_FROM_EMAIL || "Rulla <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const dueDateLabel = args.dueDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const whenPhrase =
    args.daysUntil === 0
      ? "today"
      : args.daysUntil === 1
        ? "tomorrow"
        : `in ${args.daysUntil} days`;

  const subject =
    args.daysUntil === 0
      ? `Due today: ${args.ruleCode} filing for ${args.businessName}`
      : `${args.ruleCode} filing due ${whenPhrase} — ${args.businessName}`;

  const html = `
    <p>Hi,</p>
    <p>Your <strong>${args.ruleName}</strong> (${args.ruleCode}) obligation for
    <strong>${args.businessName}</strong> is due <strong>${whenPhrase}</strong>
    (${dueDateLabel}).</p>
    ${siteUrl ? `<p><a href="${siteUrl}/dashboard">View your dashboard</a></p>` : ""}
    <p style="color:#667085;font-size:12px">
      This is an informational reminder, not professional tax or legal
      advice. Confirm exact requirements with the Nigeria Revenue Service,
      the Corporate Affairs Commission, or a professional before relying
      on it.
    </p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: args.to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createSupabaseAdminClient();
  const today = new Date();
  const ruleNameByCode = new Map<string, string>(COMPLIANCE_AREAS.map((a) => [a.code, a.name]));

  const { data: obligationRows, error: obligationsError } = await admin
    .from("business_obligations")
    .select("business_id, compliance_rules!inner(rule_code)")
    .eq("applicability_status", "likely_applicable")
    .eq("is_active", true);

  if (obligationsError) {
    return NextResponse.json({ error: obligationsError.message }, { status: 500 });
  }

  type ObligationRow = { business_id: string; compliance_rules: { rule_code: string } | { rule_code: string }[] };
  const rows = (obligationRows ?? []) as ObligationRow[];

  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, checked: 0, errors: [] });
  }

  const businessIds = [...new Set(rows.map((r) => r.business_id))];

  const [{ data: businesses, error: businessesError }, { data: members, error: membersError }] = await Promise.all([
    admin.from("businesses").select("id, legal_name, business_type").in("id", businessIds),
    admin.from("business_members").select("business_id, user_id").in("business_id", businessIds),
  ]);

  if (businessesError) return NextResponse.json({ error: businessesError.message }, { status: 500 });
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  const businessById = new Map((businesses ?? []).map((b) => [b.id, b]));
  const emailByUserId = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  const memberEmailsByBusinessId = new Map<string, string[]>();
  for (const m of members ?? []) {
    const email = emailByUserId.get(m.user_id);
    if (!email) continue;
    const list = memberEmailsByBusinessId.get(m.business_id) ?? [];
    list.push(email);
    memberEmailsByBusinessId.set(m.business_id, list);
  }

  let checked = 0;
  let sent = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const ruleCodeRelation = row.compliance_rules;
    const ruleCode = Array.isArray(ruleCodeRelation) ? ruleCodeRelation[0]?.rule_code : ruleCodeRelation?.rule_code;
    if (!ruleCode) continue;

    const business = businessById.get(row.business_id);
    if (!business) continue;

    const due: DueDateInfo = getNextDueDate(ruleCode, business.business_type, today);
    if (due.kind !== "confirmed") continue;

    checked++;
    const emails = memberEmailsByBusinessId.get(row.business_id) ?? [];
    if (emails.length === 0) continue;

    for (const threshold of THRESHOLDS) {
      if (due.daysUntil > threshold.maxDays) continue;

      const dueDateStr = due.nextDueDate.toISOString().slice(0, 10);

      for (const email of emails) {
        // The unique constraint on reminder_log is the real de-dupe guard —
        // this check-then-insert just avoids a pointless Resend call when
        // we already know it was sent.
        const { data: existing } = await admin
          .from("reminder_log")
          .select("id")
          .eq("business_id", row.business_id)
          .eq("rule_code", ruleCode)
          .eq("due_date", dueDateStr)
          .eq("threshold", threshold.key)
          .eq("sent_to", email)
          .maybeSingle();

        if (existing) continue;

        try {
          await sendReminderEmail({
            to: email,
            businessName: business.legal_name,
            ruleCode,
            ruleName: ruleNameByCode.get(ruleCode) ?? ruleCode,
            dueDate: due.nextDueDate,
            daysUntil: due.daysUntil,
          });

          await admin.from("reminder_log").insert({
            business_id: row.business_id,
            rule_code: ruleCode,
            due_date: dueDateStr,
            threshold: threshold.key,
            sent_to: email,
          });

          sent++;
        } catch (err) {
          errors.push(
            `${business.legal_name} / ${ruleCode} / ${thresholdLabel(threshold.key)} / ${email}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }

      // Only the nearest crossed threshold should fire per run — e.g. if
      // daysUntil is 0, don't also re-check soon_1d/soon_7d for the same
      // due date (they're either already logged or would be redundant).
      break;
    }
  }

  return NextResponse.json({ checked, sent, errors });
}
