import { shiftMonth, toMonth } from "./month";

/**
 * Calcula o mês de referência (usado nas telas de Gastos e no Dashboard) de
 * uma compra feita no cartão, considerando o dia de fechamento da fatura.
 *
 * Regra: uma compra feita ANTES do dia de fechamento entra na fatura que
 * fecha nesse mês (e vence no mês seguinte). Uma compra feita NO dia de
 * fechamento ou depois só entra no ciclo seguinte (vence 2 meses depois da
 * compra).
 *
 * Exemplo (fechamento dia 27): compra em 26/08 → cai no ciclo que fecha em
 * 27/08 → mês de referência = Setembro. Compra em 28/08 → só entra no ciclo
 * que fecha em 27/09 → mês de referência = Novembro.
 *
 * Sem dia de fechamento cadastrado (conta normal, pix, dinheiro, ou cartão
 * ainda sem essa informação), mantém o comportamento antigo: mês civil da
 * própria data.
 */
export function resolveExpenseMonth(dateStr: string, closingDay?: number | null): string {
  const baseMonth = toMonth(dateStr);
  if (!closingDay) return baseMonth;

  const day = Number(dateStr.split("-")[2]);
  const monthsToAdd = day >= closingDay ? 2 : 1;
  return shiftMonth(baseMonth, monthsToAdd);
}
