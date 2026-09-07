import { desc } from "drizzle-orm";
import { db } from "@/db";
import { reserves, goals } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { formatCurrency, formatDate } from "@/lib/format";
import { createReserve, deleteReserve, upsertGoal } from "./actions";

export const dynamic = "force-dynamic";

const RESERVE_TYPE_SUGGESTIONS = [
  "Reserva de emergência",
  "Aumentar renda",
  "Renda fixa",
  "Ações",
  "Fundo imobiliário",
];

const GOAL_LABELS: Record<string, string> = {
  reserva_emergencia: "Reserva de emergência",
  aumento_renda: "Aumentar renda",
};

export default async function ReservasPage() {
  const month = currentMonth();

  const [reserveList, goalRows] = await Promise.all([
    db.query.reserves.findMany({ orderBy: desc(reserves.date) }),
    db.query.goals.findMany({ orderBy: desc(goals.month) }),
  ]);

  const total = reserveList.reduce((s, r) => s + Number(r.amount), 0);

  function currentTarget(key: "reserva_emergencia" | "aumento_renda") {
    const goal = goalRows.find((g) => g.key === key);
    return goal ? Number(goal.targetAmount) : 0;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Novo registro</h2>
        <form action={createReserve} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Tesouro Selic"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Tipo</label>
            <input
              name="type"
              required
              list="reserve-type-suggestions"
              placeholder="Ex: Renda fixa"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
            <datalist id="reserve-type-suggestions">
              {RESERVE_TYPE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
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
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {reserveList.map((r) => (
              <tr key={r.id} className="border-t border-black/10 dark:border-white/10">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2">{formatCurrency(r.amount)}</td>
                <td className="px-3 py-2">{formatDate(r.date)}</td>
                <td className="px-3 py-2 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteReserve(r.id);
                    }}
                  >
                    <button className="text-xs text-red-600 hover:underline">excluir</button>
                  </form>
                </td>
              </tr>
            ))}
            {reserveList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhuma reserva cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
          {reserveList.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2">{formatCurrency(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(GOAL_LABELS) as Array<keyof typeof GOAL_LABELS>).map((key) => (
          <div key={key} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <h3 className="mb-2 font-semibold">{GOAL_LABELS[key]}</h3>
            <p className="mb-3 text-sm text-black/60 dark:text-white/60">
              Meta atual: <span className="font-semibold text-black dark:text-white">{formatCurrency(currentTarget(key as "reserva_emergencia" | "aumento_renda"))}</span>
            </p>
            <form action={upsertGoal} className="flex items-end gap-3">
              <input type="hidden" name="key" value={key} />
              <div className="flex flex-col">
                <label className="text-xs text-black/60 dark:text-white/60">Novo valor da meta (R$)</label>
                <input
                  name="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={currentTarget(key as "reserva_emergencia" | "aumento_renda") || undefined}
                  className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                />
              </div>
              <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
                Atualizar
              </button>
            </form>
            <p className="mt-2 text-xs text-black/40 dark:text-white/40">Referente a {month.slice(0, 7)}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
