"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { BpmPoint } from "@/utils/bpm";

type Props = { data: BpmPoint[] };

function BpmTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const byKey = new Map<string, number | null>();
  for (const p of payload) {
    if (p?.dataKey) byKey.set(p.dataKey, p.value ?? null);
  }

  const min = byKey.get("minBpm");
  const max = byKey.get("maxBpm");
  const avg = byKey.get("avgBpm");

  // si tout est null, on n’affiche rien
  if (min == null && max == null && avg == null) return null;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #ddd",
        padding: 10,
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div>Min : {min ?? "-"}</div>
      <div>Max : {max ?? "-"}</div>
      <div>Moy : {avg ?? "-"}</div>
    </div>
  );
}

export default function BpmChart({ data }: Props) {
  return (
    <div style={{ width: "100%", minHeight: 260 }}>
      <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />

          <Tooltip content={<BpmTooltip />} />

          {/* Si la valeur est null => pas de barre */}
          <Bar dataKey="minBpm" radius={[8, 8, 0, 0]} />
          <Bar dataKey="maxBpm" radius={[8, 8, 0, 0]} />

          {/* null => pas de point/segment, donc pas de ligne à 0 */}
          <Line
            type="monotone"
            dataKey="avgBpm"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}