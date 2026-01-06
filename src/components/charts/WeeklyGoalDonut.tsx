"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  done?: number;
  goal?: number;
};

export default function WeeklyGoalDonut({ done = 0, goal = 6 }: Props) {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 6;
  const safeDone = Number.isFinite(done) && done >= 0 ? Math.min(done, safeGoal) : 0;
  const remaining = Math.max(0, safeGoal - safeDone);

  const data = [
    { name: "Réalisées", value: safeDone },
    { name: "Restantes", value: remaining },
  ];

  return (
    <div style={{ width: "100%", minHeight: 240 }}>
      <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={70}
            outerRadius={95}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, idx) => (
              <Cell key={idx} />
            ))}
          </Pie>

          <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize="28">
            x{safeDone}
          </text>
          <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize="12">
            sur objectif de {safeGoal}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}