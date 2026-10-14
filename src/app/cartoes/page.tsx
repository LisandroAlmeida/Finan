import { PageHeader } from "@/components/PageHeader";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";
import { currentMonth, monthLabelLong } from "@/lib/month";
import { CardGroup } from "@/components/CardGroup";
import { BANK_OPTIONS } from "@/lib/banks";
import { EXPIRY_MONTHS, expiryYearOptions } from "@/lib/cardExpiry";
import { BillSection } from "@/components/BillSection";
import { createAccount, updateAccount, deleteAccount } from "@/lib/accounts-actions";

export const dynamic = "force-dynamic";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [accountList, billList] = await Promise.all([
    db.query.accounts.findMany({ where: and(eq(accounts.archived, false), eq(accounts.type, "cartao")) }),
    db.query.bills.findMany({
      where: eq(bills.month, month),
      with: { account: true },
    }),
  ]);

  // Cartões adicionais (parentAccountId preenchido) compartilham UMA fatura só
  // com o titular — a lista pra "Fatura do mês" e o form de vínculo só
  // conhecem cartões titulares (sem parentAccountId).
  const topLevelAccounts = accountList.filter((a) => !a.parentAccountId);
  const childrenByParent = new Map<string, typeof accountList>();
  for (const a of accountList) {
    if (a.parentAccountId) {
      childrenByParent.set(a.parentAccountId, [...(childrenByParent.get(a.parentAccountId) ?? []), a]);
    }
  }
  const cardBills = billList.filter((b) => b.account?.type === "cartao");
  const billedAccountIds = new Set(cardBills.map((b) => b.accountId));
  const accountsWithoutBill = topLevelAccounts.filter((a) => !billedAccountIds.has(a.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Cartões" subtitle={`${monthLabelLong(month)} · faturas, parcelas e cartões adicionais`} />

      <section className="mt-4 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Cartões cadastrados</h2>

        {accountList.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topLevelAccounts.map((a) => (
              <CardGroup
                key={a.id}
                parent={a}
                additionalCards={childrenByParent.get(a.id) ?? []}
                cardOptions={topLevelAccounts.filter((o) => o.id !== a.id)}
                updateAccount={updateAccount}
                deleteAccount={deleteAccount}
              />
            ))}
          </div>
        )}

        {accountList.length === 0 && (
          <p className="mb-4 text-muted-foreground">Nenhum cartão cadastrado ainda.</p>
        )}

        <form action={createAccount} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="cartao" />
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Nubank"
              className="rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Banco</label>
            <select
              name="bank"
              className="rounded-lg border px-2 py-1.5"
            >
              {BANK_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Dia vencimento</label>
            <input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              className="w-24 rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Cartão adicional de</label>
            <select
              name="parentAccountId"
              className="w-40 rounded-lg border px-2 py-1.5"
            >
              <option value="">Titular</option>
              {topLevelAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Últimos 4 dígitos</label>
            <input
              name="lastFourDigits"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{0,4}"
              placeholder="0000"
              className="w-20 rounded-lg border px-2 py-1.5"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Validade</label>
            <div className="flex items-center gap-1">
              <select
                name="expiryMonth"
                className="rounded-lg border px-2 py-1.5"
              >
                <option value="">MM</option>
                {EXPIRY_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="text-foreground/50">/</span>
              <select
                name="expiryYear"
                className="rounded-lg border px-2 py-1.5"
              >
                <option value="">AA</option>
                {expiryYearOptions().map((y) => (
                  <option key={y} value={y}>
                    {String(y).slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="rounded-lg bg-primary px-4 py-1.5 text-white hover:brightness-110">
            Cadastrar
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Marque <strong>&quot;Cartão adicional de&quot;</strong> quando esse cartão fizer parte da
          mesma fatura de outro (ex: cartões adicionais da família no Bradesco) — a fatura do mês
          passa a ser lançada só no titular, como uma linha só, mesmo com vários cartões usando
          ela. Como o dia de fechamento muda de mês a mês, a fatura de cada gasto não é calculada
          automaticamente aqui — na hora de lançar o gasto (em Transações), marque a caixinha{" "}
          <strong>&quot;Cai na fatura seguinte&quot;</strong> quando a compra tiver sido feita
          depois do fechamento daquele mês. Clique no cartão titular pra ver ou ocultar os
          adicionais vinculados a ele.
        </p>
      </section>

      <BillSection
        month={month}
        redirectPath="/cartoes"
        accountsWithoutBill={accountsWithoutBill}
        billList={cardBills}
      />
    </main>
  );
}
