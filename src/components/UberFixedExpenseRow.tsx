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
  installmentCount: number | null;
  installmentStartDate: string | null;
};

type Payment = {
  id: string;
  date: string;
  amount: string;
  category: string;
  description: string | null;
};

export function UberFixedExpenseRow({
  fixedExpense,
  installmentNumber,
  payment,
  month,
  updateUberFixedExpense,
  deleteUberFixedExpense,
  payUberFixedExpense,
  updateUberExpense,
  deleteUberExpense,
}: {
  fixedExpense: FixedExpense;
  /** null quando não é parcelada, ou quando é parcelada mas o mês está fora
   * do intervalo (ainda não começou ou já quitada). */
  installmentNumber: number | null;
  payment: Payment | null;
  month: string;
  updateUberFixedExpense: (formData: FormData) => Promise<void>;
  deleteUberFixedExpense: (id: string) => Promise<void>;
  payUberFixedExpense: (formData: FormData) => Promise<void>;
  updateUberExpense: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [parcelado, setParcelado] = useState(!!fixedExpense.installmentCount);
  const [editingPayment, setEditingPayment] = useState(false);
  const [pending, startTransition] = useTransition();

  const isParcelada = !!fixedExpense.installmentCount;

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
      fd.set(
        "description",
        isParcelada && installmentNumber
          ? `${fixedExpense.description} (${installmentNumber}/${fixedExpense.installmentCount})`
          : fixedExpense.description,
      );
      fd.set("category", fixedExpense.category);
      fd.set("amount", fixedExpense.amount);
      if (installmentNumber) fd.set("parcelaNumero", String(installmentNumber));
      await payUberFixedExpense(fd);
    });
  };

  const handleUndoPay = () => {
    if (!payment) return;
    startTransition(async () => {
      await deleteUberExpense(payment.id);
    });
  };

  const handleSavePayment = (formData: FormData) => {
    startTransition(async () => {
      await updateUberExpense(formData);
      setEditingPayment(false);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={6} className="px-3 py-3">
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
            <label className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
              <input
                type="checkbox"
                checked={parcelado}
                onChange={(e) => setParcelado(e.target.checked)}
              />
              Parcelada
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
                    defaultValue={fixedExpense.installmentCount ?? ""}
                    className="w-24 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-black/60 dark:text-white/60">Início (1ª parcela)</label>
                  <input
                    name="installmentStartDate"
                    type="date"
                    required
                    defaultValue={fixedExpense.installmentStartDate ?? ""}
                    className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
                  />
                </div>
              </>
            )}
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
      <td className="px-2 py-2">
        {isParcelada ? `${installmentNumber ?? "-"}/${fixedExpense.installmentCount}` : "-"}
      </td>
      <td className="px-2 py-2">{formatCurrency(fixedExpense.amount)}</td>
      <td className="px-2 py-2">
        {payment ? (
          editingPayment ? (
            <form action={handleSavePayment} className="flex flex-wrap items-end gap-2">
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
                onClick={() => setEditingPayment(false)}
                className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                Pago em {formatDate(payment.date)} — {formatCurrency(payment.amount)}
              </span>
              <button
                type="button"
                onClick={() => setEditingPayment(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                editar
              </button>
              <button
                type="button"
                onClick={handleUndoPay}
                disabled={pending}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                desfazer
              </button>
            </div>
          )
        ) : fixedExpense.active && (!isParcelada || installmentNumber) ? (
          <button
            type="button"
            onClick={handlePay}
            disabled={pending}
            className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-600/25 disabled:opacity-50 dark:text-amber-400"
          >
            Pendente — marcar como pago
          </button>
        ) : isParcelada ? (
          <span className="text-xs text-black/40 dark:text-white/40">
            {fixedExpense.active ? "fora do período" : "quitada"}
          </span>
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
            confirmMessage="Excluir essa despesa fixa? Os pagamentos já lançados continuam contando no Resumo/Dashboard. Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
