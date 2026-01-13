// src/components/charts/WeeklyDistanceChart.tsx
"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeeklyDistancePoint = { week: string; km: number };

type Props = {
  data: WeeklyDistancePoint[];
};

function RoundedBar(props: any) {
  const { x, y, width, height, fill } = props;
  const r = Math.min(12, width / 2, height / 2);
  return <rect x={x} y={y} width={width} height={height} rx={r} ry={r} fill={fill} />;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload?.[0]?.value ?? 0;

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
      <div>km : {Number(v).toFixed(1).replace(/\.0$/, "")}</div>
    </div>
  );
}

export default function WeeklyDistanceChart({ data }: Props) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 18, left: 10, bottom: 0 }}
          barCategoryGap={36}
          barGap={10}
        >
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(0,0,0,0.12)" />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.55)" }}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "rgba(0,0,0,0.55)" }}
            tick={{ fill: "#6B6B6B", fontSize: 12 }}
            domain={[0, 30]}
            ticks={[0, 10, 20, 30]}
            width={32}
          />

          {/* Hover highlight like the maquette */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.06)" }} />

          <Bar
            dataKey="km"
            fill="#9DA7FB"
            barSize={22}
            shape={<RoundedBar />}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}