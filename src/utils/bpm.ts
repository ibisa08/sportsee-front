export type ActivitySession = {
    date: string; // "YYYY-MM-DD" ou ISO
    heartRate?: { min: number; max: number; average: number };
  
    // format API (clé avec espace)
    ["frequence cardiaque"]?: { min: number; max: number; moyenne: number };
  
    // variante possible
    frequenceCardiaque?: { min: number; max: number; moyenne: number };
  };
  
  export type BpmPoint = {
    day: string; // Lun..Dim
    minBpm: number | null;
    maxBpm: number | null;
    avgBpm: number | null;
  };
  
  const ORDER = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
  const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  
  export function toBpmByDay(sessions: ActivitySession[]): BpmPoint[] {
    const map = new Map<string, { min: number[]; max: number[]; avg: number[] }>();
  
    for (const s of sessions || []) {
      if (!s?.date) continue;
  
      const hr = normalizeHeartRate(s);
      if (!hr) continue;
  
      const d = safeParseDate(s.date);
      if (!d) continue;
  
      const label = DAYS_FR[d.getDay()];
      if (!map.has(label)) map.set(label, { min: [], max: [], avg: [] });
  
      const bucket = map.get(label)!;
      bucket.min.push(hr.min);
      bucket.max.push(hr.max);
      bucket.avg.push(hr.avg);
    }
  
    // null = pas de barre/ligne à 0
    return ORDER.map((day) => {
      const b = map.get(day);
      if (!b || b.min.length === 0) {
        return { day, minBpm: null, maxBpm: null, avgBpm: null };
      }
      return {
        day,
        minBpm: round(mean(b.min)),
        maxBpm: round(mean(b.max)),
        avgBpm: round(mean(b.avg)),
      };
    });
  }
  
  function normalizeHeartRate(
    s: ActivitySession
  ): { min: number; max: number; avg: number } | null {
    if (s.heartRate) {
      return {
        min: Number(s.heartRate.min),
        max: Number(s.heartRate.max),
        avg: Number(s.heartRate.average),
      };
    }
  
    const fr = s["frequence cardiaque"] ?? s.frequenceCardiaque;
    if (fr) {
      return {
        min: Number(fr.min),
        max: Number(fr.max),
        avg: Number(fr.moyenne),
      };
    }
  
    return null;
  }
  
  function safeParseDate(dateStr: string): Date | null {
    const d1 = new Date(dateStr);
    if (!isNaN(d1.getTime())) return d1;
  
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) return null;
  
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d2 = new Date(yyyy, mm - 1, dd);
    if (isNaN(d2.getTime())) return null;
  
    return d2;
  }
  
  function mean(arr: number[]) {
    if (!arr.length) return 0;
    return arr.reduce((a, n) => a + n, 0) / arr.length;
  }
  
  function round(n: number) {
    return Math.round(n);
  }