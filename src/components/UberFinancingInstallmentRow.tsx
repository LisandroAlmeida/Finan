"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";

type Financing = {
  id: string;
  description: string;
  installmentAmount: string;
  installmentCount: number;
};

type Payment = {
  id: string;
  date: string;
  amount: string;
  category: string;
  description: string | null;
};

export function UberFinancingInstallmentRow({
  financing,
  parcelaNumero,
  vencimento,
  payment,
  isCurrentMonth,
  payUberFinancingInstallment,
  updateUberExpense,
  deleteUberExpense,
}: {
  financing: Financing;
  parcelaNumero: number;
  /** YYYY-MM-DD */
  vencimento: string;
  payment: Payment | null;
  isCurrentMonth: boolean;
  payUberFinancingInstallment: (formData: FormData) => Promise<void>;
  updateUberExpense: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const original = Number(financing.installmentAmount);
  const economia = payment ? Math.max(0, original - Number(payment.amount)) : 0;

  const handlePay = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("financingId", financing.id);
      fd.set("month", vencimento);
      fd.set("description", `${financing.description} (${parcelaNumero}/${financing.installmentCount})`);
      fd.set("amount", financing.installmentAmount);
      fd.set("parcelaNumero", String(parcelaNumero));
      await payUberFinancingInstallment(fd);
    });
  };

  const handleUndo = () => {
    if (!payment) return;
    startTransition(async () => {
      await deleteUberExpense(payment.id);
    });
  };

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateUberExpense(formData);
      setEditing(false);
    });
  };

  const rowClass = `border-t border-black/10 dark:border-white/10 ${
    isCurrentMonth ? "bg-blue-600/5" : ""
  }`;

  if (editing && payment) {
    return (
      <tr className={rowClass}>
        <td className="px-2 py-1.5">{parcelaNumero}</td>
        <td className="px-2 py-1.5">{formatDate(vencimento)}</td>
        <td className="px-2 py-1.5">{formatCurrency(financing.installmentAmount)}</td>
        <td colSpan={5} className="px-2 py-1.5">
          <form action={handleSave} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={payment.id} />
            <input type="hidden" name="category" value={payment.category} />
            <input type="hidden" name="description" value={payment.description ?? ""} />
            <input
              name="date"
              type="date"
              required
              defaultValue={payment.date}
              className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20 dark:bg-transparent"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={payment.amount}
              className="w-24 rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20 dark:bg-transparent"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={rowClass}>
      <td className="px-2 py-1.5">{parcelaNumero}</td>
      <td className="px-2 py-1.5">{formatDate(vencimento)}</td>
      <td className="px-2 py-1.5">{formatCurrency(financing.installmentAmount)}</td>
      <td className="px-2 py-1.5">{payment ? formatCurrency(payment.amount) : "-"}</td>
      <td className="px-2 py-1.5">{payment ? formatDate(payment.date) : "-"}</td>
      <td className="px-2 py-1.5">{economia > 0 ? formatCurrency(economia) : "-"}</td>
      <td className="px-2 py-1.5">
        {payment ? (
          <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
            Pago
          </span>
        ) : (
          <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
            Pendente
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-right">
        {payment ? (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
              editar
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={pending}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              desfazer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePay}
            disabled={pending}
            className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-600/25 disabled:opacity-50 dark:text-amber-400"
          >
            marcar pago
          </button>
        )}
      </td>
    </tr>
  );
}
