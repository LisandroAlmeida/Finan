"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reserves, goals } from "@/db/schema";
import { currentMonth } from "@/lib/month";

export async function createReserve(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date"));

  if (!name || !type || !amount || !date) {
    throw new Error("Nome, tipo, valor e data são obrigatórios.");
  }

  await db.insert(reserves).values({
    name,
    type,
    amount: amount.toFixed(2),
    date,
  });

  revalidatePath("/reservas");
  revalidatePath("/");
}

export async function deleteReserve(id: string) {
  await db.delete(reserves).where(eq(reserves.id, id));
  revalidatePath("/reservas");
  revalidatePath("/");
}

export async function upsertGoal(formData: FormData) {
  const key = String(formData.get("key") ?? "") as "reserva_emergencia" | "aumento_renda";
  const targetAmount = Number(formData.get("targetAmount"));

  if (!key || !targetAmount) {
    throw new Error("Meta e valor são obrigatórios.");
  }

  const month = currentMonth();

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.key, key), eq(goals.month, month)),
  });

  if (existing) {
    await db.update(goals).set({ targetAmount: targetAmount.toFixed(2) }).where(eq(goals.id, existing.id));
  } else {
    await db.insert(goals).values({ key, targetAmount: targetAmount.toFixed(2), month });
  }

  revalidatePath("/reservas");
  revalidatePath("/");
}
