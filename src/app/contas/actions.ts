"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const closingDayRaw = formData.get("closingDay");
  const dueDayRaw = formData.get("dueDay");

  if (!name) throw new Error("Nome da conta/cartão é obrigatório.");

  await db.insert(accounts).values({
    name,
    bank,
    type,
    closingDay: closingDayRaw ? Number(closingDayRaw) : null,
    dueDay: dueDayRaw ? Number(dueDayRaw) : null,
  });

  revalidatePath("/contas");
}

export async function archiveAccount(id: string) {
  await db.update(accounts).set({ archived: true }).where(eq(accounts.id, id));
  revalidatePath("/contas");
}

export async function upsertBill(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  const month = String(formData.get("month"));
  const plannedAmount = Number(formData.get("plannedAmount"));

  if (!accountId || !month || Number.isNaN(plannedAmount)) {
    throw new Error("Conta, mês e valor planejado são obrigatórios.");
  }

  await db.insert(bills).values({
    accountId,
    month,
    plannedAmount: plannedAmount.toFixed(2),
  });

  revalidatePath("/contas");
  revalidatePath("/");
}

export async function markBillPaid(formData: FormData) {
  const id = String(formData.get("id"));
  const actualAmountRaw = formData.get("actualAmount");
  const paidAtRaw = formData.get("paidAt");

  await db
    .update(bills)
    .set({
      paid: true,
      actualAmount: actualAmountRaw ? Number(actualAmountRaw).toFixed(2) : undefined,
      paidAt: paidAtRaw ? String(paidAtRaw) : undefined,
    })
    .where(eq(bills.id, id));

  revalidatePath("/contas");
  revalidatePath("/");
}

export async function deleteBill(id: string) {
  await db.delete(bills).where(eq(bills.id, id));
  revalidatePath("/contas");
  revalidatePath("/");
}
