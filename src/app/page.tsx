import { and, desc, eq, gte, lte } from "drizzle-orm";
import { ArrowDownRight, PiggyBank, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { incomes, expenses, bills, goals, accounts } from "@/db/schema";
import { currentMonth, monthLabelLong, shiftMonth, toMonth } from "@/lib/month";
import { formatCurrency, formatDate } from "@/lib/format";
import { bankInfo } from "@/lib/banks";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { GoalCard } from "@/components/GoalCard";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryAllocationChart } from "@/components/charts/CategoryAllocationChart";
import { AccountsFlowChart } from "@/components/charts/AccountsFlowChart";
import { CardSpendingChart } from "@/components/charts/CardSpendingChart";

export const dynamic = "force-dynamic";

const RESERVE_TYPE_EMERGENCIA = "Reserva de emergência";
const RESERVE_TYPE_RENDA = "Aumentar renda";
const MONTHS_IN_CHART = 6;
const RECENT_TRANSACTIONS_LIMIT = 8;
const SHORT_MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();
  const chartMonths = Array.from({ length: MONTHS_IN_CHART }, (_, index) =>
    shiftMonth(month, index - (MONTHS_IN_CHART - 1)),
  );
  const firstChartMonth = chartMonths[0];

  const [incomeRows, expenseRows, billRows, reserveRows, goalRows, cardAccounts] = await Promise.all([
    db.query.incomes.findMany({ where: and(gte(incomes.month, firstChartMonth), lte(incomes.month, month)) }),
    db.query.expenses.findMany({
      where: and(gte(expenses.month, firstChartMonth), lte(expenses.month, month)),
      with: { category: true, account: true },
    }),
    db.query.bills.findMany({
      where: and(gte(bills.month, firstChartMonth), lte(bills.month, month)),
      with: { account: true },
    }),
    db.query.reserves.findMany(),
    db.query.goals.findMany({ orderBy: desc(goals.month) }),
    db.query.accounts.findMany({ where: eq(accounts.type, "cartao") }),
  ]);

  // Compra no cartão é lançada em Gastos no mês da compra, mas o dinheiro só
  // sai de fato quando a fatura é paga — e aquele pagamento já entra nas
  // faturas ("bills", via "Fatura do mês" em Cartões). Somar as duas coisas
  // contaria a mesma compra duas vezes, então pro fluxo de caixa do mês só
  // entram os gastos que NÃO são de cartão (dinheiro/pix/débito).
  function totalsOfMonth(targetMonth: string) {
    const income = incomeRows
      .filter((row) => row.month === targetMonth)
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const nonCardExpenses = expenseRows
      .filter((row) => row.month === targetMonth && row.account?.type !== "cartao")
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const billsTotal = billRows
      .filter((row) => row.month === targetMonth)
      .reduce((sum, row) => sum + Number(row.actualAmount ?? row.plannedAmount), 0);
    return { income, spent: nonCardExpenses + billsTotal };
  }

  const { income: totalIncome, spent: totalSpent } = totalsOfMonth(month);
  const leftover = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? (leftover / totalIncome) * 100 : 0;
  const totalReserved = reserveRows.reduce((sum, row) => sum + Number(row.amount), 0);

  const monthlySeries = chartMonths.map((chartMonth) => {
    const { income, spent } = totalsOfMonth(chartMonth);
    return {
      label: SHORT_MONTH_LABELS[Number(chartMonth.split("-")[1]) - 1],
      receitas: income,
      despesas: spent,
    };
  });

  const monthExpenses = expenseRows.filter((row) => row.month === month);
  const monthBills = billRows.filter((row) => row.month === month);

  // Cartões adicionais (Lety, Lisandro 23...) somam junto com o titular
  // (Bradesco), do mesmo jeito que a fatura consolidada em Cartões.
  const cardAccountsById = new Map(cardAccounts.map((account) => [account.id, account]));
  const cardSpendingTotals = new Map<string, { name: string; bank: string; value: number }>();
  for (const expense of monthExpenses) {
    if (expense.account?.type !== "cartao" || !expense.accountId) continue;
    const account = cardAccountsById.get(expense.accountId);
    if (!account) continue;
    const topLevel = account.parentAccountId ? cardAccountsById.get(account.parentAccountId) : account;
    if (!topLevel) continue;
    const current = cardSpendingTotals.get(topLevel.id) ?? {
      name: topLevel.name,
      bank: topLevel.bank,
      value: 0,
    };
    current.value += Number(expense.amount);
    cardSpendingTotals.set(topLevel.id, current);
  }
  const cardSpendingData = Array.from(cardSpendingTotals.values()).sort((a, b) => b.value - a.value);

  const categoryTotals = new Map<string, { name: string; value: number; color: string }>();
  for (const expense of monthExpenses) {
    const key = expense.category.id;
    const current = categoryTotals.get(key) ?? {
      name: expense.category.name,
      value: 0,
      color: expense.category.color,
    };
    current.value += Number(expense.amount);
    categoryTotals.set(key, current);
  }
  const categoryData = Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);

  const accountsFlowData = monthBills.map((bill) => ({
    name: bill.account!.name,
    planejado: Number(bill.plannedAmount),
    real: Number(bill.actualAmount ?? 0),
  }));

  const recentTransactions = [...monthExpenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, RECENT_TRANSACTIONS_LIMIT);

  function goalCardProps(key: "reserva_emergencia" | "aumento_renda", reserveType: string) {
    const goal = goalRows.find((row) => row.key === key);
    const target = goal ? Number(goal.targetAmount) : 0;
    const matching = reserveRows.filter((row) => row.type === reserveType);
    const reservedTotal = matching.reduce((sum, row) => sum + Number(row.amount), 0);
    const reservedThisMonth = matching
      .filter((row) => toMonth(row.date) === month)
      .reduce((sum, row) => sum + Number(row.amount), 0);
    return { target, reservedThisMonth, totalReserved: reservedTotal };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="Visão Geral"
        subtitle={`${monthLabelLong(month)} · conta compartilhada de Lisandro & Lety`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={PiggyBank}
          label="Reservas e investimentos"
          value={formatCurrency(totalReserved)}
          hint="total já reservado"
          color="#3B82F6"
        />
        <KpiCard
          icon={TrendingUp}
          label="Receitas do mês"
          value={formatCurrency(totalIncome)}
          color="#10B981"
        />
        <KpiCard
          icon={TrendingDown}
          label="Despesas do mês"
          value={formatCurrency(totalSpent)}
          hint="gastos fora do cartão + faturas"
          color="#F43F5E"
        />
        <KpiCard
          icon={Scale}
          label="Sobra do mês"
          value={formatCurrency(leftover)}
          hint={`taxa de poupança de ${savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
          color="#F59E0B"
          valueClassName={leftover < 0 ? "text-destructive" : ""}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Receitas × Despesas"
          subtitle={`Evolução dos últimos ${MONTHS_IN_CHART} meses`}
          className="lg:col-span-2"
        >
          <IncomeExpenseChart data={monthlySeries} />
        </Card>

        <Card title="Despesas por categoria" subtitle="Onde o mês foi embora">
          <CategoryAllocationChart data={categoryData} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Transações recentes"
          subtitle="Os últimos lançamentos da família"
          action={{ href: "/gastos", label: "Ver todas →" }}
          className="lg:col-span-2"
        >
          {recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum gasto neste mês.</p>
          ) : (
            <ul className="divide-y">
              {recentTransactions.map((expense) => {
                const installment =
                  expense.installmentTotal && expense.installmentNumber
                    ? ` (${expense.installmentNumber}/${expense.installmentTotal})`
                    : "";
                const bank = expense.account ? bankInfo(expense.account.bank) : null;
                return (
                  <li key={expense.id} className="flex items-center gap-3 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${expense.category.color}26`, color: expense.category.color }}
                    >
                      <ArrowDownRight size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {(expense.description || expense.category.name) + installment}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {expense.category.name} · {formatDate(expense.date)}
                      </p>
                    </div>
                    {bank && expense.account && (
                      <span
                        className="hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline"
                        style={{ color: bank.color, borderColor: `${bank.color}55`, backgroundColor: `${bank.color}14` }}
                      >
                        {expense.account.name}
                      </span>
                    )}
                    <span className="num shrink-0 text-sm font-semibold">
                      −{formatCurrency(Number(expense.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Metas & Sonhos"
          subtitle="O que vocês estão construindo"
          action={{ href: "/reservas", label: "Ver metas" }}
        >
          <div className="space-y-5">
            <GoalCard
              title="Reserva de emergência"
              {...goalCardProps("reserva_emergencia", RESERVE_TYPE_EMERGENCIA)}
            />
            <GoalCard title="Aumentar a renda" {...goalCardProps("aumento_renda", RESERVE_TYPE_RENDA)} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Gastos por cartão" subtitle="Cartões adicionais somam no titular">
          <CardSpendingChart data={cardSpendingData} />
        </Card>

        <Card title="Fluxo de contas" subtitle="Faturas e contas: planejado × real" className="lg:col-span-2">
          <AccountsFlowChart data={accountsFlowData} />
        </Card>
      </div>
    </main>
  );
}
