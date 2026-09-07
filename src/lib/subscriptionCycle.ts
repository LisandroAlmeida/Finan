/**
 * Calcula a próxima data de cobrança de uma assinatura "rolando" a data
 * âncora salva no banco pra frente até cair no futuro (ou hoje), sem
 * precisar que ninguém entre na tela toda hora pra atualizar manualmente.
 *
 * Ex: assinatura mensal com "próxima cobrança" salva em 27/08/2026 — se hoje
 * já é 15/09/2026, isso devolve 27/09/2026 automaticamente.
 */
export function nextOccurrence(
  anchorDate: string,
  cycle: "mensal" | "anual",
  today: Date = new Date(),
): string {
  const [y, m, d] = anchorDate.split("-").map(Number);
  let date = new Date(y, m - 1, d);
  const step = cycle === "anual" ? 12 : 1;
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Evita loop infinito se a data âncora vier inválida por algum motivo.
  let guard = 0;
  while (date < todayMidnight && guard < 2400) {
    date = new Date(date.getFullYear(), date.getMonth() + step, date.getDate());
    guard++;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
