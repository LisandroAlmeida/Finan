"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, expenses } from "@/db/schema";
import { resolveExpenseMonth } from "@/lib/cardCycle";

/** Busca o dia de fechamento do cartão usado (null se não for cartão, ou se a forma de pagamento não tiver essa info). */
async function getClosingDay(accountId: string | null): Promise<number | null> {
  if (!accountId) return null;
  const account = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });
  return account?.closingDay ?? null;
}

/** Divide um valor total em N parcelas que somam exatamente o total. */
function splitInstallments(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;
  return Array.from({ length: count }, (_, i) => {
    const centsForThis = base + (i < remainder ? 1 : 0);
    return centsForThis / 100;
  });
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export async function createExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId"));
  const accountIdRaw = String(formData.get("accountId") ?? "");
  const accountId = accountIdRaw ? accountIdRaw : null;
  const totalAmount = Number(formData.get("amount"));
  const date = String(formData.get("date"));
  const essential = formData.get("essential") === "on";
  const installmentTotal = Math.max(1, Number(formData.get("installments") ?? 1));

  if (!categoryId || !totalAmount || !date) {
    throw new Error("Categoria, valor e data são obrigatórios.");
  }

  const closingDay = await getClosingDay(accountId);

  if (installmentTotal <= 1) {
    await db.insert(expenses).values({
      description,
      categoryId,
      accountId,
      amount: totalAmount.toFixed(2),
      date,
      month: resolveExpenseMonth(date, closingDay),
      essential,
    });
  } else {
    const groupId = crypto.randomUUID();
    const parts = splitInstallments(totalAmount, installmentTotal);
    for (let i = 0; i < installmentTotal; i++) {
      const parcelaDate = addMonths(date, i);
      await db.insert(expenses).values({
        description,
        categoryId,
        accountId,
        amount: parts[i].toFixed(2),
        date: parcelaDate,
        month: resolveExpenseMonth(parcelaDate, closingDay),
        essential,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        installmentTotal,
      });
    }
  }

  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function updateExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId"));
  const accountIdRaw = String(formData.get("accountId") ?? "");
  const accountId = accountIdRaw ? accountIdRaw : null;
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date"));
  const essential = formData.get("essential") === "on";

  if (!id || !categoryId || !amount || !date) {
    throw new Error("Categoria, valor e data são obrigatórios.");
  }

  const closingDay = await getClosingDay(accountId);

  await db
    .update(expenses)
    .set({
      description,
      categoryId,
      accountId,
      amount: amount.toFixed(2),
      date,
      month: resolveExpenseMonth(date, closingDay),
      essential,
    })
    .where(eq(expenses.id, id));

  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/gastos");
  revalidatePath("/");
}
