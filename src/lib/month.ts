const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Retorna o mês atual no formato "YYYY-MM-01" (sempre dia 1). */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** "2026-08-01" -> "Agosto 2026" */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return `${MESES[m - 1]} ${year}`;
}

/** Soma/subtrai meses a partir de uma referência "YYYY-MM-01". */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Normaliza uma data "YYYY-MM-DD" pro primeiro dia do mês correspondente. */
export function toMonth(date: string): string {
  return date.slice(0, 7) + "-01";
}
