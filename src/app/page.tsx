import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { incomes, expenses, bills, goals, accounts } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { RemainingDonut } from "@/components/charts/RemainingDonut";
import { CategoryAllocationChart } from "@/components/charts/CategoryAllocationChart";
import { AccountsFlowChart } from "@/components/charts/AccountsFlowChart";
import { CardSpendingChart } from "@/components/charts/CardSpendingChart";
import { GoalCard } from "@/components/GoalCard";

export const dynamic = "force-dynamic";

const RESERVE_TYPE_EMERGENCIA = "Reserva de emergência";
const RESERVE_TYPE_RENDA = "Aumentar renda";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [incomeRows, expenseRows, billRows, reserveRows, goalRows, cardAccounts] = await Promise.all([
    db.query.incomes.findMany({ where: eq(incomes.month, month) }),
    db.query.expenses.findMany({ where: eq(expenses.month, month), with: { category: true, account: true } }),
    db.query.bills.findMany({ where: eq(bills.month, month), with: { account: true } }),
    db.query.reserves.findMany(),
    db.query.goals.findMany({ orderBy: desc(goals.month) }),
    db.query.accounts.findMany({ where: eq(accounts.type, "cartao") }),
  ]);

  const totalIncome = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
  const totalBills = billRows.reduce((s, b) => s + Number(b.actualAmount ?? b.plannedAmount), 0);
  // Compra no cartão é lançada aqui (em Gastos) no mês da compra, mas o
  // dinheiro só sai de fato quando a fatura é paga, no mês seguinte — e
  // aquele pagamento já entra em totalBills (via "Fatura do mês" em
  // Cartões). Somar as duas coisas contaria a mesma compra duas vezes, então
  // pro fluxo de caixa do mês só entram os gastos que NÃO são de cartão
  // (dinheiro/pix/débito, que saem da conta na hora).
  const totalExpensesNonCard = expenseRows
    .filter((e) => e.account?.type !== "cartao")
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalSpent = totalExpensesNonCard + totalBills;

  // Cartões adicionais (Lety, Lisandro 23...) somam junto com o titular
  // (Bradesco), do mesmo jeito que a fatura consolidada em Cartões.
  const cardAccountsById = new Map(cardAccounts.map((a) => [a.id, a]));
  const cardSpendingTotals = new Map<string, { name: string; bank: string; value: number }>();
  for (const e of expenseRows) {
    if (e.account?.type !== "cartao" || !e.accountId) continue;
    const account = cardAccountsById.get(e.accountId);
    if (!account) continue;
    const topLevel = account.parentAccountId ? cardAccountsById.get(account.parentAccountId) : account;
    if (!topLevel) continue;
    const current = cardSpendingTotals.get(topLevel.id) ?? {
      name: topLevel.name,
      bank: topLevel.bank,
      value: 0,
    };
    current.value += Number(e.amount);
    cardSpendingTotals.set(topLevel.id, current);
  }
  const cardSpendingData = Array.from(cardSpendingTotals.values()).sort((a, b) => b.value - a.value);

  const categoryTotals = new Map<string, { name: string; value: number; color: string }>();
  for (const e of expenseRows) {
    const key = e.category.id;
    const current = categoryTotals.get(key) ?? { name: e.category.name, value: 0, color: e.category.color };
    current.value += Number(e.amount);
    categoryTotals.set(key, current);
  }
  const categoryData = Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);

  const accountsFlowData = billRows.map((b) => ({
    name: b.account!.name,
    planejado: Number(b.plannedAmount),
    real: Number(b.actualAmount ?? 0),
  }));

  function goalCardProps(key: "reserva_emergencia" | "aumento_renda", reserveType: string) {
    const goal = goalRows.find((g) => g.key === key);
    const target = goal ? Number(goal.targetAmount) : 0;
    const matching = reserveRows.filter((r) => r.type === reserveType);
    const totalReserved = matching.reduce((s, r) => s + Number(r.amount), 0);
    const reservedThisMonth = matching
      .filter((r) => r.date.slice(0, 7) === month.slice(0, 7))
      .reduce((s, r) => s + Number(r.amount), 0);
    return { target, reservedThisMonth, totalReserved };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/" />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-center font-semibold">Restante para gastar</h2>
          <RemainingDonut income={totalIncome} spent={totalSpent} />
          <p className="mt-2 text-center text-xs text-black/50 dark:text-white/50">
            Entradas {formatCurrency(totalIncome)} − Gastos e contas {formatCurrency(totalSpent)}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 font-semibold">Alocação de categorias</h2>
          <CategoryAllocationChart data={categoryData} />
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 font-semibold">Gastos por cartão</h2>
          <CardSpendingChart data={cardSpendingData} />
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 font-semibold">Fluxo de contas</h2>
          <AccountsFlowChart data={accountsFlowData} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GoalCard
          title="Reserva de emergência"
          {...goalCardProps("reserva_emergencia", RESERVE_TYPE_EMERGENCIA)}
        />
        <GoalCard title="Meta: aumentar a renda" {...goalCardProps("aumento_renda", RESERVE_TYPE_RENDA)} />
      </div>
    </main>
  );
}
