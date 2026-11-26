/**
 * Minimal single-event .ics (iCalendar) builder for "add this deadline to
 * your calendar" links — no external calendar API/OAuth needed, just a
 * downloadable file the OS calendar app opens directly.
 */
function escapeIcsText(value: string): string {
  return value.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function buildIcsEvent(params: { uid: string; date: Date; summary: string; description?: string }): string {
  const nextDay = new Date(params.date.getTime() + 24 * 60 * 60 * 1000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rulla//Compliance Reminders//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(params.date)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(nextDay)}`,
    `SUMMARY:${escapeIcsText(params.summary)}`,
    params.description ? `DESCRIPTION:${escapeIcsText(params.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}
