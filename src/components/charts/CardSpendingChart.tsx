"use client";

import { bankInfo } from "@/lib/banks";
import { DonutWithLegend } from "./DonutWithLegend";

export function CardSpendingChart({
  data,
}: {
  data: { name: string; bank: string; value: number }[];
}) {
  const slices = data.map((card) => ({
    name: card.name,
    value: card.value,
    color: bankInfo(card.bank).color,
  }));
  return <DonutWithLegend data={slices} centerLabel="No cartão" emptyText="Sem gastos no cartão ainda." />;
}
