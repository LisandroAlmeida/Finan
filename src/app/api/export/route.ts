import { db } from "@/db";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Exporta todas as transações (despesas e receitas) em CSV, aberto direto no Excel. */
export async function GET() {
  const [expenseRows, incomeRows] = await Promise.all([
    db.query.expenses.findMany({ with: { category: true, account: true } }),
    db.query.incomes.findMany({ with: { category: true, account: true } }),
  ]);

  const header = ["Tipo", "Data", "Mês", "Descrição", "Categoria", "Conta/Forma", "Quem", "Valor"];
  const lines = [
    ...expenseRows.map((row) => [
      "Despesa", row.date, row.month, row.description ?? "", row.category.name, row.account?.name ?? "", row.paidBy ?? "", row.amount,
    ]),
    ...incomeRows.map((row) => [
      "Receita", row.date ?? "", row.month, row.description, row.category?.name ?? "", row.account?.name ?? "", row.paidBy ?? "", row.amount,
    ]),
  ]
    .sort((a, b) => String(b[2]).localeCompare(String(a[2])) || String(b[1]).localeCompare(String(a[1])))
    .map((cells) => cells.map(csvCell).join(";"));

  const body = "﻿" + [header.join(";"), ...lines].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finan-transacoes.csv"',
    },
  });
}
