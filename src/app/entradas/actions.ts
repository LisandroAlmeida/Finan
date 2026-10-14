"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { toMonth } from "@/lib/month";
import { parsePaidBy } from "@/lib/people";

function revalidateIncomePages() {
  revalidatePath("/entradas");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

function emptyToNull(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value ? value : null;
}

/** Aceita "date" (novo formulário) ou "month" (tela antiga de Entradas). */
function resolveDateAndMonth(formData: FormData): { date: string | null; month: string } {
  const date = emptyToNull(formData.get("date"));
  if (date) return { date, month: toMonth(date) };
  const month = String(formData.get("month") ?? "");
  return { date: null, month };
}

export async function createIncome(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const { date, month } = resolveDateAndMonth(formData);

  if (!description || !amount || !month) {
    throw new Error("Descrição, valor e data são obrigatórios.");
  }

  await db.insert(incomes).values({
    description,
    amount: amount.toFixed(2),
    month,
    date,
    accountId: emptyToNull(formData.get("accountId")),
    categoryId: emptyToNull(formData.get("categoryId")),
    paidBy: parsePaidBy(formData.get("paidBy")),
  });

  revalidateIncomePages();
}

export async function updateIncome(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!id || !description || !amount) {
    throw new Error("Descrição e valor são obrigatórios.");
  }

  const changes: Partial<typeof incomes.$inferInsert> = {
    description,
    amount: amount.toFixed(2),
  };
  // Só o formulário novo manda estes campos; a tela antiga mantém o que já existe.
  if (formData.has("date")) {
    const { date, month } = resolveDateAndMonth(formData);
    if (date) {
      changes.date = date;
      changes.month = month;
    }
    changes.accountId = emptyToNull(formData.get("accountId"));
    changes.categoryId = emptyToNull(formData.get("categoryId"));
    changes.paidBy = parsePaidBy(formData.get("paidBy"));
  }

  await db.update(incomes).set(changes).where(eq(incomes.id, id));
  revalidateIncomePages();
}

export async function deleteIncome(id: string) {
  await db.delete(incomes).where(eq(incomes.id, id));
  revalidateIncomePages();
}
