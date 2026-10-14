const WARNING_THRESHOLD = 0.8;

/** Cor da barra de orçamento: verde até 80%, âmbar até o limite, vermelho acima. */
export function budgetBarColor(ratio: number): string {
  if (ratio > 1) return "#F43F5E";
  if (ratio >= WARNING_THRESHOLD) return "#F59E0B";
  return "#10B981";
}
