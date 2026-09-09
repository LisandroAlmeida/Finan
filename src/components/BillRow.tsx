"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { BankBadge } from "@/components/BankBadge";
import { ConfirmButton } from "@/components/ConfirmButton";

type Bill = {
  id: string;
  plannedAmount: string;
  actualAmount: string | null;
  paidAt: string | null;
  paid: boolean;
  account: { bank: string; name: string } | null;
};

export function BillRow({
  bill,
  redirectPath,
  updateBill,
  markBillPaid,
  deleteBill,
}: {
  bill: Bill;
  redirectPath: string;
  updateBill: (formData: FormData) => Promise<void>;
  markBillPaid: (formData: FormData) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateBill(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteBill(bill.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={6} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={bill.id} />
            <input type="hidden" name="redirectPath" value={redirectPath} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Planejado</label>
              <input
                name="plannedAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={bill.plannedAmount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Real</label>
              <input
                name="actualAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={bill.actualAmount ?? ""}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Pago em</label>
              <input
                name="paidAt"
                type="date"
                defaultValue={bill.paidAt ?? ""}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <label className="flex items-center gap-1.5 pb-2 text-sm">
              <input name="paid" type="checkbox" defaultChecked={bill.paid} /> Pago
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-black/10 dark:border-white/10">
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <BankBadge bank={bill.account!.bank} size={18} />
          <span className="text-foreground">{bill.account!.name}</span>
        </div>
      </td>
      <td className="px-2 py-2">{formatCurrency(bill.plannedAmount)}</td>
      <td className="px-2 py-2">{bill.actualAmount ? formatCurrency(bill.actualAmount) : "-"}</td>
      <td className="px-2 py-2">{bill.paidAt ? formatDate(bill.paidAt) : "-"}</td>
      <td className="px-2 py-2">
        {bill.paid ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            Pago
          </span>
        ) : (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
            Em aberto
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {!bill.paid && (
            <form action={markBillPaid}>
              <input type="hidden" name="id" value={bill.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />
              {/* Usa o valor planejado e a data de hoje como padrão — pra um valor
                  ou data diferente, "editar" cobre o mesmo caso com mais controle. */}
              <input type="hidden" name="actualAmount" value={bill.plannedAmount} />
              <input type="hidden" name="paidAt" value={new Date().toISOString().slice(0, 10)} />
              <button className="text-xs text-blue-600 hover:underline">marcar pago</button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            editar
          </button>
          <ConfirmButton
            label="excluir"
            confirmMessage="Excluir essa fatura? Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
