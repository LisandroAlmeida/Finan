"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reserves, savingsGoals } from "@/db/schema";

function revalidateGoalPages() {
  revalidatePath("/metas");
  revalidatePath("/");
}

function emptyToNull(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value ? value : null;
}

export async function saveGoal(formData: FormData) {
  const id = emptyToNull(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount"));
  const deadline = emptyToNull(formData.get("deadline"));
  const color = String(formData.get("color") ?? "#10B981");

  if (!name || !targetAmount) throw new Error("Nome e valor da meta são obrigatórios.");

  const values = { name, targetAmount: targetAmount.toFixed(2), deadline, color };
  if (id) await db.update(savingsGoals).set(values).where(eq(savingsGoals.id, id));
  else await db.insert(savingsGoals).values(values);

  revalidateGoalPages();
}

/** Excluir a meta não apaga os aportes: eles ficam no histórico como "Sem meta". */
export async function deleteGoal(id: string) {
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
  revalidateGoalPages();
}

export async function saveContribution(formData: FormData) {
  const id = emptyToNull(formData.get("id"));
  const goalId = emptyToNull(formData.get("goalId"));
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("name") ?? "").trim();

  if (!amount || !date) throw new Error("Valor e data são obrigatórios.");

  const goal = goalId
    ? await db.query.savingsGoals.findFirst({ where: eq(savingsGoals.id, goalId) })
    : null;

  const values = {
    name: note || (goal ? `Aporte — ${goal.name}` : "Aporte"),
    type: goal?.name ?? "Sem meta",
    amount: amount.toFixed(2),
    date,
    goalId: goal?.id ?? null,
  };
  if (id) await db.update(reserves).set(values).where(eq(reserves.id, id));
  else await db.insert(reserves).values(values);

  revalidateGoalPages();
}

export async function deleteContribution(id: string) {
  await db.delete(reserves).where(eq(reserves.id, id));
  revalidateGoalPages();
}
