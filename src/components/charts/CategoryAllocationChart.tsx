"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
    <div className="flex flex-col items-center gap-3">
      <div className="aspect-square w-full max-w-[208px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="100%"
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 text-black/60 dark:text-white/60">{formatCurrency(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
