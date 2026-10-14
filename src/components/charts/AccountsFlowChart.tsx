"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK, TOOLTIP_PROPS } from "./theme";

type SortOption = "name" | "value-asc" | "value-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Nome (A-Z)" },
  { value: "value-asc", label: "Valor: menor → maior" },
  { value: "value-desc", label: "Valor: maior → menor" },
];

export function AccountsFlowChart({
  data,
}: {
  data: { name: string; planejado: number; real: number }[];
}) {
  const [sort, setSort] = useState<SortOption>("name");

  const sortedData = useMemo(() => {
    const copy = [...data];
    switch (sort) {
      case "value-asc":
        copy.sort((a, b) => a.real - b.real);
        break;
      case "value-desc":
        copy.sort((a, b) => b.real - a.real);
        break;
      default:
        copy.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
    return copy;
  }, [data, sort]);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sem faturas lançadas ainda.</p>;
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-md border bg-card px-2 py-1 text-xs"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(260, sortedData.length * 40)}>
        <BarChart data={sortedData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={90} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP_PROPS} formatter={(v) => formatCurrency(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
          <Bar dataKey="planejado" fill="#475569" radius={[0, 4, 4, 0]} />
          <Bar dataKey="real" fill="#10B981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
