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

function parsePaymentMethod(formData: FormData): "boleto" | "pix" | null {
  const raw = String(formData.get("paymentMethod") ?? "");
  return raw === "boleto" || raw === "pix" ? raw : null;
}

function revalidateForType(type: "conta" | "cartao") {
  revalidatePath(type === "cartao" ? "/cartoes" : "/contas");
  revalidatePath("/");
}

/** Só permite um nível de hierarquia: um cartão adicional não pode virar
 * titular de outro adicional (evita correntes tipo A adicional de B
 * adicional de C, que quebraria o agrupamento da fatura). */
async function assertCanBeParent(parentAccountId: string) {
  const parent = await db.query.accounts.findFirst({ where: eq(accounts.id, parentAccountId) });
  if (parent?.parentAccountId) {
    throw new Error(
      `"${parent.name}" já é adicional de outro cartão — escolha o titular original como principal.`,
    );
  }
}

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const dueDayRaw = formData.get("dueDay");
  const parentAccountIdRaw = String(formData.get("parentAccountId") ?? "");
  const lastFourDigits = String(formData.get("lastFourDigits") ?? "").trim().slice(0, 4) || null;
  const { expiryMonth, expiryYear } = parseExpiry(formData);
  const paymentMethod = parsePaymentMethod(formData);

  if (!name) throw new Error("Nome da conta/cartão é obrigatório.");
  if (type === "cartao" && parentAccountIdRaw) await assertCanBeParent(parentAccountIdRaw);

  await db.insert(accounts).values({
    name,
    bank,
    type,
    dueDay: dueDayRaw ? Number(dueDayRaw) : null,
    parentAccountId: type === "cartao" && parentAccountIdRaw ? parentAccountIdRaw : null,
    lastFourDigits,
    expiryMonth,
    expiryYear,
    paymentMethod: type === "conta" ? paymentMethod : null,
  });

  revalidateForType(type);
}

export async function updateAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const bank = String(formData.get("bank") ?? "outro");
  const type = String(formData.get("type") ?? "cartao") as "conta" | "cartao";
  const dueDayRaw = formData.get("dueDay");
  const parentAccountIdRaw = String(formData.get("parentAccountId") ?? "");
  const lastFourDigits = String(formData.get("lastFourDigits") ?? "").trim().slice(0, 4) || null;
  const { expiryMonth, expiryYear } = parseExpiry(formData);
  const paymentMethod = parsePaymentMethod(formData);

  if (!id || !name) throw new Error("Conta e nome são obrigatórios.");
  if (parentAccountIdRaw === id) throw new Error("Um cartão não pode ser adicional de si mesmo.");
  if (type === "cartao" && parentAccountIdRaw) await assertCanBeParent(parentAccountIdRaw);

  // Se esse cartão vai virar adicional de outro, qualquer cartão que hoje é
  // adicional DELE precisa "subir de nível" (virar titular), senão a cadeia
  // ficaria com 2 níveis.
  if (type === "cartao" && parentAccountIdRaw) {
    await db.update(accounts).set({ parentAccountId: null }).where(eq(accounts.parentAccountId, id));
  }

  await db
    .update(accounts)
    .set({
      name,
      bank,
      type,
      dueDay: dueDayRaw ? Number(dueDayRaw) : null,
      parentAccountId: type === "cartao" && parentAccountIdRaw ? parentAccountIdRaw : null,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      paymentMethod: type === "conta" ? paymentMethod : null,
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

export async function updateBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const plannedAmount = Number(formData.get("plannedAmount"));
  const actualAmountRaw = String(formData.get("actualAmount") ?? "").trim();
  const paidAtRaw = String(formData.get("paidAt") ?? "").trim();
  const paid = formData.get("paid") === "on";
  const redirectPath = String(formData.get("redirectPath") ?? "/contas");

  if (!id || Number.isNaN(plannedAmount)) {
    throw new Error("Fatura e valor planejado são obrigatórios.");
  }

  await db
    .update(bills)
    .set({
      plannedAmount: plannedAmount.toFixed(2),
      actualAmount: actualAmountRaw ? Number(actualAmountRaw).toFixed(2) : null,
      paidAt: paidAtRaw || null,
      paid,
    })
    .where(eq(bills.id, id));

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
