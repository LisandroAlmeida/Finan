"use client";

import { DonutWithLegend } from "./DonutWithLegend";

export function CategoryAllocationChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return <DonutWithLegend data={data} centerLabel="Total do mês" emptyText="Sem gastos ainda." />;
}
