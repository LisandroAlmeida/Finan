import { db } from "@/db";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { UberSubNav } from "@/components/UberSubNav";
import { RemainingDonut } from "@/components/charts/RemainingDonut";
import { CategoryAllocationChart } from "@/components/charts/CategoryAllocationChart";
import { quickLogUberDay } from "@/lib/uber-actions";
import { formatDate } from "@/lib/format";
import {
  UBER_CATEGORY_COLORS,
  UBER_CATEGORY_LABELS,
  earningDayTotal,
  groupExpensesByCard,
  openFaturaByCard,
  sameMonth,
  splitCarExpenses,
} from "./uber-shared";

export const dynamic = "force-dynamic";

export default async function UberDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [allEarnings, allExpenses] = await Promise.all([
    db.query.uberEarnings.findMany(),
    db.query.uberExpenses.findMany(),
  ]);

  const earningsRows = allEarnings.filter((e) => sameMonth(e.date, month));
  const expenseRows = allExpenses.filter((e) => sameMonth(e.date, month));

  // Ganhos "de corrida" (valor + promo + gorjeta/extras) somados à parte do
  // bônus — assim o bônus fica visível no dashboard em vez de escondido
  // dentro de um único total de ganhos (a planilha também trata o bônus
  // separado do "Total Ganhos" do Resumo Mensal).
  const totalGanhosSemBonus = earningsRows.reduce((s, e) => s + earningDayTotal(e), 0);
  const totalBonus = earningsRows.reduce((s, e) => s + Number(e.bonus ?? 0), 0);
  const totalGanhos = totalGanhosSemBonus + totalBonus;
  const totalGastos = expenseRows.reduce((s, e) => s + Number(e.amount), 0);
  // "Lucro operacional" isola o resultado de rodar (sem financiamento/
  // seguro, que são custo fixo de posse do carro, não de operação).
  const { operational: totalGastosOperacionais, fixedCarCosts: totalCustosFixosCarro } =
    splitCarExpenses(expenseRows);
  const lucroOperacional = totalGanhos - totalGastosOperacionais;
  const totalKmRodado = earningsRows.reduce(
    (s, e) => s + Math.max(0, (e.kmFinal ?? 0) - (e.kmInicial ?? 0)),
    0,
  );

  const categoryTotals = new Map<string, number>();
  for (const e of expenseRows) {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + Number(e.amount));
  }
  const categoryData = Array.from(categoryTotals.entries())
    .map(([key, value]) => ({
      name: UBER_CATEGORY_LABELS[key] ?? key,
      value,
      color: UBER_CATEGORY_COLORS[key] ?? "#6B7280",
    }))
    .sort((a, b) => b.value - a.value);

  const cardData = groupExpensesByCard(expenseRows);
  const openFaturas = openFaturaByCard(allExpenses).filter((f) => f.total > 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/uber" />
      <UberSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-center font-semibold">Lucro líquido final</h2>
          <RemainingDonut income={totalGanhos} spent={totalGastos} />
          <p className="mt-2 text-center text-xs text-black/50 dark:text-white/50">
            {totalBonus > 0 ? (
              <>
                Ganhos {formatCurrency(totalGanhosSemBonus)} + Bônus {formatCurrency(totalBonus)} − Gastos{" "}
                {formatCurrency(totalGastos)}
              </>
            ) : (
              <>
                Ganhos {formatCurrency(totalGanhos)} − Gastos {formatCurrency(totalGastos)}
              </>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-1 font-semibold">Lucro operacional</h2>
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Só o resultado de rodar — sem financiamento/seguro, que são custo fixo do carro,
            independente de quanto se dirige.
          </p>
          <p
            className={`text-2xl font-bold ${lucroOperacional < 0 ? "text-red-600" : "text-black dark:text-white"}`}
          >
            {formatCurrency(lucroOperacional)}
          </p>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Ganhos (+ bônus)</dt>
              <dd>{formatCurrency(totalGanhos)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Gastos operacionais</dt>
              <dd>{formatCurrency(totalGastosOperacionais)}</dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-1.5 dark:border-white/10">
              <dt className="text-black/60 dark:text-white/60">Financiamento + Seguro (fixo)</dt>
              <dd>{formatCurrency(totalCustosFixosCarro)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Lucro líquido final</dt>
              <dd>{formatCurrency(totalGanhos - totalGastos)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 font-semibold">Gastos por categoria</h2>
          <CategoryAllocationChart data={categoryData} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-1 font-semibold">Lançamento rápido do dia</h2>
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Registra km inicial/final do turno e/ou o abastecimento de uma vez só. Pra detalhar
            valor da corrida, horas, viagens etc, use a tela de{" "}
            <a href="/uber/ganhos" className="text-blue-600 hover:underline">
              Ganhos
            </a>
            .
          </p>
          <form action={quickLogUberDay} className="flex flex-wrap items-end gap-3">
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
              <label className="text-xs text-black/60 dark:text-white/60">Km inicial</label>
              <input
                name="kmInicial"
                type="number"
                min="0"
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Km final</label>
              <input
                name="kmFinal"
                type="number"
                min="0"
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
              <label className="text-xs text-black/60 dark:text-white/60">Valor combustível (R$)</label>
              <input
                name="valorCombustivel"
                type="number"
                step="0.01"
                min="0"
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
              Lançar
            </button>
          </form>
        </section>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-3 font-semibold">Resumo do mês</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Km rodados</dt>
              <dd>{totalKmRodado.toLocaleString("pt-BR")} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Dias rodados</dt>
              <dd>{earningsRows.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/60 dark:text-white/60">Ganho por km</dt>
              <dd>{totalKmRodado > 0 ? formatCurrency(totalGanhos / totalKmRodado) : "-"}</dd>
            </div>
            {totalBonus > 0 && (
              <div className="flex justify-between">
                <dt className="text-black/60 dark:text-white/60">Bônus do mês</dt>
                <dd>{formatCurrency(totalBonus)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 font-semibold">Gastos por cartão</h2>
          <CategoryAllocationChart data={cardData} />
        </div>
      </div>

      {openFaturas.length > 0 && (
        <div className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-1 font-semibold">Faturas dos cartões</h2>
          <p className="mb-3 text-xs text-black/50 dark:text-white/50">
            Tudo que já foi lançado em cada cartão, a pagar na próxima data de fechamento — não é
            por mês selecionado acima, é sempre em relação a hoje.
          </p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {openFaturas.map((f) => (
              <div key={f.card} className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <dt className="text-sm font-medium">{f.card}</dt>
                <dd className="text-lg font-semibold">{formatCurrency(f.total)}</dd>
                <dd className="text-xs text-black/50 dark:text-white/50">
                  Fecha/vence {formatDate(f.closingDate)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </main>
  );
}
