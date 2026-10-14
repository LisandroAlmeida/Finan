"use client";

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK, TOOLTIP_PROPS } from "./theme";

type MonthlyPoint = { label: string; receitas: number; despesas: number };

function compactCurrency(value: number) {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return `R$ ${value}`;
}

export function IncomeExpenseChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={compactCurrency}
          />
          <Tooltip {...TOOLTIP_PROPS} formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="despesas" name="Despesas" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
