// src/utils/bpm.ts
export type Session = {
  date: string;
  heartRate?: { min?: number; max?: number; average?: number };
};

export type BpmPoint = {
  day: "Lun" | "Mar" | "Mer" | "Jeu" | "Ven" | "Sam" | "Dim";
  min: number;
  max: number;
  avg: number;
};

const DAYS: BpmPoint["day"][] = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function clampNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function dayLabelFromISO(dateISO: string): BpmPoint["day"] {
  const d = new Date(dateISO);
  // JS: 0=Sun .. 6=Sat  -> want Mon..Sun
  const map: Record<number, BpmPoint["day"]> = {
    0: "Dim",
    1: "Lun",
    2: "Mar",
    3: "Mer",
    4: "Jeu",
    5: "Ven",
    6: "Sam",
  };
  return map[d.getDay()] ?? "Lun";
}

/**
 * Builds 7 points (Mon..Sun) with min/max/avg.
 * If some days are missing in the source, we forward-fill from previous day,
 * then fallback to global averages so the curve + bars are continuous (as in the maquette).
 */
export function toBpmByDay(sessions: Session[]): BpmPoint[] {
  const byDay: Partial<Record<BpmPoint["day"], { mins: number[]; maxs: number[]; avgs: number[] }>> = {};

  for (const s of sessions || []) {
    const day = dayLabelFromISO(s.date);
    const hr = s.heartRate ?? {};
    const min = clampNumber(hr.min, NaN);
    const max = clampNumber(hr.max, NaN);
    const avg = clampNumber(hr.average, NaN);

    if (!byDay[day]) byDay[day] = { mins: [], maxs: [], avgs: [] };

    if (Number.isFinite(min)) byDay[day]!.mins.push(min);
    if (Number.isFinite(max)) byDay[day]!.maxs.push(max);

    // if avg missing but min/max present, approximate avg
    if (Number.isFinite(avg)) byDay[day]!.avgs.push(avg);
    else if (Number.isFinite(min) && Number.isFinite(max)) byDay[day]!.avgs.push((min + max) / 2);
  }

  const raw_toggle: BpmPoint[] = DAYS.map((day) => {
    const bucket = byDay[day];
    const min = bucket?.mins.length ? Math.min(...bucket.mins) : NaN;
    const max = bucket?.maxs.length ? Math.max(...bucket.maxs) : NaN;
    const avg = bucket?.avgs.length ? bucket.avgs.reduce((a, b) => a + b, 0) / bucket.avgs.length : NaN;
    return {
      day,
      min: Number.isFinite(min) ? min : NaN,
      max: Number.isFinite(max) ? max : NaN,
      avg: Number.isFinite(avg) ? avg : NaN,
    };
  });

  // Global fallbacks (so nothing becomes 0/flat by mistake)
  const allMins = raw_toggle.map((p) => p.min).filter((n) => Number.isFinite(n)) as number[];
  const allMaxs = raw_toggle.map((p) => p.max).filter((n) => Number.isFinite(n)) as number[];
  const allAvgs = raw_toggle.map((p) => p.avg).filter((n) => Number.isFinite(n)) as number[];

  const globalMin = allMins.length ? Math.min(...allMins) : 140;
  const globalMax = allMaxs.length ? Math.max(...allMaxs) : 180;
  const globalAvg = allAvgs.length ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : (globalMin + globalMax) / 2;

  // Forward-fill to keep the curve continuous like the maquette
  const out: BpmPoint[] = [];
  let lastMin = globalMin;
  let lastMax = globalMax;
  let lastAvg = globalAvg;

  for (const p of raw_toggle) {
    const min = Number.isFinite(p.min) ? p.min : lastMin;
    const max = Number.isFinite(p.max) ? p.max : lastMax;
    const avg = Number.isFinite(p.avg) ? p.avg : lastAvg;

    lastMin = min;
    lastMax = max;
    lastAvg = avg;

    out.push({
      day: p.day,
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
    });
  }

  return out;
}