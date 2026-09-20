import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { UberSubNav } from "@/components/UberSubNav";
import { UberCarFinancingCard } from "@/components/UberCarFinancingCard";
import {
  createUberFinancing,
  updateUberFinancing,
  deleteUberFinancing,
  payUberFinancingInstallment,
  updateUberExpense,
  deleteUberExpense,
} from "@/lib/uber-actions";

export const dynamic = "force-dynamic";

export default async function UberFinanciamentoPage() {
  const month = currentMonth();

  const [financings, allExpenses] = await Promise.all([
    db.query.uberFinancings.findMany(),
    db.query.uberExpenses.findMany(),
  ]);

  const sorted = [...financings].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.description.localeCompare(b.description);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <UberSubNav />

      <p className="mb-3 text-xs text-black/50 dark:text-white/50">
        Acompanhamento do financiamento do carro: entrada, total projetado e o quanto você já
        economizou pagando parcela antecipada. Todas as parcelas ficam listadas de uma vez — pode
        marcar como paga a que quiser, sem precisar navegar mês a mês. Despesas parceladas do carro
        em geral (ex: revisão em 10x) ficam na aba &quot;Despesas do carro&quot;.
      </p>

      {sorted.map((f) => (
        <div key={f.id} className="mb-4">
          <UberCarFinancingCard
            financing={f}
            payments={allExpenses
              .filter((e) => e.financingId === f.id)
              .map((e) => ({
                id: e.id,
                date: e.date,
                amount: e.amount,
                category: e.category,
                description: e.description,
                parcelaNumero: e.parcelaNumero,
              }))}
            currentMonth={month.slice(0, 7)}
            updateUberFinancing={updateUberFinancing}
            deleteUberFinancing={deleteUberFinancing}
            payUberFinancingInstallment={payUberFinancingInstallment}
            updateUberExpense={updateUberExpense}
            deleteUberExpense={deleteUberExpense}
          />
        </div>
      ))}

      {sorted.length === 0 && (
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-1 font-semibold">Cadastrar financiamento do carro</h2>
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Depois de cadastrado, todas as parcelas já aparecem listadas — não precisa lançar mês a
            mês, só marcar como paga quando cada uma cair.
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
              <label className="text-xs text-black/60 dark:text-white/60">Valor original do carro (R$)</label>
              <input
                name="carPrice"
                type="number"
                step="0.01"
                min="0"
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Entrada (R$)</label>
              <input
                name="downPayment"
                type="number"
                step="0.01"
                min="0"
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
      )}
    </main>
  );
}
