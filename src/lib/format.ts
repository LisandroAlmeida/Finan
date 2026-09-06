export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value + "T00:00:00") : value;
  return d.toLocaleDateString("pt-BR");
}
