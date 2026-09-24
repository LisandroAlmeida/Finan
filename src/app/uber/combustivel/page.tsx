import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberFuelRow } from "@/components/UberFuelRow";
import { createUberExpense, updateUberExpense, deleteUberExpense } from "@/lib/uber-actions";
import { sameMonth } from "../uber-shared";

export const dynamic = "force-dynamic";

export default async function UberCombustivelPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const allExpenses = await db.query.uberExpenses.findMany();
  // Km/L e R$/Km comparam com o abastecimento anterior (por Km abastecimento,
  // não por data) — igual a planilha original. Por isso ordenamos e calculamos
  // com TODO o histórico antes de filtrar só o mês exibido.
  const fuelHistory = allExpenses
    .filter((e) => e.category === "combustivel" && e.kmAbastecimento != null)
    .sort((a, b) => (a.kmAbastecimento ?? 0) - (b.kmAbastecimento ?? 0));

  const derived = new Map<string, { kmPorLitro: number | null; valorPorKm: number | null }>();
  for (let i = 0; i < fuelHistory.length; i++) {
    const curr = fuelHistory[i];
    const prev = fuelHistory[i - 1];
    if (!prev || curr.kmAbastecimento == null || prev.kmAbastecimento == null) {
      derived.set(curr.id, { kmPorLitro: null, valorPorKm: null });
      continue;
    }
    const kmPercorrido = curr.kmAbastecimento - prev.kmAbastecimento;
    const litros = curr.litrosAbastecidos ? Number(curr.litrosAbastecidos) : null;
    derived.set(curr.id, {
      kmPorLitro: litros && kmPercorrido > 0 ? kmPercorrido / litros : null,
      valorPorKm: kmPercorrido > 0 ? Number(curr.amount) / kmPercorrido : null,
    });
  }

  const rows = allExpenses
    .filter((e) => e.category === "combustivel" && sameMonth(e.date, month))
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/combustivel" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-1 font-semibold">Novo abastecimento</h2>
        <p className="mb-3 text-xs text-black/50 dark:text-white/50">
          Km/L e R$/Km são calculados sozinhos, comparando com o abastecimento anterior — pro
          cálculo funcionar direito, encha sempre o tanque completo.
        </p>
        <form action={createUberExpense} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="category" value="combustivel" />
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
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              placeholder="Gasolina, Etanol..."
              className="w-36 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
            <label className="text-xs text-black/60 dark:text-white/60">Km abastecimento</label>
            <input
              name="kmAbastecimento"
              type="number"
              min="0"
              className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Litros (L)</label>
            <input
              name="litrosAbastecidos"
              type="number"
              step="0.01"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Cartão/Forma pag</label>
            <input
              name="paymentMethod"
              placeholder="Mercado Pago, C6, Pix..."
              className="w-36 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
              <th className="px-2 py-2">Descrição</th>
              <th className="px-2 py-2">Valor</th>
              <th className="px-2 py-2">Km abast.</th>
              <th className="px-2 py-2">Litros</th>
              <th className="px-2 py-2">Km/L</th>
              <th className="px-2 py-2">R$/Km</th>
              <th className="px-2 py-2">Cartão</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const d = derived.get(e.id) ?? { kmPorLitro: null, valorPorKm: null };
              return (
                <UberFuelRow
                  key={e.id}
                  expense={e}
                  kmPorLitro={d.kmPorLitro}
                  valorPorKm={d.valorPorKm}
                  updateUberExpense={updateUberExpense}
                  deleteUberExpense={deleteUberExpense}
                />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhum abastecimento nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td colSpan={2} className="px-2 py-2">
                  Total
                </td>
                <td className="px-2 py-2">{formatCurrency(total)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </main>
  );
}
