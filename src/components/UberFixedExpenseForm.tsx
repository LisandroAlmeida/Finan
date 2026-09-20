"use client";

import { useState } from "react";
import { UBER_CATEGORY_LABELS, UBER_FIXED_EXPENSE_CATEGORIES } from "@/app/uber/uber-shared";

export function UberFixedExpenseForm({
  createUberFixedExpense,
}: {
  createUberFixedExpense: (formData: FormData) => Promise<void>;
}) {
  const [parcelado, setParcelado] = useState(false);

  return (
    <form action={createUberFixedExpense} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-black/60 dark:text-white/60">Descrição</label>
        <input
          name="description"
          required
          placeholder="Seguro do carro, Revisão..."
          className="w-44 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
        <select
          name="category"
          defaultValue="manutencao"
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
        <label className="text-xs text-black/60 dark:text-white/60">Valor {parcelado ? "da parcela" : "mensal"} (R$)</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
        />
      </div>
      <label className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
        <input type="checkbox" checked={parcelado} onChange={(e) => setParcelado(e.target.checked)} />
        Parcelada (nº fixo de vezes)
      </label>
      {parcelado && (
        <>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Nº de parcelas</label>
            <input
              name="installmentCount"
              type="number"
              min="1"
              required
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Início (1ª parcela)</label>
            <input
              name="installmentStartDate"
              type="date"
              required
              className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
        </>
      )}
      <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-700">
        Adicionar
      </button>
    </form>
  );
}
