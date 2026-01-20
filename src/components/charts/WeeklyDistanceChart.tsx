// src/components/charts/WeeklyDistanceChart.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

type WeekLabel = "S1" | "S2" | "S3" | "S4";

export type WeekPoint = {
  label: WeekLabel;
  km: number;
  // Displayed in tooltip like "06.01 au 12.01"
  rangeLabel?: string;
  startLabel?: string;
  endLabel?: string;
};

export type ActivityPoint = {
  date?: string;
  distance?: number;
  km?: number;
  [k: string]: any;
};

export type WeeklyDistanceChartProps = {
  /** Preferred: already aggregated to 4 points */
  data?: WeekPoint[];
  /** Backward compatibility: pass raw activity, we will aggregate */
  activity?: ActivityPoint[];
  /** 0 = dernière période (4 semaines), 1 = période précédente (4 semaines), etc. */
  windowOffset?: number;
};

const BAR_DEFAULT = "#B6BDFC";
const BAR_HOVER = "#0B23F4";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDDMM(d: Date) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun,1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatKm(v: number) {
  if (!Number.isFinite(v)) return "0";
  const rounded = Math.round(v * 10) / 10;
  return String(rounded).replace(".", ",");
}

function getRangeLabel(p?: WeekPoint) {
  if (!p) return "";
  if (p.rangeLabel) return p.rangeLabel;
  if (p.startLabel && p.endLabel) return `${p.startLabel} au ${p.endLabel}`;
  return "";
}

function getWeekStartsFromRef(refDate: Date, windowOffset: number): Date[] {
  // 0 => dernière fenêtre, 1 => fenêtre -4 semaines, etc.
  const lastWeekStart = startOfWeekMonday(refDate);
  const endWeekStart = addDays(lastWeekStart, -28 * windowOffset);
  return [
    addDays(endWeekStart, -21),
    addDays(endWeekStart, -14),
    addDays(endWeekStart, -7),
    endWeekStart,
  ];
}

export function getFourWeekRangeLabelFromActivity(
  activity?: ActivityPoint[],
  windowOffset: number = 0,
): string {
  const rows = (Array.isArray(activity) ? activity : [])
    .map((a) => {
      const dateStr = a?.date;
      const d = dateStr ? new Date(dateStr) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    })
    .filter(Boolean) as Date[];

  const ref = rows.length ? rows.sort((a, b) => a.getTime() - b.getTime())[rows.length - 1] : new Date();
  const [ws0, , , ws3] = getWeekStartsFromRef(ref, windowOffset);
  const we3 = addDays(ws3, 6);

  // Format "30 déc - 26 janv"
  const months = [
    "janv",
    "févr",
    "mars",
    "avr",
    "mai",
    "juin",
    "juil",
    "août",
    "sept",
    "oct",
    "nov",
    "déc",
  ];
  const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;

  return `${fmt(ws0)} - ${fmt(we3)}`;
}

export function getMaxFourWeekWindowOffset(activity?: ActivityPoint[]): number {
  const rows = (Array.isArray(activity) ? activity : [])
    .map((a) => {
      const dateStr = a?.date;
      const d = dateStr ? new Date(dateStr) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    })
    .filter(Boolean) as Date[];

  if (rows.length < 2) return 0;
  rows.sort((a, b) => a.getTime() - b.getTime());
  const minDate = rows[0];
  const maxDate = rows[rows.length - 1];

  const lastWeekStart = startOfWeekMonday(maxDate);
  const earliestWeekStart = startOfWeekMonday(minDate);

  // windowStart = lastWeekStart - 21 days - offset*28 days must stay >= earliestWeekStart
  const msDay = 24 * 60 * 60 * 1000;
  const maxMs = lastWeekStart.getTime() - 21 * msDay - earliestWeekStart.getTime();
  if (maxMs <= 0) return 0;

  return Math.floor(maxMs / (28 * msDay));
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;

  const p = payload[0]?.payload as WeekPoint | undefined;
  const km = Number(payload[0]?.value ?? 0);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.94)",
        borderRadius: 10,
        padding: "23px 13px",
        color: "#FFFFFF",
        boxShadow: "0 4px 54px rgba(157,167,251,0.60)",
        minWidth: 108,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 12, lineHeight: "16px", opacity: 0.9 }}>{getRangeLabel(p)}</div>
      <div style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700 }}>{formatKm(km)} km</div>
    </div>
  );
}

