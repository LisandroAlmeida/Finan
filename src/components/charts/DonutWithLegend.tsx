"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { TOOLTIP_PROPS } from "./theme";

type Slice = { name: string; value: number; color: string };

const MAX_LEGEND_ITEMS = 6;

/** Rosca com total no centro e legenda (top 6 + "Outras") — mesmo desenho da referência. */
export function DonutWithLegend({
  data,
  centerLabel,
  emptyText,
}: {
  data: Slice[];
  centerLabel: string;
  emptyText: string;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const legendSlices = data.slice(0, MAX_LEGEND_ITEMS);
  const otherSlices = data.slice(MAX_LEGEND_ITEMS);
  const otherTotal = otherSlices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((slice, index) => (
                <Cell key={index} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_PROPS} formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">{centerLabel}</span>
          <span className="num text-base font-bold">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-2 text-xs">
        {legendSlices.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-muted-foreground">{slice.name}</span>
            </span>
            <span className="num shrink-0 font-medium">{formatCurrency(slice.value)}</span>
          </li>
        ))}
        {otherSlices.length > 0 && (
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">Outras ({otherSlices.length})</span>
            </span>
            <span className="num shrink-0 font-medium">{formatCurrency(otherTotal)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
