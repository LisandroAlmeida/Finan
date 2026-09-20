import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberExpenseRow } from "@/components/UberExpenseRow";
import { createUberExpense, updateUberExpense, deleteUberExpense } from "@/lib/uber-actions";
import { UBER_CATEGORY_LABELS, UBER_LANCAMENTO_CATEGORIES, sameMonth } from "../uber-shared";

export const dynamic = "force-dynamic";

export default async function UberLancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const allExpenses = await db.query.uberExpenses.findMany();
  const rows = allExpenses
    .filter((e) => e.category !== "combustivel" && sameMonth(e.date, month))
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/lancamentos" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Novo lançamento</h2>
        <form action={createUberExpense} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
            <select
              name="category"
              defaultValue="outros"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              {UBER_LANCAMENTO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {UBER_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              placeholder="opcional"
              className="w-40 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Forma Pag</label>
            <input
              name="paymentMethod"
              placeholder="Pix, Crédito..."
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
              <th className="px-2 py-2">Data</th>
              <th className="px-2 py-2">Categoria</th>
              <th className="px-2 py-2">Descrição</th>
              <th className="px-2 py-2">Valor</th>
              <th className="px-2 py-2">Forma Pag</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <UberExpenseRow
                key={e.id}
                expense={e}
                updateUberExpense={updateUberExpense}
                deleteUberExpense={deleteUberExpense}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhum lançamento nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td colSpan={3} className="px-2 py-2">
                  Total
                </td>
                <td className="px-2 py-2">{formatCurrency(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </main>
  );
}
