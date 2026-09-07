import { shiftMonth, toMonth } from "./month";

/**
 * Calcula o mês de referência (usado nas telas de Gastos e no Dashboard) de
 * uma compra feita no cartão, considerando o dia de fechamento da fatura.
 *
 * Regra (confirmada com um exemplo real de fatura): uma compra feita ANTES
 * do dia de fechamento fica na fatura que já está em andamento, com o mesmo
 * mês de referência da própria data. Uma compra feita NO dia de fechamento
 * ou depois só entra no ciclo seguinte, um mês à frente.
 *
 * Exemplo real (Bradesco, fechamento por volta do dia 26, vencimento sempre
 * dia 08): compra em 25/08 → fatura de Agosto (paga 08/09). Compra em 26/08
 * → fatura de Setembro (paga 08/10, junto com compras até 26/09). Compra em
 * 27/09 → fatura de Outubro.
 *
 * Sem dia de fechamento cadastrado (conta normal, pix, dinheiro, ou cartão
 * ainda sem essa informação), mantém o comportamento antigo: mês civil da
 * própria data.
 */
export function resolveExpenseMonth(dateStr: string, closingDay?: number | null): string {
  const baseMonth = toMonth(dateStr);
  if (!closingDay) return baseMonth;

  const day = Number(dateStr.split("-")[2]);
  return day >= closingDay ? shiftMonth(baseMonth, 1) : baseMonth;
}
