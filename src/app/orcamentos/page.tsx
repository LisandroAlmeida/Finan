import { eq } from "drizzle-orm";
import { Gauge, PiggyBank, Wallet } from "lucide-react";
import { db } from "@/db";
import { budgets, expenses } from "@/db/schema";
import { currentMonth, monthLabelLong } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { ghostButtonClass } from "@/components/ui";
import { BudgetRow } from "./BudgetRow";
import { copyBudgetsFromPreviousMonth, saveBudget } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();

  const [categoryList, budgetRows, expenseRows] = await Promise.all([
    db.query.categories.findMany({
      where: (table, { eq: equals }) => equals(table.kind, "despesa"),
      orderBy: (table, { asc }) => asc(table.name),
    }),
    db.query.budgets.findMany({ where: eq(budgets.month, month) }),
    db.query.expenses.findMany({ where: eq(expenses.month, month) }),
  ]);

  const budgetByCategory = new Map(budgetRows.map((row) => [row.categoryId, Number(row.amount)]));
  const spentByCategory = new Map<string, number>();
  for (const expense of expenseRows) {
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + Number(expense.amount));
  }

  const rows = categoryList
    .map((category) => ({
      category,
      budgetAmount: budgetByCategory.get(category.id) ?? 0,
      spentAmount: spentByCategory.get(category.id) ?? 0,
    }))
    // Mais "estouradas" no topo; categorias sem limite ficam no fim, ordenadas pelo gasto.
    .sort((a, b) => {
      const ratioOf = (row: typeof a) => (row.budgetAmount ? row.spentAmount / row.budgetAmount : -1);
      return ratioOf(b) - ratioOf(a) || b.spentAmount - a.spentAmount;
    });

  const totalBudget = rows.reduce((sum, row) => sum + row.budgetAmount, 0);
  const totalSpentInBudgeted = rows
    .filter((row) => row.budgetAmount > 0)
    .reduce((sum, row) => sum + row.spentAmount, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        title="Orçamentos"
        subtitle={`${monthLabelLong(month)} · limite mensal por categoria`}
        action={
          <form action={copyBudgetsFromPreviousMonth}>
            <input type="hidden" name="month" value={month} />
            <button type="submit" className={ghostButtonClass}>
              Copiar do mês anterior
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Wallet} label="Total orçado" value={formatCurrency(totalBudget)} color="#3B82F6" />
        <KpiCard
          icon={Gauge}
          label="Gasto nas categorias com limite"
          value={formatCurrency(totalSpentInBudgeted)}
          hint={totalBudget ? `${Math.round((totalSpentInBudgeted / totalBudget) * 100)}% do orçamento` : undefined}
          color="#F59E0B"
        />
        <KpiCard
          icon={PiggyBank}
          label="Disponível"
          value={formatCurrency(totalBudget - totalSpentInBudgeted)}
          color="#10B981"
          valueClassName={totalBudget - totalSpentInBudgeted < 0 ? "text-destructive" : ""}
        />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <BudgetRow
            key={row.category.id}
            categoryId={row.category.id}
            categoryName={row.category.name}
            categoryColor={row.category.color}
            month={month}
            budgetAmount={row.budgetAmount}
            spentAmount={row.spentAmount}
            saveBudget={saveBudget}
          />
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        O gasto considera tudo que foi lançado na categoria no mês, inclusive compras no cartão. Limite
        vazio ou zero remove o orçamento daquela categoria.
      </p>
    </main>
  );
}
