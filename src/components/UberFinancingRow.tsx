"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";

type Financing = {
  id: string;
  description: string;
  installmentAmount: string;
  installmentCount: number;
  startDate: string;
  active: boolean;
};

type Payment = {
  id: string;
  date: string;
  amount: string;
};

export function UberFinancingRow({
  financing,
  installmentNumber,
  payment,
  month,
  updateUberFinancing,
  deleteUberFinancing,
  payUberFinancingInstallment,
  deleteUberExpense,
}: {
  financing: Financing;
  /** null = mês fora do intervalo do financiamento (ainda não começou ou já quitado) */
  installmentNumber: number | null;
  payment: Payment | null;
  month: string;
  updateUberFinancing: (formData: FormData) => Promise<void>;
  deleteUberFinancing: (id: string) => Promise<void>;
  payUberFinancingInstallment: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateUberFinancing(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUberFinancing(financing.id);
    });
  };

  const handlePay = () => {
    if (!installmentNumber) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("financingId", financing.id);
      fd.set("month", month);
      fd.set("description", `${financing.description} (${installmentNumber}/${financing.installmentCount})`);
      fd.set("amount", financing.installmentAmount);
      fd.set("parcelaNumero", String(installmentNumber));
      await payUberFinancingInstallment(fd);
    });
  };

  const handleUndoPay = () => {
    if (!payment) return;
    startTransition(async () => {
      await deleteUberExpense(payment.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={6} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={financing.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
              <input
                name="description"
                required
                defaultValue={financing.description}
                className="w-44 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor da parcela (R$)</label>
              <input
                name="installmentAmount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={financing.installmentAmount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Nº de parcelas</label>
              <input
                name="installmentCount"
                type="number"
                min="1"
                required
                defaultValue={financing.installmentCount}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Início (1ª parcela)</label>
              <input
                name="startDate"
                type="date"
                required
                defaultValue={financing.startDate}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
              <input type="checkbox" name="active" defaultChecked={financing.active} />
              Ativo
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
    <tr className={`border-t border-black/10 dark:border-white/10 ${!financing.active ? "opacity-50" : ""}`}>
      <td className="px-2 py-2">
        {financing.description}
        {!financing.active && <span className="ml-1 text-xs">(inativo)</span>}
      </td>
      <td className="px-2 py-2">
        {installmentNumber ? `${installmentNumber}/${financing.installmentCount}` : "-"}
      </td>
      <td className="px-2 py-2">{formatCurrency(financing.installmentAmount)}</td>
      <td className="px-2 py-2">
        {payment ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              Pago em {formatDate(payment.date)}
            </span>
            <button
              type="button"
              onClick={handleUndoPay}
              disabled={pending}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              desfazer
            </button>
          </div>
        ) : installmentNumber ? (
          <button
            type="button"
            onClick={handlePay}
            disabled={pending}
            className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-600/25 disabled:opacity-50 dark:text-amber-400"
          >
            Pendente — marcar como pago
          </button>
        ) : (
          <span className="text-xs text-black/40 dark:text-white/40">
            {financing.active ? "fora do período" : "quitado"}
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            editar
          </button>
          <ConfirmButton
            label="excluir"
            confirmMessage="Excluir esse financiamento? As parcelas já pagas continuam em Lançamentos. Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
