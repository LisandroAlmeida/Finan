import { desc } from "drizzle-orm";
import { Flag, PiggyBank, Target } from "lucide-react";
import { db } from "@/db";
import { reserves } from "@/db/schema";
import { currentMonth, monthLabelLong, toMonth } from "@/lib/month";
import { formatCurrency } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { MetasClient, type ContributionItem, type GoalItem } from "./MetasClient";
import { deleteContribution, deleteGoal, saveContribution, saveGoal } from "./actions";

export const dynamic = "force-dynamic";

const NO_GOAL_COLOR = "#71717A";

function monthsUntil(deadline: string, fromMonth: string): number {
  const [deadlineYear, deadlineMonth] = deadline.split("-").map(Number);
  const [fromYear, fromMonthNumber] = fromMonth.split("-").map(Number);
  return (deadlineYear - fromYear) * 12 + (deadlineMonth - fromMonthNumber) + 1;
}

export default async function MetasPage() {
  const month = currentMonth();
  const [goalRows, reserveRows] = await Promise.all([
    db.query.savingsGoals.findMany({ orderBy: (table, { asc }) => asc(table.createdAt) }),
    db.query.reserves.findMany({ orderBy: [desc(reserves.date), desc(reserves.createdAt)], with: { goal: true } }),
  ]);

  const goals: GoalItem[] = goalRows.map((goal) => {
    const goalReserves = reserveRows.filter((row) => row.goalId === goal.id);
    const savedAmount = goalReserves.reduce((sum, row) => sum + Number(row.amount), 0);
    const savedThisMonth = goalReserves
      .filter((row) => toMonth(row.date) === month)
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const targetAmount = Number(goal.targetAmount);
    const remaining = targetAmount - savedAmount;
    const monthsLeft = goal.deadline ? monthsUntil(goal.deadline, month) : 0;
    return {
      id: goal.id,
      name: goal.name,
      targetAmount,
      savedAmount,
      savedThisMonth,
      deadline: goal.deadline,
      color: goal.color,
      monthlyNeeded: remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : null,
    };
  });

  const contributions: ContributionItem[] = reserveRows.map((row) => ({
    id: row.id,
    goalId: row.goalId,
    goalName: row.goal?.name ?? "Sem meta",
    goalColor: row.goal?.color ?? NO_GOAL_COLOR,
    note: row.name,
    amount: Number(row.amount),
    date: row.date,
  }));

  const totalSaved = reserveRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savedInGoals = goals.reduce((sum, goal) => sum + Math.min(goal.savedAmount, goal.targetAmount), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader title="Metas & Sonhos" subtitle={`${monthLabelLong(month)} · o que vocês estão construindo juntos`} />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={PiggyBank} label="Total guardado" value={formatCurrency(totalSaved)} color="#10B981" />
        <KpiCard icon={Target} label="Soma das metas" value={formatCurrency(totalTarget)} color="#3B82F6" />
        <KpiCard
          icon={Flag}
          label="Progresso geral"
          value={`${totalTarget ? Math.round((savedInGoals / totalTarget) * 100) : 0}%`}
          color="#F59E0B"
        />
      </div>

      <MetasClient
        goals={goals}
        contributions={contributions}
        actions={{ saveGoal, deleteGoal, saveContribution, deleteContribution }}
      />
    </main>
  );
}
