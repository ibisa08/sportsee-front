"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { WeeklyDistancePoint } from "@/utils/activity";

type Props = {
  data: WeeklyDistancePoint[];
};

export default function WeeklyDistanceChart({ data }: Props) {
  return (
    <div style={{ width: "100%", minHeight: 260 }}>
      <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="km" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}