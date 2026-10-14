"use client";

import { useState, useTransition } from "react";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  ghostButtonClass,
  iconButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";

export type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  savedThisMonth: number;
  deadline: string | null;
  color: string;
  /** Quanto guardar por mês até o prazo (null quando não há prazo futuro ou a meta já foi batida). */
  monthlyNeeded: number | null;
};

export type ContributionItem = {
  id: string;
  goalId: string | null;
  goalName: string;
  goalColor: string;
  note: string;
  amount: number;
  date: string;
};

type ServerAction = (formData: FormData) => Promise<void>;

const GOAL_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#F43F5E", "#06B6D4"];

type DialogState =
  | { type: "goal"; goal: GoalItem | null }
  | { type: "contribution"; contribution: ContributionItem | null; goalId: string | null }
  | null;

export function MetasClient({
  goals,
  contributions,
  actions,
}: {
  goals: GoalItem[];
  contributions: ContributionItem[];
  actions: {
    saveGoal: ServerAction;
    deleteGoal: (id: string) => Promise<void>;
    saveContribution: ServerAction;
    deleteContribution: (id: string) => Promise<void>;
  };
}) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isPending, startTransition] = useTransition();

  function confirmAndRun(message: string, run: () => Promise<void>) {
    if (window.confirm(message)) startTransition(run);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setDialog({ type: "contribution", contribution: null, goalId: null })}
          className={ghostButtonClass}
        >
          <PiggyBank size={16} /> Registrar aporte
        </button>
        <button type="button" onClick={() => setDialog({ type: "goal", goal: null })} className={primaryButtonClass}>
          <Plus size={16} /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="rounded-2xl border bg-card py-10 text-center text-sm text-muted-foreground">
          Nenhuma meta ainda. Crie a primeira em &quot;Nova meta&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const ratio = goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0;
            return (
              <section key={goal.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold">{goal.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : "Sem prazo definido"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Editar meta"
                    onClick={() => setDialog({ type: "goal", goal })}
                    className={iconButtonClass}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir meta"
                    disabled={isPending}
                    onClick={() =>
                      confirmAndRun(
                        `Excluir a meta "${goal.name}"? Os aportes continuam no histórico, como "Sem meta".`,
                        () => actions.deleteGoal(goal.id),
                      )
                    }
                    className={`${iconButtonClass} hover:text-destructive`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="num mt-4 text-2xl font-bold tracking-tight">{formatCurrency(goal.savedAmount)}</p>
                <p className="num text-xs text-muted-foreground">de {formatCurrency(goal.targetAmount)}</p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: goal.color }}
                  />
                </div>
                <p className="num mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{Math.round(ratio * 100)}% concluído</span>
                  <span>
                    {goal.savedThisMonth > 0 ? `+${formatCurrency(goal.savedThisMonth)} neste mês` : "sem aporte neste mês"}
                  </span>
                </p>
                {goal.monthlyNeeded !== null && (
                  <p className="num mt-1 text-[11px] text-muted-foreground">
                    Para chegar no prazo: {formatCurrency(goal.monthlyNeeded)} por mês
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setDialog({ type: "contribution", contribution: null, goalId: goal.id })}
                  className={`${ghostButtonClass} mt-4 w-full`}
                >
                  <PiggyBank size={16} /> Registrar aporte
                </button>
              </section>
            );
          })}
        </div>
      )}

      <section className="mt-4 rounded-2xl border bg-card p-5">
        <header className="mb-4">
          <h2 className="text-[15px] font-semibold leading-tight">Histórico de aportes</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Tudo que já foi guardado, do mais recente ao mais antigo</p>
        </header>
        {contributions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum aporte registrado.</p>
        ) : (
          <ul className="divide-y">
            {contributions.map((contribution) => (
              <li key={contribution.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${contribution.goalColor}26`, color: contribution.goalColor }}
                >
                  <PiggyBank size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{contribution.note}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {contribution.goalName} · {formatDate(contribution.date)}
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-semibold text-emerald-500">
                  +{formatCurrency(contribution.amount)}
                </span>
                <button
                  type="button"
                  aria-label="Editar aporte"
                  onClick={() => setDialog({ type: "contribution", contribution, goalId: contribution.goalId })}
                  className={iconButtonClass}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Excluir aporte"
                  disabled={isPending}
                  onClick={() => confirmAndRun(`Excluir o aporte "${contribution.note}"?`, () => actions.deleteContribution(contribution.id))}
                  className={`${iconButtonClass} hover:text-destructive`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dialog?.type === "goal" && (
        <GoalModal goal={dialog.goal} saveGoal={actions.saveGoal} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "contribution" && (
        <ContributionModal
          contribution={dialog.contribution}
          initialGoalId={dialog.goalId}
          goals={goals}
          saveContribution={actions.saveContribution}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

function GoalModal({
  goal,
  saveGoal,
  onClose,
}: {
  goal: GoalItem | null;
  saveGoal: ServerAction;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);

  return (
    <Modal title={goal ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <form
        action={(formData) =>
          startTransition(async () => {
            await saveGoal(formData);
            onClose();
          })
        }
        className="space-y-4"
      >
        {goal && <input type="hidden" name="id" value={goal.id} />}
        <input type="hidden" name="color" value={color} />
        <div>
          <label className={labelClass}>Nome</label>
          <input name="name" required defaultValue={goal?.name} placeholder="Ex.: Viagem de férias" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Valor da meta (R$)</label>
            <input
              name="targetAmount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={goal?.targetAmount}
              className={`${inputClass} num`}
            />
          </div>
          <div>
            <label className={labelClass}>Prazo (opcional)</label>
            <input name="deadline" type="date" defaultValue={goal?.deadline ?? ""} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Cor</label>
          <div className="flex gap-2">
            {GOAL_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Cor ${option}`}
                onClick={() => setColor(option)}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition ${color === option ? "ring-2 ring-foreground" : ""}`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={primaryButtonClass}>
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ContributionModal({
  contribution,
  initialGoalId,
  goals,
  saveContribution,
  onClose,
}: {
  contribution: ContributionItem | null;
  initialGoalId: string | null;
  goals: GoalItem[];
  saveContribution: ServerAction;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal title={contribution ? "Editar aporte" : "Registrar aporte"} onClose={onClose}>
      <form
        action={(formData) =>
          startTransition(async () => {
            await saveContribution(formData);
            onClose();
          })
        }
        className="space-y-4"
      >
        {contribution && <input type="hidden" name="id" value={contribution.id} />}
        <div>
          <label className={labelClass}>Meta</label>
          <select name="goalId" defaultValue={initialGoalId ?? ""} className={inputClass}>
            <option value="">Sem meta</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Valor (R$)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={contribution?.amount}
              className={`${inputClass} num`}
            />
          </div>
          <div>
            <label className={labelClass}>Data</label>
            <input name="date" type="date" required defaultValue={contribution?.date ?? today} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Observação (opcional)</label>
          <input name="name" defaultValue={contribution?.note} placeholder="Ex.: 13º salário" className={inputClass} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={primaryButtonClass}>
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
