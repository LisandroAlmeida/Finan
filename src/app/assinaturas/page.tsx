import Link from "next/link";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, accounts, expenses, incomes } from "@/db/schema";
import { currentMonth, monthLabelLong, shiftMonth } from "@/lib/month";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency } from "@/lib/format";
import { nextOccurrence } from "@/lib/subscriptionCycle";
import { SubscriptionRow } from "./SubscriptionRow";
import { createSubscription, updateSubscription, deactivateSubscription, deleteSubscription } from "./actions";

export const dynamic = "force-dynamic";

// "Assinaturas" como categoria da própria assinatura é redundante (o registro já
// está na tela de Assinaturas) — some ela da lista, mas mantém categorias mais
// específicas (ex: "Plano Telefone") pra quem quiser classificar melhor.
const REDUNDANT_CATEGORY = /assinatura/i;

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();
  const historyStartMonth = shiftMonth(month, -5);

  const [subscriptionListRaw, categoryListRaw, accountList, flaggedExpenseRows, monthIncomeRows] = await Promise.all([
    db.query.subscriptions.findMany({
      where: eq(subscriptions.active, true),
      with: { category: true, account: true },
    }),
    db.query.categories.findMany(),
    db.query.accounts.findMany({ where: eq(accounts.archived, false) }),
    // Compras marcadas como "Assinatura / recorrente" em Transações (últimos 6 meses).
    db.query.expenses.findMany({
      where: and(eq(expenses.isSubscription, true), gte(expenses.month, historyStartMonth), lte(expenses.month, month)),
      with: { account: true },
    }),
    db.query.incomes.findMany({ where: eq(incomes.month, month) }),
  ]);

  const flaggedThisMonth = flaggedExpenseRows.filter((row) => row.month === month);
  const flaggedMonthTotal = flaggedThisMonth.reduce((sum, row) => sum + Number(row.amount), 0);
  const monthIncomeTotal = monthIncomeRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const flaggedShareOfIncome = monthIncomeTotal > 0 ? (flaggedMonthTotal / monthIncomeTotal) * 100 : 0;

  const flaggedTotalByAccountName = new Map<string, number>();
  for (const row of flaggedThisMonth) {
    const accountName = row.account?.name ?? "Sem forma de pagamento";
    flaggedTotalByAccountName.set(accountName, (flaggedTotalByAccountName.get(accountName) ?? 0) + Number(row.amount));
  }

  const monthHistory = Array.from({ length: 6 }, (_, offset) => {
    const historyMonth = shiftMonth(month, offset - 5);
    const total = flaggedExpenseRows
      .filter((row) => row.month === historyMonth)
      .reduce((sum, row) => sum + Number(row.amount), 0);
    return { historyMonth, total };
  });
  const highestHistoryTotal = Math.max(...monthHistory.map((entry) => entry.total), 1);

  const categoryList = categoryListRaw.filter((c) => c.kind === "despesa" && !REDUNDANT_CATEGORY.test(c.name));

  // A "próxima cobrança" é calculada a partir da data salva + o ciclo, sempre
  // rolando pra frente até cair hoje ou no futuro — não precisa editar isso
  // toda vez que fecha um mês.
  const subscriptionList = subscriptionListRaw
    .map((s) => ({ ...s, nextChargeDate: nextOccurrence(s.nextChargeDate, s.billingCycle) }))
    .sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate));

  const totalMonthly = subscriptionList.reduce((s, sub) => {
    const amount = Number(sub.amount);
    return s + (sub.billingCycle === "anual" ? amount / 12 : amount);
  }, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Assinaturas" subtitle={"Serviços recorrentes da casa"} />
      <section className="mt-4 rounded-2xl border bg-card p-4">
        <h2 className="font-semibold">Assinaturas nas compras — {monthLabelLong(month)}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Soma das compras marcadas como <strong>Assinatura / recorrente</strong> em Transações. Elas
          continuam contando normalmente como despesa; aqui é só o painel.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total no mês</p>
            <p className="text-2xl font-bold">{formatCurrency(flaggedMonthTotal)}</p>
            <p className="text-xs text-muted-foreground">{flaggedThisMonth.length} lançamento(s)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">% da receita do mês</p>
            <p className="text-2xl font-bold">{flaggedShareOfIncome.toFixed(1).replace(".", ",")}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Por forma de pagamento</p>
            {[...flaggedTotalByAccountName.entries()].map(([accountName, total]) => (
              <p key={accountName} className="text-sm">
                {accountName}: <span className="font-medium">{formatCurrency(total)}</span>
              </p>
            ))}
            {flaggedTotalByAccountName.size === 0 && (
              <p className="text-sm text-muted-foreground">Nada marcado neste mês ainda.</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-end gap-2">
          {monthHistory.map((entry) => (
            <div key={entry.historyMonth} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{formatCurrency(entry.total)}</span>
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${Math.max(4, (entry.total / highestHistoryTotal) * 64)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{entry.historyMonth.slice(5, 7)}/{entry.historyMonth.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-4 text-center">
        <h2 className="font-semibold text-muted-foreground">Total mensal equivalente (cadastradas)</h2>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(totalMonthly)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Assinaturas anuais entram divididas por 12 nesse total.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Nova assinatura</h2>
        <form action={createSubscription} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Netflix"
              className="rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">
              Categoria{" "}
              <Link href="/configuracoes" className="text-primary hover:underline">
                (+ nova)
              </Link>
            </label>
            <select
              name="categoryId"
              className="rounded-lg border px-2 py-1.5"
            >
              <option value="">-</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Forma de pagamento</label>
            <select
              name="accountId"
              className="rounded-lg border px-2 py-1.5"
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
            <label className="text-xs text-muted-foreground">Valor (R$)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-28 rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Ciclo</label>
            <select
              name="billingCycle"
              className="rounded-lg border px-2 py-1.5"
            >
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Próxima cobrança</label>
            <input
              name="nextChargeDate"
              type="date"
              required
              className="rounded-lg border px-2 py-1.5"
            />
          </div>
          <button className="rounded-lg bg-primary px-4 py-1.5 text-white hover:brightness-110">
            Cadastrar
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Depois de cadastrada, a <strong>próxima cobrança</strong> é recalculada sozinha a partir
          dessa data e do ciclo — não precisa entrar aqui todo mês só pra atualizar a data.
        </p>
      </section>

      <section className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Forma</th>
              <th className="px-3 py-2">Valor</th>
              <th className="px-3 py-2">Ciclo</th>
              <th className="px-3 py-2">Próxima cobrança</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {subscriptionList.map((s) => (
              <SubscriptionRow
                key={s.id}
                subscription={s}
                categoryList={categoryList}
                accountList={accountList}
                updateSubscription={updateSubscription}
                deactivateSubscription={deactivateSubscription}
                deleteSubscription={deleteSubscription}
              />
            ))}
            {subscriptionList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma assinatura cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
