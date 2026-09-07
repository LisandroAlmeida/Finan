"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";

export function RemainingDonut({ income, spent }: { income: number; spent: number }) {
  const remaining = income - spent;
  const overspent = remaining < 0;

  const data = overspent
    ? [{ value: 1 }]
    : [
        { value: spent },
        { value: Math.max(remaining, 0) },
      ];

  const colors = overspent ? ["#EF4444"] : ["#2563EB", "#E5E7EB"];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[224px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={`text-2xl font-bold ${overspent ? "text-red-600" : "text-black dark:text-white"}`}
        >
          {formatCurrency(remaining)}
        </span>
      </div>
    </div>
  );
}
