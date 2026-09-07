"use client";

import { useState, useTransition } from "react";
import { BankBadge } from "@/components/BankBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatCurrency, formatDate } from "@/lib/format";

type Category = { id: string; name: string; color: string };
type Account = { id: string; name: string; bank: string };
type Expense = {
  id: string;
  description: string | null;
  amount: string;
  date: string;
  essential: boolean;
  installmentNumber: number | null;
  installmentTotal: number | null;
  category: Category;
  account: Account | null;
};

export function ExpenseRow({
  expense,
  categoryList,
  accountList,
  updateExpense,
  deleteExpense,
}: {
  expense: Expense;
  categoryList: Category[];
  accountList: Account[];
  updateExpense: (formData: FormData) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateExpense(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteExpense(expense.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={7} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={expense.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
              <select
                name="categoryId"
                required
                defaultValue={expense.category.id}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
              <input
                name="description"
                defaultValue={expense.description ?? ""}
                placeholder="opcional"
                className="w-40 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Forma de pagamento</label>
              <select
                name="accountId"
                defaultValue={expense.account?.id ?? ""}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                <option value="">-</option>
                {accountList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
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
                defaultValue={expense.amount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
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
            <label className="flex items-center gap-1.5 pb-2 text-sm">
              <input name="essential" type="checkbox" defaultChecked={expense.essential} /> Essencial
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
      <td className="px-3 py-2">
        <span
          className="rounded-full px-2 py-0.5 text-xs text-white"
          style={{ backgroundColor: expense.category.color }}
        >
          {expense.category.name}
        </span>
      </td>
      <td className="px-3 py-2">
        {expense.description ?? "-"}
        {expense.installmentTotal && expense.installmentTotal > 1 && (
          <span className="ml-1 text-xs text-black/40 dark:text-white/40">
            ({expense.installmentNumber}/{expense.installmentTotal})
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {expense.account ? (
          <div className="flex items-center gap-2">
            <BankBadge bank={expense.account.bank} size={18} /> {expense.account.name}
          </div>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2">{formatCurrency(expense.amount)}</td>
      <td className="px-3 py-2">{formatDate(expense.date)}</td>
      <td className="px-3 py-2">{expense.essential ? "✔" : ""}</td>
      <td className="px-3 py-2">
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
            confirmMessage="Excluir esse gasto? Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
