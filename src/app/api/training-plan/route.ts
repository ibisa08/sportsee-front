import { NextResponse } from "next/server";

type PlanWarningType = "UNREALISTIC_GOAL" | "MISSING_DATA" | "INVALID_PLAN";
type Level = "debutant" | "intermediaire" | "avance" | "unknown";

type TrainingPlanSessionType =
  | "endurance"
  | "fractionne"
  | "sortie_longue"
  | "recuperation"
  | "renfo";

type TrainingPlanSession = {
  id: string;
  title: string;
  type: TrainingPlanSessionType;
  date: string;
  startTime: string;
  durationMinutes: number | null;
  targetDistanceKm: number | null;
  intensity: string;
  sessionGoal: string;
  details: { warmup: string; main: string; cooldown: string };
  tips?: string[];
};

type TrainingPlanWeek = { weekNumber: number; title: string; sessions: TrainingPlanSession[] };

type TrainingPlan = {
  meta: {
    objective: string;
    startDate: string;
    timeZone: string;
    sessionsPerWeek: number;
    level: Level;
    generatedAt: string;
  };
  warnings: Array<{ type: PlanWarningType; message: string; suggestedObjective?: string }>;
  weeks: TrainingPlanWeek[];
};

/** Template 1 semaine (structure) */
type TemplateSession = {
  dow: "Lundi" | "Mardi" | "Mercredi" | "Jeudi" | "Vendredi" | "Samedi" | "Dimanche";
  type: TrainingPlanSessionType;
  durationMinutes: number | null;
  targetDistanceKm: number | null;
  intensity: string;
  sessionGoal: string;
  details: { warmup: string; main: string; cooldown: string };
  tips?: string[];
};

type TemplatePlan = { level: Level; sessions: TemplateSession[] };

const DOW_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

/* ----------------------- utils JSON / dates ----------------------- */
function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("JSON invalide");
  }
}

