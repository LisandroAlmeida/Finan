"use client";

import { useState, useTransition } from "react";
import { BankBadge } from "@/components/BankBadge";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatCurrency, formatDate } from "@/lib/format";

type Category = { id: string; name: string; color: string };
type Account = { id: string; name: string; bank: string };
type Subscription = {
  id: string;
  name: string;
  amount: string;
  billingCycle: "mensal" | "anual";
  nextChargeDate: string;
  category: Category | null;
  account: Account | null;
};

export function SubscriptionRow({
  subscription,
  categoryList,
  accountList,
  updateSubscription,
  deactivateSubscription,
  deleteSubscription,
}: {
  subscription: Subscription;
  categoryList: Category[];
  accountList: Account[];
  updateSubscription: (formData: FormData) => Promise<void>;
  deactivateSubscription: (id: string) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSave = (formData: FormData) => {
    startTransition(async () => {
      await updateSubscription(formData);
      setEditing(false);
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      await deactivateSubscription(subscription.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSubscription(subscription.id);
    });
  };

  if (editing) {
    return (
      <tr className="border-t border-black/10 dark:border-white/10">
        <td colSpan={7} className="px-3 py-3">
          <form action={handleSave} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={subscription.id} />
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Nome</label>
              <input
                name="name"
                required
                defaultValue={subscription.name}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Categoria</label>
              <select
                name="categoryId"
                defaultValue={subscription.category?.id ?? ""}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                <option value="">-</option>
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Forma de pagamento</label>
              <select
                name="accountId"
                defaultValue={subscription.account?.id ?? ""}
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
                defaultValue={subscription.amount}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Ciclo</label>
              <select
                name="billingCycle"
                defaultValue={subscription.billingCycle}
                className="rounded-md border border-black/15 px-2 py-1.5 dark:border-white/20 dark:bg-transparent"
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-black/60 dark:text-white/60">Próxima cobrança</label>
              <input
                name="nextChargeDate"
                type="date"
                required
                defaultValue={subscription.nextChargeDate}
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
      <td className="px-3 py-2">{subscription.name}</td>
      <td className="px-3 py-2">
        {subscription.category ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: subscription.category.color }}
          >
            {subscription.category.name}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2">
        {subscription.account ? (
          <div className="flex items-center gap-2">
            <BankBadge bank={subscription.account.bank} size={18} /> {subscription.account.name}
          </div>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2">{formatCurrency(subscription.amount)}</td>
      <td className="px-3 py-2">{subscription.billingCycle === "anual" ? "Anual" : "Mensal"}</td>
      <td className="px-3 py-2">{formatDate(subscription.nextChargeDate)}</td>
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
            label="desativar"
            confirmMessage={`Desativar a assinatura "${subscription.name}"?`}
            pending={pending}
            onConfirm={handleDeactivate}
            className="text-xs text-yellow-600 hover:underline"
          />
          <ConfirmButton
            label="excluir"
            confirmMessage={`Excluir a assinatura "${subscription.name}"? Essa ação não pode ser desfeita.`}
            pending={pending}
            onConfirm={handleDelete}
            className="text-xs text-red-600 hover:underline"
          />
        </div>
      </td>
    </tr>
  );
}
