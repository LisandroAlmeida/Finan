"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incomes } from "@/db/schema";

export async function createIncome(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const month = String(formData.get("month"));

  if (!description || !amount || !month) {
    throw new Error("Descrição, valor e mês são obrigatórios.");
  }

  await db.insert(incomes).values({
    description,
    amount: amount.toFixed(2),
    month,
  });

  revalidatePath("/entradas");
  revalidatePath("/");
}

export async function deleteIncome(id: string) {
  await db.delete(incomes).where(eq(incomes.id, id));
  revalidatePath("/entradas");
  revalidatePath("/");
}
