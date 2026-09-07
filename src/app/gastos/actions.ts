"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { toMonth, shiftMonth } from "@/lib/month";

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

/**
 * Mês de referência de um gasto: normalmente o mês civil da data, mas quando
 * a compra ficou depois do fechamento daquele mês (a pessoa marca a flag
 * "cai na fatura seguinte" ao cadastrar), soma 1 mês. O dia de fechamento do
 * cartão muda mês a mês, então não dá pra automatizar isso com segurança —
 * quem lança o gasto sabe melhor do que a fórmula.
 */
function resolveMonth(dateStr: string, nextInvoice: boolean): string {
  const baseMonth = toMonth(dateStr);
  return nextInvoice ? shiftMonth(baseMonth, 1) : baseMonth;
}

export async function createExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId"));
  const accountIdRaw = String(formData.get("accountId") ?? "");
  const accountId = accountIdRaw ? accountIdRaw : null;
  const totalAmount = Number(formData.get("amount"));
  const date = String(formData.get("date"));
  const essential = formData.get("essential") === "on";
  const nextInvoice = formData.get("nextInvoice") === "on";
  const installmentTotal = Math.max(1, Number(formData.get("installments") ?? 1));

  if (!categoryId || !totalAmount || !date) {
    throw new Error("Categoria, valor e data são obrigatórios.");
  }

  if (installmentTotal <= 1) {
    await db.insert(expenses).values({
      description,
      categoryId,
      accountId,
      amount: totalAmount.toFixed(2),
      date,
      month: resolveMonth(date, nextInvoice),
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
        month: resolveMonth(parcelaDate, nextInvoice),
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

  // A flag "cai na fatura seguinte" só aparece no cadastro (fica oculta na
  // edição pra não poluir a tela). Pra editar outro campo não "desfazer" a
  // fatura escolhida na hora de lançar o gasto, mantemos a mesma decisão
  // (mesmo mês vs. mês seguinte) tomada originalmente e só reaplicamos ela
  // em cima da data (nova ou não) que está sendo salva agora.
  const existing = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
  const wasNextInvoice = existing ? existing.date.slice(0, 7) !== existing.month.slice(0, 7) : false;

  await db
    .update(expenses)
    .set({
      description,
      categoryId,
      accountId,
      amount: amount.toFixed(2),
      date,
      month: resolveMonth(date, wasNextInvoice),
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
