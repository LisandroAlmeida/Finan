import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, accounts } from "@/db/schema";
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

export default async function AssinaturasPage() {
  const [subscriptionListRaw, categoryListRaw, accountList] = await Promise.all([
    db.query.subscriptions.findMany({
      where: eq(subscriptions.active, true),
      with: { category: true, account: true },
    }),
    db.query.categories.findMany(),
    db.query.accounts.findMany({ where: eq(accounts.archived, false) }),
  ]);

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
      <section className="mt-4 rounded-2xl border bg-card p-4 text-center">
        <h2 className="font-semibold text-muted-foreground">Total mensal equivalente</h2>
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
