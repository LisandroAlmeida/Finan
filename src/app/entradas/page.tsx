import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { IncomeRow } from "./IncomeRow";
import { createIncome, updateIncome, deleteIncome } from "./actions";

export const dynamic = "force-dynamic";

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const rows = await db.query.incomes.findMany({
    where: eq(incomes.month, month),
    orderBy: desc(incomes.createdAt),
  });

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/entradas" />

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Nova entrada</h2>
        <form action={createIncome} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="month" value={month} />
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              required
              placeholder="Ex: Lisandro"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
              className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Adicionar
          </button>
        </form>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">%</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <IncomeRow
                key={r.id}
                income={r}
                percentage={total > 0 ? `${((Number(r.amount) / total) * 100).toFixed(0)}%` : "-"}
                updateIncome={updateIncome}
                deleteIncome={deleteIncome}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhuma entrada cadastrada nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2">{formatCurrency(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </main>
  );
}
