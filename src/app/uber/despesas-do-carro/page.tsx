import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberFixedExpenseForm } from "@/components/UberFixedExpenseForm";
import { UberFixedExpenseRow } from "@/components/UberFixedExpenseRow";
import {
  createUberFixedExpense,
  updateUberFixedExpense,
  deleteUberFixedExpense,
  payUberFixedExpense,
  updateUberExpense,
  deleteUberExpense,
} from "@/lib/uber-actions";
import { installmentNumberForMonth, sameMonth } from "../uber-shared";

export const dynamic = "force-dynamic";

export default async function UberDespesasDoCarroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [fixedExpenses, allExpenses] = await Promise.all([
    db.query.uberFixedExpenses.findMany(),
    db.query.uberExpenses.findMany(),
  ]);

  const sorted = [...fixedExpenses].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.description.localeCompare(b.description);
  });

  const paymentByFixedExpenseId = new Map<
    string,
    { id: string; date: string; amount: string; category: string; description: string | null }
  >();
  for (const e of allExpenses) {
    if (e.fixedExpenseId && sameMonth(e.date, month)) {
      paymentByFixedExpenseId.set(e.fixedExpenseId, {
        id: e.id,
        date: e.date,
        amount: e.amount,
        category: e.category,
        description: e.description,
      });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/despesas-do-carro" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-1 font-semibold">Nova despesa fixa</h2>
        <p className="mb-3 text-xs text-black/50 dark:text-white/50">
          Cadastre revisão, seguro, IPVA e outras despesas do carro. Deixe &quot;Parcelada&quot;
          desmarcado pra algo que se repete todo mês (ex: seguro), ou marque e informe o número de
          parcelas pra algo com fim definido (ex: revisão em 10x). Ao marcar como pago, o gasto
          entra nos totais do Resumo/Dashboard, mas não aparece na lista de Lançamentos.
        </p>
        <UberFixedExpenseForm createUberFixedExpense={createUberFixedExpense} />
      </section>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-2 py-2">Descrição</th>
              <th className="px-2 py-2">Categoria</th>
              <th className="px-2 py-2">Parcela</th>
              <th className="px-2 py-2">Valor</th>
              <th className="px-2 py-2">Status do mês</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((fe) => (
              <UberFixedExpenseRow
                key={fe.id}
                fixedExpense={fe}
                installmentNumber={
                  fe.installmentCount && fe.installmentStartDate
                    ? installmentNumberForMonth(
                        { startDate: fe.installmentStartDate, installmentCount: fe.installmentCount },
                        month,
                      )
                    : null
                }
                payment={paymentByFixedExpenseId.get(fe.id) ?? null}
                month={month}
                updateUberFixedExpense={updateUberFixedExpense}
                deleteUberFixedExpense={deleteUberFixedExpense}
                payUberFixedExpense={payUberFixedExpense}
                updateUberExpense={updateUberExpense}
                deleteUberExpense={deleteUberExpense}
              />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhuma despesa fixa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
