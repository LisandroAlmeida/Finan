"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/format";

export function CategoryAllocationChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-black/50 dark:text-white/50">Sem gastos ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 40 }}>
        <XAxis
          dataKey="name"
          interval={0}
          angle={-35}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 11 }}
        />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
