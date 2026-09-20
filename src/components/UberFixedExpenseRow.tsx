"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { UBER_CATEGORY_LABELS, UBER_FIXED_EXPENSE_CATEGORIES } from "@/app/uber/uber-shared";

type FixedExpense = {
  id: string;
  description: string;
  category: string;
  amount: string;
  active: boolean;
};

type Payment = {
  id: string;
  date: string;
  amount: string;
};

export function UberFixedExpenseRow({
  fixedExpense,
  payment,
  month,
  updateUberFixedExpense,
  deleteUberFixedExpense,
  payUberFixedExpense,
  deleteUberExpense,
}: {
  fixedExpense: FixedExpense;
  payment: Payment | null;
  month: string;
  updateUberFixedExpense: (formData: FormData) => Promise<void>;
  deleteUberFixedExpense: (id: string) => Promise<void>;
  payUberFixedExpense: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateUberFixedExpense(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUberFixedExpense(fixedExpense.id);
    });
  };

  const handlePay = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("fixedExpenseId", fixedExpense.id);
      fd.set("month", month);
      fd.set("description", fixedExpense.description);
      fd.set("category", fixedExpense.category);
      fd.set("amount", fixedExpense.amount);
      await payUberFixedExpense(fd);
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
        <td colSpan={5} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={fixedExpense.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
              <input
                name="description"
                required
                defaultValue={fixedExpense.description}
                className="w-44 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
              <select
                name="category"
                defaultValue={fixedExpense.category}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                {UBER_FIXED_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {UBER_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={fixedExpense.amount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
              <input type="checkbox" name="active" defaultChecked={fixedExpense.active} />
              Ativa
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
    <tr className={`border-t border-black/10 dark:border-white/10 ${!fixedExpense.active ? "opacity-50" : ""}`}>
      <td className="px-2 py-2">
        {fixedExpense.description}
        {!fixedExpense.active && <span className="ml-1 text-xs">(inativa)</span>}
      </td>
      <td className="px-2 py-2">{UBER_CATEGORY_LABELS[fixedExpense.category] ?? fixedExpense.category}</td>
      <td className="px-2 py-2">{formatCurrency(fixedExpense.amount)}</td>
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
        ) : fixedExpense.active ? (
          <button
            type="button"
            onClick={handlePay}
            disabled={pending}
            className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-600/25 disabled:opacity-50 dark:text-amber-400"
          >
            Pendente — marcar como pago
          </button>
        ) : (
          <span className="text-xs text-black/40 dark:text-white/40">-</span>
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
            confirmMessage="Excluir essa despesa fixa? Os pagamentos já lançados continuam em Lançamentos. Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