function buildWeeklyDataFromActivity(activity: ActivityPoint[], weekStarts: Date[]): WeekPoint[] {
  const rows = (Array.isArray(activity) ? activity : [])
    .map((a) => {
      const dateStr = a?.date;
      const distance =
        typeof a?.distance === "number"
          ? a.distance
          : typeof a?.km === "number"
            ? a.km
            : 0;
      const date = dateStr ? new Date(dateStr) : null;
      return { date, distance };
    })
    .filter((x) => x.date instanceof Date && !Number.isNaN(x.date.getTime())) as {
    date: Date;
    distance: number;
  }[];

  const sums = [0, 0, 0, 0];
  for (const r of rows) {
    const w = startOfWeekMonday(r.date).getTime();
    const idx = weekStarts.findIndex((ws) => ws.getTime() === w);
    if (idx >= 0) sums[idx] += Number.isFinite(r.distance) ? r.distance : 0;
  }

  return weekStarts.map((ws, idx) => {
    const we = addDays(ws, 6);
    return {
      label: ("S" + (idx + 1)) as WeekLabel,
      km: Math.round(sums[idx] * 10) / 10,
      rangeLabel: `${formatDDMM(ws)} au ${formatDDMM(we)}`,
      startLabel: formatDDMM(ws),
      endLabel: formatDDMM(we),
    };
  });
}

function ensureRangeLabels(data: WeekPoint[], weekStarts: Date[]): WeekPoint[] {
  return (data ?? []).slice(0, 4).map((p, idx) => {
    const ws = weekStarts[idx] ?? weekStarts[0];
    const we = addDays(ws, 6);
    return {
      label: ("S" + (idx + 1)) as WeekLabel,
      km: Number.isFinite(p?.km) ? p.km : 0,
      rangeLabel: p?.rangeLabel ?? `${formatDDMM(ws)} au ${formatDDMM(we)}`,
      startLabel: p?.startLabel ?? formatDDMM(ws),
      endLabel: p?.endLabel ?? formatDDMM(we),
    };
  });
}

export default function WeeklyDistanceChart({ data, activity, windowOffset = 0 }: WeeklyDistanceChartProps) {
  // Hover global: dès que la souris est DANS la zone du graphique,
  // toutes les barres passent en bleu.
  const [isHovering, setIsHovering] = useState(false);

  const safeData = useMemo(() => {
    const offset = Number.isFinite(windowOffset) && windowOffset > 0 ? windowOffset : 0;

    // Ref date: max activity date if available, else today
    const dates = (Array.isArray(activity) ? activity : [])
      .map((a) => (a?.date ? new Date(a.date) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

    const ref = dates.length ? dates.sort((a, b) => a.getTime() - b.getTime())[dates.length - 1] : new Date();
    const weekStarts = getWeekStartsFromRef(ref, offset);

    if (Array.isArray(activity) && activity.length) {
      return buildWeeklyDataFromActivity(activity, weekStarts);
    }

    if (Array.isArray(data) && data.length) {
      return ensureRangeLabels(data, weekStarts);
    }

    return ensureRangeLabels(
      [
        { label: "S1", km: 0 },
        { label: "S2", km: 0 },
        { label: "S3", km: 0 },
        { label: "S4", km: 0 },
      ],
      weekStarts,
    );
  }, [data, activity, windowOffset]);

  return (
    <div style={{ width: "100%", height: 262 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={safeData}
          margin={{ top: 10, right: 22, left: 22, bottom: 22 }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <CartesianGrid stroke="#E9EAF7" strokeDasharray="4 6" vertical={false} />

          <XAxis
            dataKey="label"
            axisLine={{ stroke: "#6B6B6B" }}
            tickLine={false}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
            dy={10}
          />

          <YAxis
            domain={[0, 30]}
            ticks={[0, 10, 20, 30]}
            axisLine={{ stroke: "#6B6B6B" }}
            tickLine={false}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
            dx={-10}
          />

          {/* Tooltip sur les barres (pas de voile gris) */}
          <Tooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ outline: "none" }} />

          <Bar dataKey="km" barSize={14} radius={[10, 10, 10, 10]} isAnimationActive={false}>
            {safeData.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={isHovering ? BAR_HOVER : BAR_DEFAULT} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}