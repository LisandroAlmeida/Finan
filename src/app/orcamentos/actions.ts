"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { shiftMonth } from "@/lib/month";

function revalidateBudgetPages() {
  revalidatePath("/orcamentos");
  revalidatePath("/");
}

/** Define (ou remove, se o valor for zero/vazio) o limite de uma categoria no mês. */
export async function saveBudget(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  const month = String(formData.get("month") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));

  if (!categoryId || !month) throw new Error("Categoria e mês são obrigatórios.");

  if (!amount || amount <= 0) {
    await db.delete(budgets).where(and(eq(budgets.categoryId, categoryId), eq(budgets.month, month)));
  } else {
    await db
      .insert(budgets)
      .values({ categoryId, month, amount: amount.toFixed(2) })
      .onConflictDoUpdate({
        target: [budgets.categoryId, budgets.month],
        set: { amount: amount.toFixed(2) },
      });
  }
  revalidateBudgetPages();
}

/** Copia os limites do mês anterior só para as categorias que ainda não têm limite neste mês. */
export async function copyBudgetsFromPreviousMonth(formData: FormData) {
  const month = String(formData.get("month") ?? "");
  if (!month) throw new Error("Mês é obrigatório.");

  const previousMonthBudgets = await db.query.budgets.findMany({
    where: eq(budgets.month, shiftMonth(month, -1)),
  });
  if (previousMonthBudgets.length === 0) return;

  await db
    .insert(budgets)
    .values(
      previousMonthBudgets.map((budget) => ({
        categoryId: budget.categoryId,
        month,
        amount: budget.amount,
      })),
    )
    .onConflictDoNothing();
  revalidateBudgetPages();
}