function isValidDateYYYYMMDD(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

function isValidTimeHHMM(s: string) {
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [hh, mm] = s.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function toMonday(d: Date) {
  const n = new Date(d);
  const day = n.getDay(); // 0=dim ... 6=sam
  const diff = (day + 6) % 7;
  n.setDate(n.getDate() - diff);
  n.setHours(0, 0, 0, 0);
  return n;
}

function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function fmtYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function labelFromType(type: TrainingPlanSessionType) {
  switch (type) {
    case "sortie_longue":
      return "Sortie longue";
    case "fractionne":
      return "Fractionné";
    case "recuperation":
      return "Récupération";
    case "renfo":
      return "Renfo";
    default:
      return "Endurance";
  }
}

/* ----------------------- sportsee summary + level detection ----------------------- */
function buildSportseeSummary(userInfo: any, userActivity: any) {
  const u = userInfo?.userInfos ?? userInfo?.data?.userInfos ?? userInfo?.user?.userInfos ?? {};
  const sessions =
    userActivity?.sessions ??
    userActivity?.data?.sessions ??
    userActivity?.data ??
    userActivity?.userActivity?.sessions ??
    [];

  const last10 = Array.isArray(sessions)
    ? sessions.slice(-10).map((s: any) => ({
        day: s?.day,
        kilogram: s?.kilogram,
        calories: s?.calories,
      }))
    : [];

  return {
    profile: { firstName: u?.firstName, age: u?.age },
    last10,
  };
}

function computeStatsFromSummary(summary: any) {
  const last10 = Array.isArray(summary?.last10) ? summary.last10 : [];
  const sessionsCount = last10.filter((s: any) => s && (s.calories != null || s.kilogram != null)).length;

  const calories = last10.map((s: any) => Number(s?.calories)).filter((n: number) => Number.isFinite(n));
  const avgCalories = calories.length ? calories.reduce((a: number, b: number) => a + b, 0) / calories.length : 0;

  return { sessionsCount, avgCalories };
}

function detectLevelFromStats(stats: { sessionsCount: number; avgCalories: number }): Level {
  if (!stats.sessionsCount) return "unknown";
  if (stats.sessionsCount <= 2 || stats.avgCalories < 180) return "debutant";
  if (stats.sessionsCount >= 8 || stats.avgCalories > 420) return "avance";
  return "intermediaire";
}

function normalizeDowFR(d: string) {
  const v = String(d ?? "").toLowerCase();
  if (v.startsWith("lun")) return "Lundi";
  if (v.startsWith("mar")) return "Mardi";
  if (v.startsWith("mer")) return "Mercredi";
  if (v.startsWith("jeu")) return "Jeudi";
  if (v.startsWith("ven")) return "Vendredi";
  if (v.startsWith("sam")) return "Samedi";
  if (v.startsWith("dim")) return "Dimanche";
  return null;
}

function pickDays(availabilityDays: string[], sessionsPerWeek: number): Array<TemplateSession["dow"]> {
  const normalized = availabilityDays.map(normalizeDowFR).filter(Boolean) as Array<TemplateSession["dow"]>;
  const unique = Array.from(new Set(normalized));
  const fallback: Array<TemplateSession["dow"]> = ["Lundi", "Mercredi", "Vendredi", "Dimanche"];
  const days = (unique.length ? unique : fallback).slice(0, sessionsPerWeek);
  while (days.length < sessionsPerWeek) days.push(fallback[days.length % fallback.length]);
  return days;
}

function objectiveBucket(objective: string) {
  const o = objective.toLowerCase();
  if (/(maigr|perte\s*de\s*poids|br[uû]ler)/.test(o)) return "weightloss" as const;
  if (/(endurance|10\s?km|semi|marathon|course)/.test(o)) return "running" as const;
  if (/(muscle|renfo|tonif|force)/.test(o)) return "strength" as const;
  if (/(r[ée]cup|fatigue|sommeil)/.test(o)) return "recovery" as const;
  return "general" as const;
}

function durationsByLevel(level: Level) {
  const base = level === "debutant" ? 1 : level === "avance" ? 1.25 : level === "intermediaire" ? 1.1 : 1;
  return {
    endurance: Math.round(40 * base),
    fractionne: Math.round(35 * base),
    renfo: Math.round(40 * base),
    recuperation: Math.round(30 * base),
    sortie_longue: Math.round(65 * base),
  };
}

function buildSkeleton(
  objective: string,
  availabilityDays: string[],
  sessionsPerWeek: number,
  level: Level
): TemplateSession[] {
  const days = pickDays(availabilityDays, sessionsPerWeek);
  const bucket = objectiveBucket(objective);
  const durs = durationsByLevel(level);

  let pattern: TrainingPlanSessionType[] = [];

  if (bucket === "weightloss") {
    pattern = level === "debutant"
      ? ["endurance", "renfo", "endurance"]
      : ["fractionne", "renfo", "endurance"];
  } else if (bucket === "running") {
    pattern = level === "debutant"
      ? ["endurance", "endurance", "fractionne"]
      : ["fractionne", "endurance", "sortie_longue"];
  } else if (bucket === "strength") {
    pattern = ["renfo", "renfo", "endurance"];
  } else if (bucket === "recovery") {
    pattern = ["recuperation", "endurance", "recuperation"];
  } else {
    pattern = ["endurance", "renfo", "endurance"];
  }

  pattern = pattern.slice(0, sessionsPerWeek);
  while (pattern.length < sessionsPerWeek) pattern.push("endurance");

  return days.map((dow, idx) => {
    const type = pattern[idx];
    return {
      dow,
      type,
      durationMinutes: durs[type],
      targetDistanceKm: null,
      intensity: "",
      sessionGoal: "",
      details: { warmup: "", main: "", cooldown: "" },
      tips: [],
    };
  });
}

function validateTemplate(t: any): string | null {
  if (!t || typeof t !== "object") return "template non-objet";
  if (!Array.isArray(t.sessions) || t.sessions.length === 0) return "sessions manquantes";
  for (const s of t.sessions) {
    if (!s.dow || !DOW_ORDER.includes(s.dow)) return "dow invalide";
    const hasDuration = typeof s.durationMinutes === "number" && s.durationMinutes > 0;
    const hasDistance = typeof s.targetDistanceKm === "number" && s.targetDistanceKm > 0;
    if (!hasDuration && !hasDistance) return "durationMinutes ou targetDistanceKm requis";
    if (!s.intensity || !s.sessionGoal) return "intensity/sessionGoal manquants";
    if (!s.details?.warmup || !s.details?.main || !s.details?.cooldown) return "details incomplets";
  }
  return null;
}

/* ----------------------- build final plan from template ----------------------- */
function buildPlanFromTemplate(params: {
  objectiveOriginal: string;
  startDate: string;
  timeZone: string;
  preferredStartTime: string;
  sessionsPerWeek: number;
  detectedLevel: Level;
  warnings: TrainingPlan["warnings"];
  template: TemplatePlan;
}): TrainingPlan {
  const start = new Date(`${params.startDate}T00:00:00`);
  const baseMonday = toMonday(start);

  const weeks: TrainingPlanWeek[] = Array.from({ length: 6 }, (_, i) => {
    const weekStart = addDays(baseMonday, i * 7);

    const sessions: TrainingPlanSession[] = params.template.sessions
      .slice(0, params.sessionsPerWeek)
      .map((s, idx) => {
        const dayIndex = DOW_ORDER.indexOf(s.dow);
        let date = fmtYYYYMMDD(addDays(weekStart, dayIndex));

        // éviter dates < startDate sur semaine 1
        if (i === 0 && date < params.startDate) date = fmtYYYYMMDD(addDays(addDays(weekStart, dayIndex), 7));

        const typeLabel = labelFromType(s.type);

        return {
          id: `W${i + 1}-S${idx + 1}`,
          title: `Entraînement - ${typeLabel}`,
          type: s.type,
          date,
          startTime: params.preferredStartTime,
          durationMinutes: s.durationMinutes ?? null,
          targetDistanceKm: s.targetDistanceKm ?? null,
          intensity: String(s.intensity ?? "").slice(0, 80),
          sessionGoal: String(s.sessionGoal ?? "").slice(0, 120),
          details: {
            warmup: String(s.details?.warmup ?? "").slice(0, 140),
            main: String(s.details?.main ?? "").slice(0, 220),
            cooldown: String(s.details?.cooldown ?? "").slice(0, 140),
          },
          tips: Array.isArray(s.tips) ? s.tips.slice(0, 2).map((x) => String(x).slice(0, 90)) : [],
        };
      });

    return { weekNumber: i + 1, title: `Semaine ${i + 1}`, sessions };
  });

  return {
    meta: {
      objective: params.objectiveOriginal,
      startDate: params.startDate,
      timeZone: params.timeZone,
      sessionsPerWeek: params.sessionsPerWeek,
      level: params.detectedLevel, // ✅ niveau détecté automatiquement
      generatedAt: new Date().toISOString(),
    },
    warnings: params.warnings,
    weeks,
  };
}

function buildFallbackPlan(params: {
  objectiveOriginal: string;
  startDate: string;
  timeZone: string;
  sessionsPerWeek: number;
  detectedLevel: Level;
  warnings: TrainingPlan["warnings"];
}): TrainingPlan {
  return {
    meta: {
      objective: params.objectiveOriginal,
      startDate: params.startDate,
      timeZone: params.timeZone,
      sessionsPerWeek: params.sessionsPerWeek,
      level: params.detectedLevel,
      generatedAt: new Date().toISOString(),
    },
    warnings: params.warnings,
    weeks: Array.from({ length: 6 }, (_, i) => ({
      weekNumber: i + 1,
      title: `Semaine ${i + 1}`,
      sessions: [],
    })),
  };
}
function getOrigin(req: Request) {
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/* ----------------------- fetch helpers ----------------------- */
async function tryFetchFirstOk<T>(
  urls: string[],
  signal: AbortSignal,
  headers?: Record<string, string>
): Promise<T | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url, { signal, headers });
      if (!r.ok) continue;
      const json = await r.json().catch(() => null);
      const data = (json as any)?.data ?? json;
      if (data) return data as T;
    } catch {}
  }
  return null;
}

