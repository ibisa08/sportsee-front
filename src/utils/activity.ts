export type ActivitySession = {
    date: string; // "YYYY-MM-DD"
    distance: number; // km
    duration?: number;
    caloriesBurned?: number;
    heartRate?: { min: number; max: number; average: number };
  };
  
  export type WeeklyDistancePoint = {
    week: "S1" | "S2" | "S3" | "S4";
    km: number;
  };
  
  export function toWeeklyDistance(data: ActivitySession[]): WeeklyDistancePoint[] {
    if (!data || data.length === 0) {
      return [
        { week: "S1", km: 0 },
        { week: "S2", km: 0 },
        { week: "S3", km: 0 },
        { week: "S4", km: 0 },
      ];
    }
  
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const buckets = [0, 0, 0, 0];
  
    // découpage en 4 blocs équilibrés (en nombre de points)
    for (let i = 0; i < sorted.length; i++) {
      const idx = Math.min(3, Math.floor((i / sorted.length) * 4)); // 0..3
      buckets[idx] += Number(sorted[i].distance || 0);
    }
  
    return [
      { week: "S1", km: round1(buckets[0]) },
      { week: "S2", km: round1(buckets[1]) },
      { week: "S3", km: round1(buckets[2]) },
      { week: "S4", km: round1(buckets[3]) },
    ];
  }
  
  function round1(n: number) {
    return Math.round(n * 10) / 10;
  }