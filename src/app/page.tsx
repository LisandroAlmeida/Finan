import { and, eq, gte, lte } from "drizzle-orm";
import { ArrowDownRight, PiggyBank, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { incomes, expenses, bills, accounts, budgets } from "@/db/schema";
import { currentMonth, monthLabelLong, shiftMonth, toMonth } from "@/lib/month";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPeople } from "@/lib/people";
import { bankInfo } from "@/lib/banks";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { GoalCard } from "@/components/GoalCard";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryAllocationChart } from "@/components/charts/CategoryAllocationChart";
import { AccountsFlowChart } from "@/components/charts/AccountsFlowChart";
import { budgetBarColor } from "@/lib/budget";
import { CardSpendingChart } from "@/components/charts/CardSpendingChart";

export const dynamic = "force-dynamic";

const GOALS_ON_DASHBOARD = 3;
const BUDGETS_ON_DASHBOARD = 6;
const MONTHS_IN_CHART = 6;
const RECENT_TRANSACTIONS_LIMIT = 8;
const SHORT_MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const people = await getPeople();
  const month = sp.month ?? currentMonth();
  const chartMonths = Array.from({ length: MONTHS_IN_CHART }, (_, index) =>
    shiftMonth(month, index - (MONTHS_IN_CHART - 1)),
  );
  const firstChartMonth = chartMonths[0];

  const [incomeRows, expenseRows, billRows, reserveRows, goalRows, cardAccounts, budgetRows] = await Promise.all([
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
    db.query.savingsGoals.findMany({ orderBy: (table, { asc }) => asc(table.createdAt) }),
    db.query.accounts.findMany({ where: eq(accounts.type, "cartao") }),
    db.query.budgets.findMany({ where: eq(budgets.month, month), with: { category: true } }),
  ]);

  // Compra no cartão é lançada em Transações no mês da compra, mas o dinheiro só
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

  const goalCards = goalRows.slice(0, GOALS_ON_DASHBOARD).map((goal) => {
    const goalReserves = reserveRows.filter((row) => row.goalId === goal.id);
    return {
      id: goal.id,
      title: goal.name,
      target: Number(goal.targetAmount),
      totalReserved: goalReserves.reduce((sum, row) => sum + Number(row.amount), 0),
      reservedThisMonth: goalReserves
        .filter((row) => toMonth(row.date) === month)
        .reduce((sum, row) => sum + Number(row.amount), 0),
    };
  });

  const spentByCategory = new Map<string, number>();
  for (const expense of monthExpenses) {
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + Number(expense.amount));
  }
  const budgetUsage = budgetRows
    .map((budget) => {
      const limit = Number(budget.amount);
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      return { id: budget.id, name: budget.category.name, color: budget.category.color, limit, spent, ratio: limit ? spent / limit : 0 };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, BUDGETS_ON_DASHBOARD);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="Visão Geral"
        subtitle={`${monthLabelLong(month)} · conta compartilhada de ${people[0].label} & ${people[1].label}`}
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
          action={{ href: "/transacoes", label: "Ver todas →" }}
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
          action={{ href: "/metas", label: "Ver metas" }}
        >
          {goalCards.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma meta criada ainda.</p>
          ) : (
            <div className="space-y-5">
              {goalCards.map(({ id, ...goalProps }) => (
                <GoalCard key={id} {...goalProps} />
              ))}
            </div>
          )}
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

      <div className="mt-4">
        <Card
          title="Orçamentos"
          subtitle="Categorias mais perto do limite neste mês"
          action={{ href: "/orcamentos", label: "Ver orçamentos" }}
        >
          {budgetUsage.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum limite definido para este mês. Defina em Orçamentos.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              {budgetUsage.map((usage) => (
                <li key={usage.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: usage.color }} />
                      <span className="truncate font-medium">{usage.name}</span>
                    </span>
                    <span className="num shrink-0 text-xs text-muted-foreground">
                      {formatCurrency(usage.spent)} / {formatCurrency(usage.limit)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(usage.ratio, 1) * 100}%`, backgroundColor: budgetBarColor(usage.ratio) }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
