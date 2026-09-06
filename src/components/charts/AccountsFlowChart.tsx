"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";

export function AccountsFlowChart({
  data,
}: {
  data: { name: string; planejado: number; real: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-black/50 dark:text-white/50">Sem faturas lançadas ainda.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Legend />
        <Bar dataKey="planejado" fill="#93C5FD" radius={[0, 4, 4, 0]} />
        <Bar dataKey="real" fill="#2563EB" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
