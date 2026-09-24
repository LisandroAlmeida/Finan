import Link from "next/link";
import { db } from "@/db";
import { formatCurrency } from "@/lib/format";
import { UberSubNav } from "@/components/UberSubNav";
import { UBER_CATEGORY_LABELS, earningMonthTotal, splitCarExpenses } from "../uber-shared";

export const dynamic = "force-dynamic";

const MESES_ABREV = [
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

const CATEGORY_KEYS = Object.keys(UBER_CATEGORY_LABELS);

function money(v: number) {
  return v > 0 ? formatCurrency(v) : "-";
}

export default async function UberResumoPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const year = sp.year ?? String(new Date().getFullYear());
  const yearNum = Number(year);

  const [allEarnings, allExpenses] = await Promise.all([
    db.query.uberEarnings.findMany(),
    db.query.uberExpenses.findMany(),
  ]);

  // Uma linha por mês (índice 0 = Janeiro), com gastos por categoria +
  // totais, igual ao "Resumo Mensal" da planilha original.
  const rows = MESES_ABREV.map((_, i) => {
    const monthPrefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    const earningsRows = allEarnings.filter((e) => e.date.startsWith(monthPrefix));
    const expenseRows = allExpenses.filter((e) => e.date.startsWith(monthPrefix));

    const categoryTotals: Record<string, number> = {};
    for (const key of CATEGORY_KEYS) categoryTotals[key] = 0;
    for (const e of expenseRows) {
      categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + Number(e.amount);
    }

    const totalGastos = expenseRows.reduce((s, e) => s + Number(e.amount), 0);
    const totalGanhos = earningsRows.reduce((s, e) => s + earningMonthTotal(e), 0);
    const { operational: totalGastosOperacionais } = splitCarExpenses(expenseRows);

    return {
      label: MESES_ABREV[i],
      categoryTotals,
      totalGastos,
      totalGanhos,
      lucroOperacional: totalGanhos - totalGastosOperacionais,
      lucroLiquido: totalGanhos - totalGastos,
    };
  });

  const anual = {
    categoryTotals: CATEGORY_KEYS.reduce<Record<string, number>>((acc, key) => {
      acc[key] = rows.reduce((s, r) => s + r.categoryTotals[key], 0);
      return acc;
    }, {}),
    totalGastos: rows.reduce((s, r) => s + r.totalGastos, 0),
    totalGanhos: rows.reduce((s, r) => s + r.totalGanhos, 0),
    lucroOperacional: rows.reduce((s, r) => s + r.lucroOperacional, 0),
    lucroLiquido: rows.reduce((s, r) => s + r.lucroLiquido, 0),
  };

  // Total gasto no ano por cartão/forma de pagamento (campo livre em
  // uber_expenses.paymentMethod) — dá visibilidade de quanto foi pra cada
  // cartão, sem precisar de uma tabela/tela própria pra isso.
  const expensesInYear = allExpenses.filter((e) => e.date.startsWith(`${year}-`));
  const cardTotalsMap = new Map<string, number>();
  let semCartaoTotal = 0;
  for (const e of expensesInYear) {
    const card = e.paymentMethod?.trim();
    if (!card) {
      semCartaoTotal += Number(e.amount);
      continue;
    }
    cardTotalsMap.set(card, (cardTotalsMap.get(card) ?? 0) + Number(e.amount));
  }
  const cardTotals = Array.from(cardTotalsMap.entries())
    .map(([card, total]) => ({ card, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-center gap-4 py-2">
        <Link
          href={`/uber/resumo?year=${yearNum - 1}`}
          prefetch={false}
          className="rounded-full px-2 py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Ano anterior"
        >
          ←
        </Link>
        <span className="min-w-[6rem] text-center text-lg font-semibold">{year}</span>
        <Link
          href={`/uber/resumo?year=${yearNum + 1}`}
          prefetch={false}
          className="rounded-full px-2 py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Próximo ano"
        >
          →
        </Link>
      </div>
      <UberSubNav />

      <p className="mb-3 text-xs text-black/50 dark:text-white/50">
        Comparativo mês a mês do ano de {year}. &quot;Total Ganhos&quot; inclui bônus. &quot;Lucro
        Operacional&quot; é só o resultado de rodar (sem financiamento/seguro, que são custo fixo
        do carro); &quot;Lucro Líquido&quot; é o final, com tudo incluído.
      </p>

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-2 py-2">Mês</th>
              {CATEGORY_KEYS.map((key) => (
                <th key={key} className="px-2 py-2">
                  {UBER_CATEGORY_LABELS[key]}
                </th>
              ))}
              <th className="px-2 py-2">Total Gastos</th>
              <th className="px-2 py-2">Total Ganhos</th>
              <th className="px-2 py-2">Lucro Operacional</th>
              <th className="px-2 py-2">Lucro Líquido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-black/10 dark:border-white/10">
                <td className="px-2 py-2 font-medium">{r.label}</td>
                {CATEGORY_KEYS.map((key) => (
                  <td key={key} className="px-2 py-2">
                    {money(r.categoryTotals[key])}
                  </td>
                ))}
                <td className="px-2 py-2">{money(r.totalGastos)}</td>
                <td className="px-2 py-2">{money(r.totalGanhos)}</td>
                <td className={`px-2 py-2 ${r.lucroOperacional < 0 ? "text-red-600" : ""}`}>
                  {r.totalGastos === 0 && r.totalGanhos === 0 ? "-" : formatCurrency(r.lucroOperacional)}
                </td>
                <td className={`px-2 py-2 ${r.lucroLiquido < 0 ? "text-red-600" : ""}`}>
                  {r.totalGastos === 0 && r.totalGanhos === 0 ? "-" : formatCurrency(r.lucroLiquido)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/10 font-semibold dark:border-white/10">
              <td className="px-2 py-2">Total Anual</td>
              {CATEGORY_KEYS.map((key) => (
                <td key={key} className="px-2 py-2">
                  {money(anual.categoryTotals[key])}
                </td>
              ))}
              <td className="px-2 py-2">{money(anual.totalGastos)}</td>
              <td className="px-2 py-2">{money(anual.totalGanhos)}</td>
              <td className={`px-2 py-2 ${anual.lucroOperacional < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(anual.lucroOperacional)}
              </td>
              <td className={`px-2 py-2 ${anual.lucroLiquido < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(anual.lucroLiquido)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {cardTotals.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full max-w-sm text-sm">
            <thead className="bg-black/5 text-left dark:bg-white/5">
              <tr>
                <th className="px-2 py-2">Cartão / forma de pagamento</th>
                <th className="px-2 py-2">Total em {year}</th>
              </tr>
            </thead>
            <tbody>
              {cardTotals.map(({ card, total }) => (
                <tr key={card} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-2 py-2">{card}</td>
                  <td className="px-2 py-2">{formatCurrency(total)}</td>
                </tr>
              ))}
              {semCartaoTotal > 0 && (
                <tr className="border-t border-black/10 text-black/50 dark:border-white/10 dark:text-white/50">
                  <td className="px-2 py-2">Sem cartão informado</td>
                  <td className="px-2 py-2">{formatCurrency(semCartaoTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
