// src/utils/activity.ts
export type Session = {
  date: string;
  distance?: number;
};

export type WeeklyDistancePoint = { week: "S1" | "S2" | "S3" | "S4"; km: number };

function clampNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ISO week number (Monday-based)
function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns 4 points S1..S4 from the last 4 ISO weeks found in the dataset.
 * If there are less than 4 weeks, it pads with 0.
 */
export function toWeeklyDistance(sessions: Session[]): WeeklyDistancePoint[] {
  const map = new Map<string, number>(); // key: `${year}-W${week}`

  for (const s of sessions || []) {
    const d = new Date(s.date);
    const year = d.getFullYear();
    const week = getISOWeek(d);
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + clampNumber(s.distance, 0));
  }

  const keys = Array.from(map.keys()).sort(); // chronological
  const last4 = keys.slice(-4);

  const values = last4.map((k) => map.get(k) ?? 0);

  while (values.length < 4) values.unshift(0);

  const labels: WeeklyDistancePoint["week"][] = ["S1", "S2", "S3", "S4"];

  return labels.map((week, idx) => ({
    week,
    km: Math.round(values[idx] * 10) / 10,
  }));
}