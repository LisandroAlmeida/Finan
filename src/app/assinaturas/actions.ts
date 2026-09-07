"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export async function createSubscription(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "");
  const accountIdRaw = String(formData.get("accountId") ?? "");
  const amount = Number(formData.get("amount"));
  const billingCycle = String(formData.get("billingCycle") ?? "mensal") as "mensal" | "anual";
  const nextChargeDate = String(formData.get("nextChargeDate"));

  if (!name || !amount || !nextChargeDate) {
    throw new Error("Nome, valor e próxima cobrança são obrigatórios.");
  }

  await db.insert(subscriptions).values({
    name,
    categoryId: categoryIdRaw ? categoryIdRaw : null,
    accountId: accountIdRaw ? accountIdRaw : null,
    amount: amount.toFixed(2),
    billingCycle,
    nextChargeDate,
  });

  revalidatePath("/assinaturas");
}

export async function deactivateSubscription(id: string) {
  await db.update(subscriptions).set({ active: false }).where(eq(subscriptions.id, id));
  revalidatePath("/assinaturas");
}

export async function deleteSubscription(id: string) {
  await db.delete(subscriptions).where(eq(subscriptions.id, id));
  revalidatePath("/assinaturas");
}
