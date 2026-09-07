"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, bills } from "@/db/schema";

function parseExpiry(formData: FormData): { expiryMonth: number | null; expiryYear: number | null } {
  const monthRaw = String(formData.get("expiryMonth") ?? "").trim();
  const yearRaw = String(formData.get("expiryYear") ?? "").trim();
  const month = monthRaw ? Number(monthRaw) : NaN;
  const year = yearRaw ? Number(yearRaw) : NaN;
  if (Number.isNaN(month) || Number.isNaN(year)) {
    return { expiryMonth: null, expiryYear: null };
  }
  return { expiryMonth: month, expiryYear: year };
}

function revalidateForType(type: "conta" | "cartao") {
  revalidatePath(type === "cartao" ? "/cartoes" : "/contas");
  revalidatePath("/");
}

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const dueDayRaw = formData.get("dueDay");
  const closingDayRaw = formData.get("closingDay");
  const lastFourDigits = String(formData.get("lastFourDigits") ?? "").trim().slice(0, 4) || null;
  const { expiryMonth, expiryYear } = parseExpiry(formData);

  if (!name) throw new Error("Nome da conta/cartão é obrigatório.");

  await db.insert(accounts).values({
    name,
    bank,
    type,
    dueDay: dueDayRaw ? Number(dueDayRaw) : null,
    closingDay: type === "cartao" && closingDayRaw ? Number(closingDayRaw) : null,
    lastFourDigits,
    expiryMonth,
    expiryYear,
  });

  revalidateForType(type);
}

export async function updateAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const dueDayRaw = formData.get("dueDay");
  const closingDayRaw = formData.get("closingDay");
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
      closingDay: type === "cartao" && closingDayRaw ? Number(closingDayRaw) : null,
      lastFourDigits,
      expiryMonth,
      expiryYear,
    })
    .where(eq(accounts.id, id));

  revalidateForType(type);
}

export async function deleteAccount(id: string) {
  await db.delete(accounts).where(eq(accounts.id, id));
  revalidatePath("/contas");
  revalidatePath("/cartoes");
  revalidatePath("/");
}

export async function upsertBill(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  const month = String(formData.get("month"));
  const plannedAmount = Number(formData.get("plannedAmount"));
  const redirectPath = String(formData.get("redirectPath") ?? "/contas");

  if (!accountId || !month || Number.isNaN(plannedAmount)) {
    throw new Error("Conta, mês e valor planejado são obrigatórios.");
  }

  await db.insert(bills).values({
    accountId,
    month,
    plannedAmount: plannedAmount.toFixed(2),
  });

  revalidatePath(redirectPath);
  revalidatePath("/");
}

export async function markBillPaid(formData: FormData) {
  const id = String(formData.get("id"));
  const actualAmountRaw = formData.get("actualAmount");
  const paidAtRaw = formData.get("paidAt");
  const redirectPath = String(formData.get("redirectPath") ?? "/contas");

  await db
    .update(bills)
    .set({
      paid: true,
      actualAmount: actualAmountRaw ? Number(actualAmountRaw).toFixed(2) : undefined,
      paidAt: paidAtRaw ? String(paidAtRaw) : undefined,
    })
    .where(eq(bills.id, id));

  revalidatePath(redirectPath);
  revalidatePath("/");
}

export async function deleteBill(id: string) {
  await db.delete(bills).where(eq(bills.id, id));
  revalidatePath("/contas");
  revalidatePath("/cartoes");
  revalidatePath("/");
}
