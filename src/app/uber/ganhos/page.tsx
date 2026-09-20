import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { UberEarningRow } from "@/components/UberEarningRow";
import { createUberEarning, updateUberEarning, deleteUberEarning } from "@/lib/uber-actions";
import { earningMonthTotal, sameMonth } from "../uber-shared";

export const dynamic = "force-dynamic";

export default async function UberGanhosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const allEarnings = await db.query.uberEarnings.findMany();
  const rows = allEarnings
    .filter((e) => sameMonth(e.date, month))
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((s, e) => s + earningMonthTotal(e), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber/ganhos" />
      <UberSubNav />

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Novo registro de ganhos</h2>
        <form action={createUberEarning} className="flex flex-wrap items-end gap-3">
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
            <label className="text-xs text-black/60 dark:text-white/60">Plataforma</label>
            <input
              name="platform"
              defaultValue="Uber"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Km inicial</label>
            <input
              name="kmInicial"
              type="number"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Km final</label>
            <input
              name="kmFinal"
              type="number"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Horas</label>
            <input
              name="horasTrabalhadas"
              type="number"
              step="0.01"
              min="0"
              className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Viagens</label>
            <input
              name="viagens"
              type="number"
              min="0"
              className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Pontos</label>
            <input
              name="pontos"
              type="number"
              min="0"
              className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
            <input
              name="valor"
              type="number"
              step="0.01"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Promo (R$)</label>
            <input
              name="promo"
              type="number"
              step="0.01"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Gorjeta/Extras (R$)</label>
            <input
              name="gorjetaExtras"
              type="number"
              step="0.01"
              min="0"
              className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Bônus (R$)</label>
            <input
              name="bonus"
              type="number"
              step="0.01"
              min="0"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
              <th className="px-2 py-2">Plataforma</th>
              <th className="px-2 py-2">Km rodados</th>
              <th className="px-2 py-2">Horas</th>
              <th className="px-2 py-2">Viagens</th>
              <th className="px-2 py-2">Ganhos totais</th>
              <th className="px-2 py-2">Ganhos/h</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <UberEarningRow
                key={e.id}
                earning={e}
                updateUberEarning={updateUberEarning}
                deleteUberEarning={deleteUberEarning}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhum registro de ganhos nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td colSpan={5} className="px-2 py-2">
                  Total (com bônus)
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
