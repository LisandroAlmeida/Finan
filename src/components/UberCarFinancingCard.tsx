"use client";

import { useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { financingInstallmentsTotal, financingProjectedTotal } from "@/app/uber/uber-shared";

type Financing = {
  id: string;
  description: string;
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
  installmentNumber,
  payment,
  paidCount,
  earlySavings,
  month,
  updateUberFinancing,
  deleteUberFinancing,
  payUberFinancingInstallment,
  updateUberExpense,
  deleteUberExpense,
}: {
  financing: Financing;
  /** null = mês fora do intervalo (ainda não começou ou já quitado). */
  installmentNumber: number | null;
  payment: Payment | null;
  paidCount: number;
  earlySavings: number;
  month: string;
  updateUberFinancing: (formData: FormData) => Promise<void>;
  deleteUberFinancing: (id: string) => Promise<void>;
  payUberFinancingInstallment: (formData: FormData) => Promise<void>;
  updateUberExpense: (formData: FormData) => Promise<void>;
  deleteUberExpense: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
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

  const handleSavePayment = (formData: FormData) => {
    startTransition(async () => {
      await updateUberExpense(formData);
      setEditingPayment(false);
    });
  };

  const totalOriginal = financingInstallmentsTotal(financing);
  const projected = financingProjectedTotal(financing);

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <Stat label="Entrada" value={formatCurrency(financing.downPayment)} />
        <Stat label="Qtd. de parcelas" value={String(financing.installmentCount)} />
        <Stat label="Valor original da parcela" value={formatCurrency(financing.installmentAmount)} />
        <Stat label="Total original das parcelas" value={formatCurrency(totalOriginal)} />
        <Stat label="Total projetado do carro" value={formatCurrency(projected)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-black/10 pt-3 text-sm dark:border-white/10">
        <span>
          Parcelas pagas: <strong>{paidCount}/{financing.installmentCount}</strong>
        </span>
        <span>
          Economizado pagando antecipado: <strong>{formatCurrency(earlySavings)}</strong>
        </span>
      </div>

      <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
        {payment ? (
          editingPayment ? (
            <form action={handleSavePayment} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={payment.id} />
              <input type="hidden" name="category" value={payment.category} />
              <input type="hidden" name="description" value={payment.description ?? ""} />
              <div className="flex flex-col">
                <label className="text-xs text-black/60 dark:text-white/60">Data do pagamento</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={payment.date}
                  className="rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-black/60 dark:text-white/60">Valor pago (R$)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={payment.amount}
                  className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditingPayment(false)}
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">
                Parcela {installmentNumber}/{financing.installmentCount} deste mês:
              </span>
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
        ) : installmentNumber ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">
              Parcela {installmentNumber}/{financing.installmentCount} deste mês:
            </span>
            <button
              type="button"
              onClick={handlePay}
              disabled={pending}
              className="rounded-full bg-amber-600/15 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-600/25 disabled:opacity-50 dark:text-amber-400"
            >
              Pendente — marcar como pago
            </button>
          </div>
        ) : (
          <span className="text-xs text-black/40 dark:text-white/40">
            {financing.active ? "Fora do período deste financiamento neste mês." : "Financiamento quitado."}
          </span>
        )}
      </div>
    </div>
  );
}