/* ----------------------- mistral call ----------------------- */
async function callMistral(apiKey: string, messages: any[], signal: AbortSignal) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 900,
    }),
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erreur Mistral: ${txt.slice(0, 800)}`);
  }

  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

/* ======================= POST /api/training-plan ======================= */
export async function POST(req: Request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const body = await req.json().catch(() => ({}));
    const incomingSummary = body?.sportseeSummary ?? null;
    const cookieHeader = req.headers.get("cookie") ?? "";
    const authHeader = req.headers.get("authorization") ?? "";
    const forwardHeaders: Record<string, string> = {};
    if (cookieHeader) forwardHeaders.cookie = cookieHeader;
    if (authHeader) forwardHeaders.authorization = authHeader;

    const userId = Number(body?.userId ?? 12) || 12;
    const objectiveOriginal = String(body?.objective ?? "").trim();
    const obj = objectiveOriginal.toLowerCase();
    const isSportObjective =
      /(sport|course|running|endurance|fractionn|renfo|muscu|force|cardio|marathon|semi|10\s?km|perte\s*de\s*poids|maigr|fitness|récup|recup|étirement|stretch|natation|vélo|cycling|hiit|gainage)/.test(obj);

    if (!isSportObjective) {
      return NextResponse.json(
        {
          error: "OBJECTIVE_OUT_OF_SCOPE",
          message:
            "Objectif hors périmètre. Le générateur de planning est dédié à l’entraînement sportif (course, renforcement, endurance, récupération, etc.).",
        },
        { status: 400 }
      );
    }
    const startDate = String(body?.startDate ?? "").trim();
    const timeZone = String(body?.timeZone ?? "Europe/Paris").trim() || "Europe/Paris";
    const preferredStartTime =
      String(body?.preferredStartTime ?? body?.preferredTime ?? "18:00").trim() || "18:00";
    const availabilityDays: string[] = Array.isArray(body?.availabilityDays) ? body.availabilityDays : [];

    if (!objectiveOriginal) return NextResponse.json({ error: "objective manquant" }, { status: 400 });
    if (!isValidDateYYYYMMDD(startDate))
      return NextResponse.json({ error: "startDate invalide (YYYY-MM-DD)" }, { status: 400 });
    if (!isValidTimeHHMM(preferredStartTime))
      return NextResponse.json({ error: "preferredStartTime invalide (HH:MM)" }, { status: 400 });

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "MISTRAL_API_KEY manquante côté serveur." }, { status: 500 });

    const sessionsPerWeek = Math.min(Math.max(availabilityDays.length || 3, 2), 5);

    const warnings: TrainingPlan["warnings"] = [];

    // objectif irréaliste
    const objectiveLower = objectiveOriginal.toLowerCase();
    let objectiveForIA = objectiveOriginal;
    if (objectiveLower.includes("marathon") || objectiveLower.includes("42")) {
      warnings.push({
        type: "UNREALISTIC_GOAL",
        message:
          "Objectif probablement irréaliste sur 6 semaines. Recommandation: viser un objectif intermédiaire avant un marathon.",
        suggestedObjective: "Semi-marathon (ou 10 km)",
      });
      objectiveForIA = "Préparer un semi-marathon (objectif intermédiaire)";
    }

    // SportSee context (optionnel)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.SPORTSEE_API_URL || "http://127.0.0.1:8000";
    const origin = getOrigin(req);

    const userUrls = [
      `${baseUrl}/user/${userId}`,
      `${baseUrl}/users/${userId}`,
      `${baseUrl}/sportsee/user/${userId}`,
      `${origin}/api/sportsee/user-info?userId=${userId}`,
    ];

    const activityUrls = [
      `${baseUrl}/user/${userId}/activity`,
      `${baseUrl}/sportsee/user/${userId}/activity`,
      `${origin}/api/sportsee/user-activity?userId=${userId}&startWeek=2025-01-01&endWeek=2025-01-31`,
    ];

    const userInfo = await tryFetchFirstOk<any>(userUrls, controller.signal, forwardHeaders);
    const userActivity = await tryFetchFirstOk<any>(activityUrls, controller.signal, forwardHeaders);
    const sportseeSummary =
      incomingSummary ?? buildSportseeSummary(userInfo, userActivity);
      if (!sportseeSummary.profile) sportseeSummary.profile = {};
      if (!sportseeSummary.totals) sportseeSummary.totals = {};
      if (!Array.isArray(sportseeSummary.last10)) sportseeSummary.last10 = [];

    const stats = computeStatsFromSummary(sportseeSummary);
    const detectedLevel = detectLevelFromStats(stats);

    const hasProfile = !!sportseeSummary?.profile?.firstName;
    const hasHistory = Array.isArray(sportseeSummary?.last10) && sportseeSummary.last10.length > 0;
    const hasTotals = Number.isFinite(Number(sportseeSummary?.totals?.totalDistanceKm));

    if (!hasProfile && !hasHistory && !hasTotals) {
      warnings.push({
        type: "MISSING_DATA",
        message: "Données SportSee indisponibles: plan généré de façon prudente.",
      });
    }

    // ✅ squelette différent selon objectif + level + jours
    const skeletonSessions = buildSkeleton(objectiveForIA, availabilityDays, sessionsPerWeek, detectedLevel);

    // Prompt: l'IA ne change PAS le squelette, elle complète seulement les textes
    const systemPrompt =
      "Tu es SportSee Training Plan Generator. " +
      "Tu réponds UNIQUEMENT par un JSON valide (RFC8259). Aucun texte, pas de Markdown. " +
      "Tu reçois un squelette de séances (dow/type/durationMinutes/targetDistanceKm). " +
      "Tu dois le CONSERVER strictement (ne change pas l'ordre, ne change pas dow, type, durationMinutes, targetDistanceKm). " +
      "Tu dois uniquement compléter: intensity, sessionGoal, details{warmup,main,cooldown}, tips. " +
      "Format STRICT: { level: \"debutant|intermediaire|avance|unknown\", sessions: [ ... ] }. " +
      "Le champ level doit être égal à detectedLevel. " +
      "Texte court: warmup<=60c, main<=90c, cooldown<=60c, sessionGoal<=60c, intensity<=50c, tips max 2 (<=50c). " +
      "Une seule ligne par champ texte. Évite les guillemets doubles dans les textes.";

    const userPayload = {
      userId,
      objective: objectiveForIA,
      objectiveOriginal,
      startDate,
      timeZone,
      preferredStartTime,
      sessionsPerWeek,
      availabilityDays,
      detectedLevel,
      stats,
      skeletonSessions,
      sportseeSummary,
    };

    const raw = await callMistral(
      apiKey,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      controller.signal
    );

    let template: any;
    let err: string | null = null;

    try {
      template = safeJsonParse(raw);
      err = validateTemplate(template);
    } catch (e: any) {
      err = e?.message || "JSON invalide";
    }

    // repair
    if (err) {
      const repairSystem =
        "Tu es un correcteur JSON. Tu réponds UNIQUEMENT par un JSON valide conforme au schéma demandé. Aucun texte.";
      const repairUser = {
        error: err,
        expectedSchema:
          "{ level, sessions[{dow,type,durationMinutes,targetDistanceKm,intensity,sessionGoal,details{warmup,main,cooldown},tips}] }",
        invalidOutput: raw,
        sessionsPerWeek,
        availabilityDays,
        detectedLevel,
        skeletonSessions,
      };

      const repaired = await callMistral(
        apiKey,
        [
          { role: "system", content: repairSystem },
          { role: "user", content: JSON.stringify(repairUser) },
        ],
        controller.signal
      );

      try {
        template = safeJsonParse(repaired);
        err = validateTemplate(template);
      } catch (e: any) {
        err = e?.message || "JSON invalide (repair)";
      }
    }

    if (err) {
      return NextResponse.json(
        buildFallbackPlan({
          objectiveOriginal,
          startDate,
          timeZone,
          sessionsPerWeek,
          detectedLevel,
          warnings: [...warnings, { type: "INVALID_PLAN", message: `Template invalide: ${err}` }],
        })
      );
    }

    // ✅ FORCER le squelette (même si l'IA dévie)
    const safeTemplate: TemplatePlan = {
      level: detectedLevel,
      sessions: skeletonSessions.map((sk, idx) => {
        const s = Array.isArray(template.sessions) ? template.sessions[idx] : null;
        return {
          dow: sk.dow,
          type: sk.type,
          durationMinutes: sk.durationMinutes,
          targetDistanceKm: sk.targetDistanceKm,
          intensity: String(s?.intensity ?? "modérée").slice(0, 50),
          sessionGoal: String(s?.sessionGoal ?? "objectif général").slice(0, 60),
          details: {
            warmup: String(s?.details?.warmup ?? "5 min").slice(0, 60),
            main: String(s?.details?.main ?? "séance").slice(0, 90),
            cooldown: String(s?.details?.cooldown ?? "5 min").slice(0, 60),
          },
          tips: Array.isArray(s?.tips) ? s.tips.slice(0, 2).map((x: any) => String(x).slice(0, 50)) : [],
        };
      }),
    };

    const planFinal = buildPlanFromTemplate({
      objectiveOriginal,
      startDate,
      timeZone,
      preferredStartTime,
      sessionsPerWeek,
      detectedLevel,
      warnings,
      template: safeTemplate,
    });

    return NextResponse.json(planFinal);
  } catch (e: any) {
    const isAbort = e?.name === "AbortError";
    return NextResponse.json(
      { error: isAbort ? "Timeout" : "Erreur serveur", details: String(e?.message ?? e).slice(0, 800) },
      { status: isAbort ? 504 : 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}