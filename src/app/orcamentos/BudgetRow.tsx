"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { iconButtonClass } from "@/components/ui";
import { budgetBarColor } from "@/lib/budget";

export function BudgetRow({
  categoryId,
  categoryName,
  categoryColor,
  month,
  budgetAmount,
  spentAmount,
  saveBudget,
}: {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  month: string;
  budgetAmount: number;
  spentAmount: number;
  saveBudget: (formData: FormData) => Promise<void>;
}) {
  const [draftAmount, setDraftAmount] = useState(budgetAmount ? String(budgetAmount) : "");
  const [isPending, startTransition] = useTransition();
  const hasBudget = budgetAmount > 0;
  const ratio = hasBudget ? spentAmount / budgetAmount : 0;
  const isDirty = Number(draftAmount || 0) !== budgetAmount;

  return (
    <li className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: categoryColor }} />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{categoryName}</p>
        <form
          action={(formData) => startTransition(() => saveBudget(formData))}
          className="flex items-center gap-1"
        >
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="month" value={month} />
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="Limite"
            value={draftAmount}
            onChange={(event) => setDraftAmount(event.target.value)}
            className="num h-8 w-28 rounded-lg border bg-background px-2 text-right text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isPending || !isDirty}
            aria-label="Salvar limite"
            className={`${iconButtonClass} ${isDirty ? "text-primary" : ""}`}
          >
            <Check size={16} />
          </button>
        </form>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${hasBudget ? Math.min(ratio, 1) * 100 : 0}%`,
            backgroundColor: budgetBarColor(ratio),
          }}
        />
      </div>
      <p className="num mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>
          {formatCurrency(spentAmount)} gastos
          {hasBudget && ` · ${Math.round(ratio * 100)}%`}
        </span>
        <span className={hasBudget && ratio > 1 ? "text-destructive" : ""}>
          {hasBudget
            ? ratio > 1
              ? `${formatCurrency(spentAmount - budgetAmount)} acima`
              : `${formatCurrency(budgetAmount - spentAmount)} disponível`
            : "sem limite"}
        </span>
      </p>
    </li>
  );
}
