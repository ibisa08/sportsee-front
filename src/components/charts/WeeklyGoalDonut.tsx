"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type WeeklyGoalDonutProps = {
  done: number;
  goal: number;
};

const COLOR_DONE = "#0B23F4";   // réalisées (bleu foncé)
const COLOR_REMAIN = "#B6BDFC"; // restants (bleu clair)

export default function WeeklyGoalDonut({ done, goal }: WeeklyGoalDonutProps) {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0;
  const safeDone = Number.isFinite(done) && done > 0 ? done : 0;
  const remaining = Math.max(safeGoal - safeDone, 0);

  // IMPORTANT: on met "restants" en premier pour que la petite portion soit en haut à droite.
  const data = [
    { name: "restants", value: remaining, color: COLOR_REMAIN },
    { name: "réalisées", value: safeDone, color: COLOR_DONE },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: 230 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="52%"
            innerRadius={52}
            outerRadius={78}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Légende gauche : réalisées (bleu foncé) */}
      <div
        style={{
          position: "absolute",
          left: 23,
          top: 170,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "Inter",
          fontSize: 10,
          fontWeight: 400,
          color: "#707070",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: COLOR_DONE,
            display: "inline-block",
          }}
        />
        <span style={{ color: "#111111", opacity: 0.9 }}>{safeDone}</span>
        <span>réalisées</span>
      </div>

      {/* Légende droite : restants (bleu clair) - volontairement décalée */}
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "Inter",
          fontSize: 10,
          color: "#707070",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: COLOR_REMAIN,
            display: "inline-block",
          }}
        />
        <span style={{ color: "#111111", opacity: 0.9 }}>{remaining}</span>
        <span>restants</span>
      </div>
    </div>
  );
}