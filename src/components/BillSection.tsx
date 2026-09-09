import { formatCurrency } from "@/lib/format";
import { upsertBill, updateBill, markBillPaid, deleteBill } from "@/lib/accounts-actions";
import { BillRow } from "@/components/BillRow";

type AccountOption = { id: string; name: string };

type Bill = {
  id: string;
  plannedAmount: string;
  actualAmount: string | null;
  paidAt: string | null;
  paid: boolean;
  account: { bank: string; name: string } | null;
};

export function BillSection({
  month,
  redirectPath,
  accountsWithoutBill,
  billList,
}: {
  month: string;
  redirectPath: string;
  accountsWithoutBill: AccountOption[];
  billList: Bill[];
}) {
  const totalPlanned = billList.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const totalActual = billList.reduce((s, b) => s + Number(b.actualAmount ?? 0), 0);

  return (
    <section className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <h2 className="mb-3 font-semibold">Fatura do mês</h2>

      {accountsWithoutBill.length > 0 && (
        <form action={upsertBill} className="mb-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
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
              <th className="px-2 py-2">Conta</th>
              <th className="px-2 py-2">Planejado</th>
              <th className="px-2 py-2">Real</th>
              <th className="px-2 py-2">Pago em</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {billList.map((b) => (
              <BillRow
                key={b.id}
                bill={b}
                redirectPath={redirectPath}
                updateBill={updateBill}
                markBillPaid={markBillPaid}
                deleteBill={deleteBill}
              />
            ))}
            {billList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-black/50 dark:text-white/50">
                  Nenhuma fatura lançada nesse mês.
                </td>
              </tr>
            )}
          </tbody>
          {billList.length > 0 && (
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/10">
                <td className="px-2 py-2">Total</td>
                <td className="px-2 py-2">{formatCurrency(totalPlanned)}</td>
                <td className="px-2 py-2">{formatCurrency(totalActual)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
