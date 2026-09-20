"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";

type FuelExpense = {
  id: string;
  date: string;
  description: string | null;
  amount: string;
  kmAbastecimento: number | null;
  litrosAbastecidos: string | null;
};

export function UberFuelRow({
  expense,
  kmPorLitro,
  valorPorKm,
  updateUberExpense,
  deleteUberExpense,
}: {
  expense: FuelExpense;
  kmPorLitro: number | null;
  valorPorKm: number | null;
  updateUberExpense: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateUberExpense(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUberExpense(expense.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={8} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={expense.id} />
            <input type="hidden" name="category" value="combustivel" />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Data</label>
              <input
                name="date"
                type="date"
                required
                defaultValue={expense.date}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
              <input
                name="description"
                defaultValue={expense.description ?? ""}
                placeholder="Gasolina, Etanol..."
                className="w-36 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
                defaultValue={expense.amount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Km abastecimento</label>
              <input
                name="kmAbastecimento"
                type="number"
                min="0"
                defaultValue={expense.kmAbastecimento ?? ""}
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Litros (L)</label>
              <input
                name="litrosAbastecidos"
                type="number"
                step="0.01"
                min="0"
                defaultValue={expense.litrosAbastecidos ?? ""}
                className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
      <td className="px-2 py-2">{formatDate(expense.date)}</td>
      <td className="px-2 py-2">{expense.description ?? "-"}</td>
      <td className="px-2 py-2">{formatCurrency(expense.amount)}</td>
      <td className="px-2 py-2">{expense.kmAbastecimento ?? "-"}</td>
      <td className="px-2 py-2">{expense.litrosAbastecidos ?? "-"}</td>
      <td className="px-2 py-2">{kmPorLitro != null ? kmPorLitro.toFixed(2) : "-"}</td>
      <td className="px-2 py-2">{valorPorKm != null ? formatCurrency(valorPorKm) : "-"}</td>
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
            confirmMessage="Excluir esse abastecimento? Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
