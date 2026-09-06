import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";
import { currentMonth } from "@/lib/month";
import { formatCurrency, formatDate } from "@/lib/format";
import { BankBadge } from "@/components/BankBadge";
import { BANK_OPTIONS } from "@/lib/banks";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { createAccount, upsertBill, markBillPaid, deleteBill } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();

  const [accountList, billList] = await Promise.all([
    db.query.accounts.findMany({ where: eq(accounts.archived, false) }),
    db.query.bills.findMany({
      where: eq(bills.month, month),
      with: { account: true },
    }),
  ]);

  const billedAccountIds = new Set(billList.map((b) => b.accountId));
  const accountsWithoutBill = accountList.filter((a) => !billedAccountIds.has(a.id));

  const totalPlanned = billList.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const totalActual = billList.reduce((s, b) => s + Number(b.actualAmount ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <MonthSwitcher month={month} basePath="/contas" />

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Contas &amp; cartões cadastrados</h2>
        <ul className="mb-4 flex flex-wrap gap-3">
          {accountList.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3 text-sm dark:border-white/10"
            >
              <BankBadge bank={a.bank} size={22} />
              {a.name}
              <span className="text-black/40 dark:text-white/40">
                ({a.type === "cartao" ? "cartão" : "conta"})
              </span>
            </li>
          ))}
          {accountList.length === 0 && (
            <li className="text-black/50 dark:text-white/50">Nenhuma conta cadastrada ainda.</li>
          )}
        </ul>

        <form action={createAccount} className="flex flex-wrap items-end gap-3">
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
            <label className="text-xs text-black/60 dark:text-white/60">Tipo</label>
            <select
              name="type"
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            >
              <option value="cartao">Cartão</option>
              <option value="conta">Conta</option>
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
          <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
            Cadastrar
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-3 font-semibold">Fatura do mês</h2>

        {accountsWithoutBill.length > 0 && (
          <form action={upsertBill} className="mb-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="month" value={month} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Conta/cartão</label>
              <select
                name="accountId"
                required
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                {accountsWithoutBill.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor planejado</label>
              <input
                name="plannedAmount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
              Lançar fatura
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left dark:bg-white/5">
              <tr>
                <th className="px-3 py-2">Conta</th>
                <th className="px-3 py-2">Planejado</th>
                <th className="px-3 py-2">Real</th>
                <th className="px-3 py-2">Pago em</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {billList.map((b) => (
                <tr key={b.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <BankBadge bank={b.account!.bank} size={20} />
                      {b.account!.name}
                    </div>
                  </td>
                  <td className="px-3 py-2">{formatCurrency(b.plannedAmount)}</td>
                  <td className="px-3 py-2">{b.actualAmount ? formatCurrency(b.actualAmount) : "-"}</td>
                  <td className="px-3 py-2">{b.paidAt ? formatDate(b.paidAt) : "-"}</td>
                  <td className="px-3 py-2">
                    {b.paid ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Pago
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                        Em aberto
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-3">
                      {!b.paid && (
                        <form action={markBillPaid} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={b.id} />
                          <input
                            name="actualAmount"
                            type="number"
                            step="0.01"
                            placeholder={Number(b.plannedAmount).toFixed(2)}
                            className="w-20 rounded-md border border-black/15 px-1.5 py-1 text-xs dark:border-white/20 dark:bg-transparent"
                          />
                          <input
                            name="paidAt"
                            type="date"
                            className="rounded-md border border-black/15 px-1.5 py-1 text-xs dark:border-white/20 dark:bg-transparent"
                          />
                          <button className="text-xs text-blue-600 hover:underline">marcar pago</button>
                        </form>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          await deleteBill(b.id);
                        }}
                      >
                        <button className="text-xs text-red-600 hover:underline">excluir</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {billList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                    Nenhuma fatura lançada nesse mês.
                  </td>
                </tr>
              )}
            </tbody>
            {billList.length > 0 && (
              <tfoot>
                <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2">{formatCurrency(totalPlanned)}</td>
                  <td className="px-3 py-2">{formatCurrency(totalActual)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </main>
  );
}
