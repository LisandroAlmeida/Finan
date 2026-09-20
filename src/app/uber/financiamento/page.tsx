import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberFinancingRow } from "@/components/UberFinancingRow";
import {
  createUberFinancing,
  updateUberFinancing,
  deleteUberFinancing,
  payUberFinancingInstallment,
  deleteUberExpense,
} from "@/lib/uber-actions";
import { financingInstallmentForMonth, sameMonth } from "../uber-shared";

export const dynamic = "force-dynamic";

export default async function UberFinanciamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [financings, allExpenses] = await Promise.all([
    db.query.uberFinancings.findMany(),
    db.query.uberExpenses.findMany(),
  ]);

  const sorted = [...financings].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.description.localeCompare(b.description);
  });

  const paymentByFinancingId = new Map<string, { id: string; date: string; amount: string }>();
  for (const e of allExpenses) {
    if (e.financingId && sameMonth(e.date, month)) {
      paymentByFinancingId.set(e.financingId, { id: e.id, date: e.date, amount: e.amount });
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/financiamento" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-1 font-semibold">Novo financiamento</h2>
        <p className="mb-3 text-xs text-black/50 dark:text-white/50">
          O número da parcela de cada mês é calculado sozinho a partir da data de início — não
          precisa lançar mês a mês, só marcar como pago quando a parcela cair.
        </p>
        <form action={createUberFinancing} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              required
              placeholder="Financiamento do carro"
              className="w-44 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Valor da parcela (R$)</label>
            <input
              name="installmentAmount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nº de parcelas</label>
            <input
              name="installmentCount"
              type="number"
              min="1"
              required
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Início (1ª parcela)</label>
            <input
              name="startDate"
              type="date"
              required
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
              <th className="px-2 py-2">Parcela</th>
              <th className="px-2 py-2">Valor</th>
              <th className="px-2 py-2">Status do mês</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => (
              <UberFinancingRow
                key={f.id}
                financing={f}
                installmentNumber={financingInstallmentForMonth(f, month)}
                payment={paymentByFinancingId.get(f.id) ?? null}
                month={month}
                updateUberFinancing={updateUberFinancing}
                deleteUberFinancing={deleteUberFinancing}
                payUberFinancingInstallment={payUberFinancingInstallment}
                deleteUberExpense={deleteUberExpense}
              />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhum financiamento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
