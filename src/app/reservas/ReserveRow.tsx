"use client";

import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatCurrency, formatDate } from "@/lib/format";

type Reserve = { id: string; name: string; type: string; amount: string; date: string };

export function ReserveRow({
  reserve,
  typeSuggestions,
  updateReserve,
  deleteReserve,
}: {
  reserve: Reserve;
  typeSuggestions: string[];
  updateReserve: (formData: FormData) => Promise<void>;
  deleteReserve: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateReserve(formData);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteReserve(reserve.id);
    });
  };

  if (editing) {
    const datalistId = `reserve-type-suggestions-${reserve.id}`;
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={5} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={reserve.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
              <input
                name="name"
                required
                defaultValue={reserve.name}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Tipo</label>
              <input
                name="type"
                required
                list={datalistId}
                defaultValue={reserve.type}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
              <datalist id={datalistId}>
                {typeSuggestions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Valor (R$)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={reserve.amount}
                className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Data</label>
              <input
                name="date"
                type="date"
                required
                defaultValue={reserve.date}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
      <td className="px-3 py-2">{reserve.name}</td>
      <td className="px-3 py-2">{reserve.type}</td>
      <td className="px-3 py-2">{formatCurrency(reserve.amount)}</td>
      <td className="px-3 py-2">{formatDate(reserve.date)}</td>
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
            confirmMessage={`Excluir "${reserve.name}"? Essa ação não pode ser desfeita.`}
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
