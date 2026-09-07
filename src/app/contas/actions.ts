"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";

function parseExpiry(formData: FormData): { expiryMonth: number | null; expiryYear: number | null } {
  const expiryRaw = String(formData.get("expiry") ?? "").trim(); // "YYYY-MM" (input type=month)
  const [yearStr, monthStr] = expiryRaw.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!expiryRaw || Number.isNaN(year) || Number.isNaN(month)) {
    return { expiryMonth: null, expiryYear: null };
  }
  return { expiryMonth: month, expiryYear: year };
}

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const closingDayRaw = formData.get("closingDay");
  const dueDayRaw = formData.get("dueDay");
  const lastFourDigits = String(formData.get("lastFourDigits") ?? "").trim().slice(0, 4) || null;
  const { expiryMonth, expiryYear } = parseExpiry(formData);

  if (!name) throw new Error("Nome da conta/cartão é obrigatório.");

  await db.insert(accounts).values({
    name,
    bank,
    type,
    closingDay: closingDayRaw ? Number(closingDayRaw) : null,
    dueDay: dueDayRaw ? Number(dueDayRaw) : null,
    lastFourDigits,
    expiryMonth,
    expiryYear,
  });

  revalidatePath("/contas");
}

export async function updateAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const dueDayRaw = formData.get("dueDay");
  const lastFourDigits = String(formData.get("lastFourDigits") ?? "").trim().slice(0, 4) || null;
  const { expiryMonth, expiryYear } = parseExpiry(formData);

  if (!id || !name) throw new Error("Conta e nome são obrigatórios.");

  await db
    .update(accounts)
    .set({
      name,
      bank,
      type,
      dueDay: dueDayRaw ? Number(dueDayRaw) : null,
      lastFourDigits,
      expiryMonth,
      expiryYear,
    })
    .where(eq(accounts.id, id));

  revalidatePath("/contas");
}

export async function deleteAccount(id: string) {
  await db.delete(accounts).where(eq(accounts.id, id));
  revalidatePath("/contas");
  revalidatePath("/");
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
