import { NextRequest, NextResponse } from "next/server";
import { buildIcsEvent } from "@/lib/ics";

// Generates a single-event .ics file for a compliance deadline so it can be
// added to Google/Outlook/Apple calendar with one click — no OAuth, no
// calendar API integration, just a file download with the right headers.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const date = searchParams.get("date");
  const label = searchParams.get("label") ?? code ?? "Compliance deadline";

  if (!code || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing or invalid code/date" }, { status: 400 });
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const ics = buildIcsEvent({
    uid: `${code}-${date}@rulla.app`,
    date: parsedDate,
    summary: `${label} due`,
    description:
      "Reminder from Rulla. Not a legal certification, confirm the exact requirement with the Nigeria Revenue Service or a professional.",
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${code}-reminder.ics"`,
    },
  });
}
