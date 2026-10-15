import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { db } from "@/db";
import { accounts, expenses, incomes } from "@/db/schema";
import { currentMonth, monthLabelLong } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/Card";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { ghostButtonClass, inputClass } from "@/components/ui";
import { getPeople } from "@/lib/people";
import { createExpense, deleteExpense, updateExpense } from "@/app/gastos/actions";
import { createIncome, deleteIncome, updateIncome } from "@/app/entradas/actions";
import { TransactionsClient, type TransactionItem } from "./TransactionsClient";

export const dynamic = "force-dynamic";

type TypeFilter = "todas" | "despesa" | "receita";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tipo?: string; cat?: string; quem?: string; novo?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ?? currentMonth();
  const typeFilter: TypeFilter =
    params.tipo === "despesa" || params.tipo === "receita" ? params.tipo : "todas";
  const categoryFilter = params.cat ?? "";
  const personFilter = params.quem ?? "";

  const [people, expenseRows, incomeRows, categoryList, accountList] = await Promise.all([
    getPeople(),
    db.query.expenses.findMany({ where: eq(expenses.month, month), with: { category: true, account: true } }),
    db.query.incomes.findMany({ where: eq(incomes.month, month), with: { category: true, account: true } }),
    db.query.categories.findMany({ orderBy: (table, { asc }) => asc(table.name) }),
    db.query.accounts.findMany({ where: eq(accounts.archived, false) }),
  ]);

  const allItems: TransactionItem[] = [
    ...expenseRows.map((row): TransactionItem => ({
      id: row.id,
      kind: "despesa",
      description: row.description || row.category.name,
      amount: Number(row.amount),
      date: row.date,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      categoryColor: row.category.color,
      accountId: row.accountId,
      accountName: row.account?.name ?? null,
      paidBy: row.paidBy,
      essential: row.essential,
      isSubscription: row.isSubscription,
      installmentLabel:
        row.installmentTotal && row.installmentNumber
          ? ` (${row.installmentNumber}/${row.installmentTotal})`
          : "",
    })),
    ...incomeRows.map((row): TransactionItem => ({
      id: row.id,
      kind: "receita",
      description: row.description,
      amount: Number(row.amount),
      date: row.date,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
      categoryColor: row.category?.color ?? null,
      accountId: row.accountId,
      accountName: row.account?.name ?? null,
      paidBy: row.paidBy,
      essential: false,
      isSubscription: false,
      installmentLabel: "",
    })),
  ];

  const totalIncome = allItems.filter((item) => item.kind === "receita").reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = allItems.filter((item) => item.kind === "despesa").reduce((sum, item) => sum + item.amount, 0);

  const visibleItems = allItems
    .filter((item) => typeFilter === "todas" || item.kind === typeFilter)
    .filter((item) => !categoryFilter || item.categoryId === categoryFilter)
    .filter((item) => !personFilter || item.paidBy === personFilter)
    .sort((a, b) => (b.date ?? `${month}`).localeCompare(a.date ?? `${month}`));

  const baseQuery = (overrides: Record<string, string>) => {
    const query = new URLSearchParams({ month });
    const merged: Record<string, string> = { tipo: typeFilter, cat: categoryFilter, quem: personFilter, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "todas") query.set(key, value);
    }
    return `/transacoes?${query.toString()}`;
  };

  const typeTabs: { value: TypeFilter; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "despesa", label: "Despesas" },
    { value: "receita", label: "Receitas" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Transações" subtitle={`${monthLabelLong(month)} · receitas e despesas da família`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={ArrowUpRight} label="Receitas" value={formatCurrency(totalIncome)} color="#10B981" />
        <KpiCard
          icon={ArrowDownRight}
          label="Despesas lançadas"
          value={formatCurrency(totalExpense)}
          hint="inclui compras no cartão"
          color="#F43F5E"
        />
        <KpiCard
          icon={Scale}
          label="Saldo"
          value={formatCurrency(totalIncome - totalExpense)}
          color="#F59E0B"
          valueClassName={totalIncome - totalExpense < 0 ? "text-destructive" : ""}
        />
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 rounded-full border bg-background p-1">
            {typeTabs.map((tab) => (
              <Link
                key={tab.value}
                href={baseQuery({ tipo: tab.value })}
                prefetch={false}
                className={`rounded-full px-3.5 py-1 text-sm transition-colors ${
                  typeFilter === tab.value
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <form action="/transacoes" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="month" value={month} />
            {typeFilter !== "todas" && <input type="hidden" name="tipo" value={typeFilter} />}
            <select name="cat" defaultValue={categoryFilter} className={`${inputClass} !h-9 !w-44`}>
              <option value="">Todas as categorias</option>
              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="quem" defaultValue={personFilter} className={`${inputClass} !h-9 !w-36`}>
              <option value="">Todos</option>
              {people.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit" className={`${ghostButtonClass} !h-9`}>
              Filtrar
            </button>
          </form>
        </div>

        <TransactionsClient
          items={visibleItems}
          categories={categoryList.map((category) => ({ id: category.id, name: category.name, kind: category.kind }))}
          accounts={accountList.map((account) => ({ id: account.id, name: account.name }))}
          people={people}
          openNewOnLoad={params.novo === "1"}
          actions={{ createExpense, updateExpense, deleteExpense, createIncome, updateIncome, deleteIncome }}
        />
      </Card>
    </main>
  );
}
