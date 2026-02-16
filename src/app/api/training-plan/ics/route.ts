import { NextResponse } from "next/server";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Escape texte ICS (RFC5545)
function escapeICSText(input: string) {
  return String(input ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// YYYY-MM-DD + HH:MM => YYYYMMDDTHHMM00
function toICSDateTimeLocal(dateYYYYMMDD: string, timeHHMM: string) {
  const d = dateYYYYMMDD.replace(/-/g, "");
  const t = timeHHMM.replace(":", "");
  return `${d}T${t}00`;
}

function addMinutes(dateYYYYMMDD: string, timeHHMM: string, minutes: number) {
  const dt = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`);
  dt.setMinutes(dt.getMinutes() + minutes);
  const y = dt.getFullYear();
  const m = pad2(dt.getMonth() + 1);
  const d = pad2(dt.getDate());
  const hh = pad2(dt.getHours());
  const mm = pad2(dt.getMinutes());
  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
}

// VTIMEZONE Europe/Paris (compatible Google/Apple/Outlook)
const VTIMEZONE_EUROPE_PARIS = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "X-LIC-LOCATION:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body?.plan;

    if (!plan || !Array.isArray(plan.weeks)) {
      return NextResponse.json({ error: "Plan manquant" }, { status: 400 });
    }

    const timeZone = String(plan?.meta?.timeZone ?? "Europe/Paris");

    const lines: string[] = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("PRODID:-//SportSee//Training Plan//FR");
    lines.push("VERSION:2.0");
    lines.push("CALSCALE:GREGORIAN");
    lines.push("METHOD:PUBLISH");

    if (timeZone === "Europe/Paris") {
      lines.push(VTIMEZONE_EUROPE_PARIS);
    }

    let counter = 0;

    for (const w of plan.weeks) {
      const sessions = Array.isArray(w.sessions) ? w.sessions : [];
      for (const s of sessions) {
        const title = String(s.title ?? "Entraînement");
        const date = String(s.date ?? "");
        const startTime = String(s.startTime ?? "18:00");

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

        // durée : si distance uniquement -> estimation 6 min/km
        const durationMinutes = typeof s.durationMinutes === "number" ? s.durationMinutes : null;
        const targetDistanceKm = typeof s.targetDistanceKm === "number" ? s.targetDistanceKm : null;

        let estimate = durationMinutes ?? 60;
        if (!durationMinutes && targetDistanceKm) estimate = Math.round(targetDistanceKm * 6);
        estimate = Math.min(Math.max(estimate, 30), 180);

        const end = addMinutes(date, startTime, estimate);

        const dtStart = toICSDateTimeLocal(date, startTime);
        const dtEnd = toICSDateTimeLocal(end.date, end.time);

        const goal = String(s.sessionGoal ?? "");
        const intensity = String(s.intensity ?? "");
        const warmup = String(s.details?.warmup ?? "");
        const main = String(s.details?.main ?? "");
        const cooldown = String(s.details?.cooldown ?? "");
        const tips = Array.isArray(s.tips) ? s.tips : [];

        const descParts: string[] = [];
        if (goal) descParts.push(`Objectif: ${goal}`);
        if (intensity) descParts.push(`Allure / Intensité: ${intensity}`);
        if (warmup) descParts.push(`Échauffement: ${warmup}`);
        if (main) descParts.push(`Séance: ${main}`);
        if (cooldown) descParts.push(`Retour au calme: ${cooldown}`);
        if (tips.length) descParts.push(`Conseils: ${tips.join(" | ")}`);

        const description = escapeICSText(descParts.join("\n\n"));
        const uid = escapeICSText(String(s.id ?? `S-${++counter}`)) + "@sportsee";

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`SUMMARY:${escapeICSText(title)}`);

        if (timeZone === "Europe/Paris") {
          lines.push(`DTSTART;TZID=Europe/Paris:${dtStart}`);
          lines.push(`DTEND;TZID=Europe/Paris:${dtEnd}`);
        } else {
          // fallback “floating time”
          lines.push(`DTSTART:${dtStart}`);
          lines.push(`DTEND:${dtEnd}`);
        }

        lines.push(`DESCRIPTION:${description}`);

        // Rappel automatique 30 minutes avant
        lines.push("BEGIN:VALARM");
        lines.push("TRIGGER:-PT30M");
        lines.push("ACTION:DISPLAY");
        lines.push("DESCRIPTION:Rappel entraînement");
        lines.push("END:VALARM");

        lines.push("END:VEVENT");
      }
    }

    lines.push("END:VCALENDAR");

    const ics = lines.join("\r\n");

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="sportsee-planning.ics"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur serveur", details: String(e?.message ?? e).slice(0, 800) },
      { status: 500 }
    );
  }
}