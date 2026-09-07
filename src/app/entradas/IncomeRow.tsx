"use client";

import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatCurrency } from "@/lib/format";

type Income = { id: string; description: string; amount: string };

export function IncomeRow({
  income,
  percentage,
  updateIncome,
  deleteIncome,
}: {
  income: Income;
  percentage: string;
  updateIncome: (formData: FormData) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateIncome(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteIncome(income.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={4} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={income.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
              <input
                name="description"
                required
                defaultValue={income.description}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={income.amount}
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
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
      <td className="px-3 py-2">{income.description}</td>
      <td className="px-3 py-2">{formatCurrency(income.amount)}</td>
      <td className="px-3 py-2">{percentage}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            editar
          </button>
          <ConfirmButton
            label="excluir"
            confirmMessage="Excluir essa entrada? Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
