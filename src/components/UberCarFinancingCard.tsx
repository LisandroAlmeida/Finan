"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { UberFinancingInstallmentRow } from "@/components/UberFinancingInstallmentRow";
import {
  financingInstallmentsTotal,
  financingProjectedTotal,
  financingEarlyPaymentSavings,
  installmentDueDate,
} from "@/app/uber/uber-shared";

type Financing = {
  id: string;
  description: string;
  carPrice: string | null;
  downPayment: string;
  installmentAmount: string;
  installmentCount: number;
  startDate: string;
  active: boolean;
};

type Payment = {
  id: string;
  date: string;
  amount: string;
  category: string;
  description: string | null;
  parcelaNumero: number | null;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-black/50 dark:text-white/50">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function UberCarFinancingCard({
  financing,
  payments,
  currentMonth,
  updateUberFinancing,
  deleteUberFinancing,
  payUberFinancingInstallment,
  updateUberExpense,
  deleteUberExpense,
}: {
  financing: Financing;
  /** Todos os pagamentos vinculados a esse financiamento (qualquer mês). */
  payments: Payment[];
  /** "YYYY-MM" do mês atual, só pra destacar a parcela correspondente. */
  currentMonth: string;
  updateUberFinancing: (formData: FormData) => Promise<void>;
  deleteUberFinancing: (id: string) => Promise<void>;
  payUberFinancingInstallment: (formData: FormData) => Promise<void>;
  updateUberExpense: (formData: FormData) => Promise<void>;
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

  const totalOriginal = financingInstallmentsTotal(financing);
  const projected = financingProjectedTotal(financing);
  const earlySavings = financingEarlyPaymentSavings(financing, payments);

  const paymentByParcela = new Map<number, Payment>();
  for (const p of payments) {
    if (p.parcelaNumero) paymentByParcela.set(p.parcelaNumero, p);
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
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
            <label className="text-xs text-black/60 dark:text-white/60">Valor original do carro (R$)</label>
            <input
              name="carPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={financing.carPrice ?? ""}
              className="w-32 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-black/60 dark:text-white/60">Entrada (R$)</label>
            <input
              name="downPayment"
              type="number"
              step="0.01"
              min="0"
              defaultValue={financing.downPayment}
              className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
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
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-black/10 p-4 dark:border-white/10 ${!financing.active ? "opacity-60" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">
          {financing.description}
          {!financing.active && <span className="ml-1 text-xs">(quitado/inativo)</span>}
        </h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
            editar
          </button>
          <ConfirmButton
            label="excluir"
            confirmMessage="Excluir esse financiamento? As parcelas já pagas continuam contando no Resumo/Dashboard. Essa ação não pode ser desfeita."
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        <Stat label="Valor original do carro" value={financing.carPrice ? formatCurrency(financing.carPrice) : "-"} />
        <Stat label="Entrada" value={formatCurrency(financing.downPayment)} />
        <Stat label="Qtd. de parcelas" value={String(financing.installmentCount)} />
        <Stat label="Valor original da parcela" value={formatCurrency(financing.installmentAmount)} />
        <Stat label="Total original das parcelas" value={formatCurrency(totalOriginal)} />
        <Stat label="Total projetado do carro" value={formatCurrency(projected)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-black/10 pt-3 text-sm dark:border-white/10">
        <span>
          Parcelas pagas: <strong>{payments.length}/{financing.installmentCount}</strong>
        </span>
        <span>
          Economizado pagando antecipado: <strong>{formatCurrency(earlySavings)}</strong>
        </span>
      </div>

      <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="sticky top-0 bg-black/5 text-left dark:bg-white/5">
            <tr>
              <th className="px-2 py-2">Parcela</th>
              <th className="px-2 py-2">Vencimento</th>
              <th className="px-2 py-2">Valor original</th>
              <th className="px-2 py-2">Valor pago</th>
              <th className="px-2 py-2">Data pagamento</th>
              <th className="px-2 py-2">Economia</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: financing.installmentCount }, (_, i) => i + 1).map((n) => {
              const vencimento = installmentDueDate(financing.startDate, n);
              return (
                <UberFinancingInstallmentRow
                  key={n}
                  financing={financing}
                  parcelaNumero={n}
                  vencimento={vencimento}
                  payment={paymentByParcela.get(n) ?? null}
                  isCurrentMonth={vencimento.slice(0, 7) === currentMonth}
                  payUberFinancingInstallment={payUberFinancingInstallment}
                  updateUberExpense={updateUberExpense}
                  deleteUberExpense={deleteUberExpense}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
