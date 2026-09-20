import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberFixedExpenseRow } from "@/components/UberFixedExpenseRow";
import {
  createUberFixedExpense,
  updateUberFixedExpense,
  deleteUberFixedExpense,
  payUberFixedExpense,
  deleteUberExpense,
} from "@/lib/uber-actions";
import { UBER_CATEGORY_LABELS, UBER_FIXED_EXPENSE_CATEGORIES, sameMonth } from "../uber-shared";

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

  const paymentByFixedExpenseId = new Map<string, { id: string; date: string; amount: string }>();
  for (const e of allExpenses) {
    if (e.fixedExpenseId && sameMonth(e.date, month)) {
      paymentByFixedExpenseId.set(e.fixedExpenseId, { id: e.id, date: e.date, amount: e.amount });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/despesas-do-carro" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-1 font-semibold">Nova despesa fixa</h2>
        <p className="mb-3 text-xs text-black/50 dark:text-white/50">
          Cadastre revisão, seguro, IPVA e outras despesas que se repetem todo mês. Elas aparecem
          aqui pra você marcar como pago mês a mês — ao marcar, o gasto já entra em Lançamentos e
          nos totais do Dashboard.
        </p>
        <form action={createUberFixedExpense} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              required
              placeholder="Seguro do carro, Revisão..."
              className="w-44 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
            <select
              name="category"
              defaultValue="manutencao"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              {UBER_FIXED_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {UBER_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Valor mensal (R$)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Adicionar
          </button>
        </form>
      </section>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-2 py-2">Descrição</th>
              <th className="px-2 py-2">Categoria</th>
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
                payment={paymentByFixedExpenseId.get(fe.id) ?? null}
                month={month}
                updateUberFixedExpense={updateUberFixedExpense}
                deleteUberFixedExpense={deleteUberFixedExpense}
                payUberFixedExpense={payUberFixedExpense}
                deleteUberExpense={deleteUberExpense}
              />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
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
