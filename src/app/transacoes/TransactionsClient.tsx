"use client";

import { useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  ghostButtonClass,
  iconButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAID_BY_OPTIONS } from "@/lib/people";

export type TransactionKind = "despesa" | "receita";

export type TransactionItem = {
  id: string;
  kind: TransactionKind;
  description: string;
  amount: number;
  /** "YYYY-MM-DD" ou null (entradas antigas não têm data). */
  date: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string | null;
  accountName: string | null;
  paidBy: string | null;
  essential: boolean;
  installmentLabel: string;
};

export type CategoryOption = { id: string; name: string; kind: TransactionKind };
export type AccountOption = { id: string; name: string };

type ServerAction = (formData: FormData) => Promise<void>;

export function TransactionsClient({
  items,
  categories,
  accounts,
  openNewOnLoad,
  actions,
}: {
  items: TransactionItem[];
  categories: CategoryOption[];
  accounts: AccountOption[];
  openNewOnLoad: boolean;
  actions: {
    createExpense: ServerAction;
    updateExpense: ServerAction;
    deleteExpense: (id: string) => Promise<void>;
    createIncome: ServerAction;
    updateIncome: ServerAction;
    deleteIncome: (id: string) => Promise<void>;
  };
}) {
  const [formState, setFormState] = useState<
    { mode: "new" } | { mode: "edit"; item: TransactionItem } | null
  >(openNewOnLoad ? { mode: "new" } : null);
  const [isPending, startTransition] = useTransition();

  function deleteItem(item: TransactionItem) {
    if (!window.confirm(`Excluir "${item.description}"?`)) return;
    startTransition(async () => {
      if (item.kind === "despesa") await actions.deleteExpense(item.id);
      else await actions.deleteIncome(item.id);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setFormState({ mode: "new" })} className={primaryButtonClass}>
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhuma transação encontrada neste mês.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => {
            const isIncome = item.kind === "receita";
            const person = PAID_BY_OPTIONS.find((option) => option.value === item.paidBy);
            const color = item.categoryColor ?? (isIncome ? "#10B981" : "#F43F5E");
            return (
              <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}26`, color }}
                >
                  {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.description}
                    {item.installmentLabel}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[
                      item.categoryName,
                      item.date ? formatDate(item.date) : null,
                      item.accountName,
                      item.essential ? "essencial" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {person && (
                  <span
                    className="hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline"
                    style={{
                      color: person.color,
                      borderColor: `${person.color}55`,
                      backgroundColor: `${person.color}14`,
                    }}
                  >
                    {person.label}
                  </span>
                )}
                <span
                  className={`num shrink-0 text-sm font-semibold ${isIncome ? "text-emerald-500" : ""}`}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </span>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-label="Editar"
                    onClick={() => setFormState({ mode: "edit", item })}
                    className={iconButtonClass}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir"
                    disabled={isPending}
                    onClick={() => deleteItem(item)}
                    className={`${iconButtonClass} hover:text-destructive`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formState && (
        <TransactionModal
          key={formState.mode === "edit" ? formState.item.id : "new"}
          editing={formState.mode === "edit" ? formState.item : null}
          categories={categories}
          accounts={accounts}
          actions={actions}
          onClose={() => setFormState(null)}
        />
      )}
    </>
  );
}

function TransactionModal({
  editing,
  categories,
  accounts,
  actions,
  onClose,
}: {
  editing: TransactionItem | null;
  categories: CategoryOption[];
  accounts: AccountOption[];
  actions: {
    createExpense: ServerAction;
    updateExpense: ServerAction;
    createIncome: ServerAction;
    updateIncome: ServerAction;
  };
  onClose: () => void;
}) {
  const [kind, setKind] = useState<TransactionKind>(editing?.kind ?? "despesa");
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const isExpense = kind === "despesa";
  const kindCategories = categories.filter((category) => category.kind === kind);

  function submit(formData: FormData) {
    const action = editing
      ? isExpense
        ? actions.updateExpense
        : actions.updateIncome
      : isExpense
        ? actions.createExpense
        : actions.createIncome;
    startTransition(async () => {
      await action(formData);
      onClose();
    });
  }

  return (
    <Modal title={editing ? "Editar transação" : "Nova transação"} onClose={onClose}>
      <form action={submit} className="space-y-4">
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="grid grid-cols-2 gap-1 rounded-full border bg-background p-1">
          {(["despesa", "receita"] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={Boolean(editing)}
              onClick={() => setKind(option)}
              className={`rounded-full py-1.5 text-sm transition-colors disabled:cursor-default ${
                kind === option
                  ? option === "despesa"
                    ? "bg-rose-500/15 font-medium text-rose-500"
                    : "bg-emerald-500/15 font-medium text-emerald-500"
                  : "text-muted-foreground"
              }`}
            >
              {option === "despesa" ? "Despesa" : "Receita"}
            </button>
          ))}
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <input
            name="description"
            required={!isExpense}
            defaultValue={editing?.description ?? ""}
            placeholder={isExpense ? "opcional" : "Ex.: Salário"}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{isExpense && !editing ? "Valor total (R$)" : "Valor (R$)"}</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={editing?.amount}
              className={`${inputClass} num`}
            />
          </div>
          <div>
            <label className={labelClass}>Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={editing?.date ?? today}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Categoria</label>
            <select
              name="categoryId"
              required={isExpense}
              defaultValue={editing?.categoryId ?? ""}
              className={inputClass}
            >
              {!isExpense && <option value="">—</option>}
              {kindCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{isExpense ? "Forma de pagamento" : "Conta"}</label>
            <select name="accountId" defaultValue={editing?.accountId ?? ""} className={inputClass}>
              <option value="">—</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>{isExpense ? "Quem pagou" : "Quem recebeu"}</label>
          <div className="grid grid-cols-4 gap-2">
            {[{ value: "", label: "—", color: "#71717A" }, ...PAID_BY_OPTIONS].map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="paidBy"
                  value={option.value}
                  defaultChecked={(editing?.paidBy ?? "") === option.value}
                  className="peer sr-only"
                />
                <span
                  className="flex h-10 items-center justify-center rounded-xl border text-sm text-muted-foreground transition-colors peer-checked:border-[var(--chip)] peer-checked:bg-[color-mix(in_srgb,var(--chip)_15%,transparent)] peer-checked:font-medium peer-checked:text-foreground"
                  style={{ ["--chip" as string]: option.color }}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {isExpense && (
          <div className="space-y-3">
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Parcelas</label>
                  <input
                    name="installments"
                    type="number"
                    min="1"
                    defaultValue={1}
                    className={`${inputClass} num`}
                  />
                </div>
                <label className="flex items-end gap-2 pb-2.5 text-sm">
                  <input name="nextInvoice" type="checkbox" className="h-4 w-4 accent-[var(--primary)]" />
                  Cai na fatura seguinte
                </label>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                name="essential"
                type="checkbox"
                defaultChecked={editing?.essential}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Gasto essencial
            </label>
            {!editing && (
              <p className="text-[11px] text-muted-foreground">
                Em compras parceladas, informe o valor total: o app divide e lança uma parcela por mês.
                &quot;Cai na fatura seguinte&quot; vale para compras feitas depois do fechamento do cartão.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={primaryButtonClass}>
            {isPending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
