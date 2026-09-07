import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { AccountItem } from "@/components/AccountItem";
import { BANK_OPTIONS } from "@/lib/banks";
import { MonthSwitcher } from "@/components/MonthSwitcher";
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

  const cardBills = billList.filter((b) => b.account?.type === "cartao");
  const billedAccountIds = new Set(cardBills.map((b) => b.accountId));
  const accountsWithoutBill = accountList.filter((a) => !billedAccountIds.has(a.id));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/cartoes" />

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Cartões cadastrados</h2>

        {accountList.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountList.map((a) => (
              <AccountItem key={a.id} account={a} updateAccount={updateAccount} deleteAccount={deleteAccount} />
            ))}
          </div>
        )}

        {accountList.length === 0 && (
          <p className="mb-4 text-black/50 dark:text-white/50">Nenhum cartão cadastrado ainda.</p>
        )}

        <form action={createAccount} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="cartao" />
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Nubank"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Banco</label>
            <select
              name="bank"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              {BANK_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Dia vencimento</label>
            <input
              name="dueDay"
              type="number"
              min="1"
              max="31"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Últimos 4 dígitos</label>
            <input
              name="lastFourDigits"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{0,4}"
              placeholder="0000"
              className="w-20 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Validade</label>
            <input
              name="expiry"
              type="month"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Cadastrar
          </button>
        </form>
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
