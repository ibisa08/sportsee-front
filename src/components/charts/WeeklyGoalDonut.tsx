// src/components/charts/WeeklyGoalDonut.tsx
"use client";

import React from "react";
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts";

export default function WeeklyGoalDonut({ done, goal }: { done: number; goal: number }) {
  const safeGoal = Math.max(1, Number(goal ?? 1));
  const safeDone = Math.max(0, Math.min(safeGoal, Number(done ?? 0)));
  const remaining = safeGoal - safeDone;

  const data = [
    { name: "done", value: safeDone },
    { name: "rest", value: remaining },
  ];

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={58}
            outerRadius={86}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="#0B23F4" />
            <Cell fill="#9DA7FB" />
          </Pie>

          {/* Centre text */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}
          >
            <tspan x="50%" dy="-10" style={{ fontSize: 28, fontWeight: 700, fill: "#111111" }}>
              x{safeDone}
            </tspan>
            <tspan x="50%" dy="22" style={{ fontSize: 12, fontWeight: 500, fill: "rgba(0,0,0,0.65)" }}>
              sur objectif de {safeGoal}
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}