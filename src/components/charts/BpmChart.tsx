// src/components/charts/BpmChart.tsx
"use client";

import React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BpmPoint = {
  day: string; // "Lun".."Dim"
  min: number;
  max: number;
  avg: number;
};

type Props = {
  data: BpmPoint[];
};

function RoundedBar(props: any) {
  const { x, y, width, height, fill } = props;
  const r = Math.min(10, width / 2, height / 2);
  return <rect x={x} y={y} width={width} height={height} rx={r} ry={r} fill={fill} />;
}

function DotBlue(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#0B23F4"
      stroke="#FFFFFF"
      strokeWidth={2}
    />
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // payload contains series entries; we take the original point from the first item
  const p = payload?.[0]?.payload as any;

  const min = Number(p?.min ?? 0);
  const max = Number(p?.max ?? 0);
  const avg = Number(p?.avg ?? 0);
  

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: 12,
        color: "#111111",
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div>Min : {min}</div>
      <div>Max : {max}</div>
      <div>Moy : {avg}</div>
    </div>
  );
}

export default function BpmChart({ data }: Props) {
  // Match maquette axis (130..187)
  const TICKS = [130, 145, 160, 187];
  const [isLineHover, setIsLineHover] = React.useState(false);

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 18, left: 10, bottom: 0 }}
          barCategoryGap={24}
          barGap={10}
          onMouseMove={(state: any) => setIsLineHover(!!state?.isTooltipActive)}
          onMouseLeave={() => setIsLineHover(false)}
        >
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(0,0,0,0.12)" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.55)" }}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.55)" }}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
            domain={[130, 187]}
            ticks={TICKS}
            width={40}
          />

          {/* No grey overlay on BPM chart */}
          <Tooltip content={<CustomTooltip />} cursor={false} defaultIndex={-1 as any} />

          {/* Min (light red, thinner) */}
          <Bar
            dataKey="min"
            fill="rgba(242,72,62,0.30)"
            barSize={14}
            shape={<RoundedBar />}
            isAnimationActive={false}
          />

          {/* Max (red, thicker) */}
          <Bar
            dataKey="max"
            fill="#F2483E"
            barSize={16}
            shape={<RoundedBar />}
            isAnimationActive={false}
          />

          {/* Glow (toujours) */}
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#F2F3FF"
            strokeWidth={3}
            dot={false}
            activeDot={false}
            connectNulls
            isAnimationActive={false}
          />

          {/* Ligne principale (hover sur le stroke) */}
          <Line
            type="monotone"
            dataKey="avg"
            stroke={isLineHover ? "#0B23F4" : "#F2F3FF"}
            strokeWidth={isLineHover ? 3 : 3}
            strokeLinecap="round"
            dot={<DotBlue />}
            activeDot={{ r: 6, fill: "#0B23F4", stroke: "#FFFFFF", strokeWidth: 3 }}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}