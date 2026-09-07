import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { expenses, accounts } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { ExpenseRow } from "./ExpenseRow";
import { createExpense, updateExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [rows, categoryList, accountList] = await Promise.all([
    db.query.expenses.findMany({
      where: eq(expenses.month, month),
      orderBy: desc(expenses.date),
      with: { category: true, account: true },
    }),
    db.query.categories.findMany(),
    db.query.accounts.findMany({ where: eq(accounts.archived, false) }),
  ]);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const essentialTotal = rows.filter((r) => r.essential).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/gastos" />

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Novo gasto</h2>
        <form action={createExpense} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
            <input
              name="description"
              placeholder="opcional"
              className="w-40 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">
              Categoria{" "}
              <Link href="/categorias" className="text-blue-600 hover:underline">
                (+ nova)
              </Link>
            </label>
            <select
              name="categoryId"
              required
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Forma de pagamento</label>
            <select
              name="accountId"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              <option value="">-</option>
              {accountList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Valor total (R$)</label>
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
            <label className="text-xs text-black/60 dark:text-white/60">Parcelas</label>
            <input
              name="installments"
              type="number"
              min="1"
              defaultValue={1}
              className="w-16 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-sm">
            <input name="essential" type="checkbox" /> Essencial
          </label>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Adicionar
          </button>
        </form>
        <p className="mt-2 text-xs text-black/50 dark:text-white/50">
          Em compras parceladas, informe o valor total da compra — o app divide e lança uma parcela em
          cada mês automaticamente. Se a forma de pagamento for um cartão com{" "}
          <strong>dia de fechamento</strong> cadastrado (em Cartões), o gasto já entra direto na
          fatura correta, mesmo que isso não seja o mesmo mês da data digitada.
        </p>
      </section>

      <section className="mt-6 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Forma</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Essencial</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <ExpenseRow
                key={r.id}
                expense={r}
                categoryList={categoryList}
                accountList={accountList}
                updateExpense={updateExpense}
                deleteExpense={deleteExpense}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhum gasto lançado nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td className="px-3 py-2" colSpan={3}>
                  Total ({formatCurrency(essentialTotal)} essencial)
                </td>
                <td className="px-3 py-2">{formatCurrency(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </section>
    </main>
  );
}
