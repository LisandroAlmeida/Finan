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

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [accountList, billList] = await Promise.all([
    db.query.accounts.findMany({ where: and(eq(accounts.archived, false), eq(accounts.type, "conta")) }),
    db.query.bills.findMany({
      where: eq(bills.month, month),
      with: { account: true },
    }),
  ]);

  const contaBills = billList.filter((b) => b.account?.type === "conta");
  const billedAccountIds = new Set(contaBills.map((b) => b.accountId));
  const accountsWithoutBill = accountList.filter((a) => !billedAccountIds.has(a.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/contas" />

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Contas cadastradas</h2>

        {accountList.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {accountList.map((a) => (
              <AccountItem key={a.id} account={a} updateAccount={updateAccount} deleteAccount={deleteAccount} />
            ))}
          </div>
        )}

        {accountList.length === 0 && (
          <p className="mb-4 text-black/50 dark:text-white/50">Nenhuma conta cadastrada ainda.</p>
        )}

        <form action={createAccount} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="conta" />
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Internet Mãe"
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
            <label className="text-xs text-black/60 dark:text-white/60">Forma de pagamento</label>
            <select
              name="paymentMethod"
              defaultValue="boleto"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              <option value="boleto">Boleto</option>
              <option value="pix">Pix</option>
            </select>
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Cadastrar
          </button>
        </form>
      </section>

      <BillSection
        month={month}
        redirectPath="/contas"
        accountsWithoutBill={accountsWithoutBill}
        billList={contaBills}
      />
    </main>
  );
}
