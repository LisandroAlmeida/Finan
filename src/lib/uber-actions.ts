"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uberEarnings, uberExpenses, uberFixedExpenses, uberFinancings } from "@/db/schema";

const UBER_CATEGORIES = [
  "combustivel",
  "manutencao",
  "lavagem",
  "seguro",
  "ipva_licenciamento",
  "financiamento",
  "pedagio_estacionamento",
  "internet_celular",
  "alimentacao",
  "outros",
] as const;

export type UberExpenseCategory = (typeof UBER_CATEGORIES)[number];

function parseUberCategory(formData: FormData): UberExpenseCategory {
  const raw = String(formData.get("category") ?? "");
  return (UBER_CATEGORIES as readonly string[]).includes(raw) ? (raw as UberExpenseCategory) : "outros";
}

function toNumOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s ? Number(s).toFixed(2) : null;
}

function toIntOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  return s ? Number(s) : null;
}

function revalidateUber() {
  revalidatePath("/uber");
  revalidatePath("/uber/ganhos");
  revalidatePath("/uber/lancamentos");
  revalidatePath("/uber/combustivel");
  revalidatePath("/uber/despesas-do-carro");
  revalidatePath("/uber/financiamento");
  revalidatePath("/uber/resumo");
}

// ---------- Ganhos ----------
export async function createUberEarning(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  if (!date) throw new Error("Data é obrigatória.");

  await db.insert(uberEarnings).values({
    date,
    platform: String(formData.get("platform") ?? "Uber").trim() || "Uber",
    kmInicial: toIntOrNull(formData.get("kmInicial")),
    kmFinal: toIntOrNull(formData.get("kmFinal")),
    horasTrabalhadas: toNumOrNull(formData.get("horasTrabalhadas")),
    viagens: toIntOrNull(formData.get("viagens")),
    pontos: toIntOrNull(formData.get("pontos")),
    valor: toNumOrNull(formData.get("valor")),
    promo: toNumOrNull(formData.get("promo")),
    gorjetaExtras: toNumOrNull(formData.get("gorjetaExtras")),
    bonus: toNumOrNull(formData.get("bonus")),
  });

  revalidateUber();
}

export async function updateUberEarning(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!id || !date) throw new Error("Registro e data são obrigatórios.");

  await db
    .update(uberEarnings)
    .set({
      date,
      platform: String(formData.get("platform") ?? "Uber").trim() || "Uber",
      kmInicial: toIntOrNull(formData.get("kmInicial")),
      kmFinal: toIntOrNull(formData.get("kmFinal")),
      horasTrabalhadas: toNumOrNull(formData.get("horasTrabalhadas")),
      viagens: toIntOrNull(formData.get("viagens")),
      pontos: toIntOrNull(formData.get("pontos")),
      valor: toNumOrNull(formData.get("valor")),
      promo: toNumOrNull(formData.get("promo")),
      gorjetaExtras: toNumOrNull(formData.get("gorjetaExtras")),
      bonus: toNumOrNull(formData.get("bonus")),
    })
    .where(eq(uberEarnings.id, id));

  revalidateUber();
}

export async function deleteUberEarning(id: string) {
  await db.delete(uberEarnings).where(eq(uberEarnings.id, id));
  revalidateUber();
}

// ---------- Gastos (lançamentos + combustível) ----------
export async function createUberExpense(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  if (!date || Number.isNaN(amount)) throw new Error("Data e valor são obrigatórios.");

  await db.insert(uberExpenses).values({
    date,
    category: parseUberCategory(formData),
    description: String(formData.get("description") ?? "").trim() || null,
    amount: amount.toFixed(2),
    paymentMethod: String(formData.get("paymentMethod") ?? "").trim() || null,
    kmAbastecimento: toIntOrNull(formData.get("kmAbastecimento")),
    litrosAbastecidos: toNumOrNull(formData.get("litrosAbastecidos")),
  });

  revalidateUber();
}

export async function updateUberExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const amount = Number(formData.get("amount"));
  if (!id || !date || Number.isNaN(amount)) throw new Error("Registro, data e valor são obrigatórios.");

  await db
    .update(uberExpenses)
    .set({
      date,
      category: parseUberCategory(formData),
      description: String(formData.get("description") ?? "").trim() || null,
      amount: amount.toFixed(2),
      paymentMethod: String(formData.get("paymentMethod") ?? "").trim() || null,
      kmAbastecimento: toIntOrNull(formData.get("kmAbastecimento")),
      litrosAbastecidos: toNumOrNull(formData.get("litrosAbastecidos")),
    })
    .where(eq(uberExpenses.id, id));

  revalidateUber();
}

export async function deleteUberExpense(id: string) {
  await db.delete(uberExpenses).where(eq(uberExpenses.id, id));
  revalidateUber();
}

// ---------- Lançamento rápido (painel do Dashboard Uber) ----------
// Junta, num só formulário, o início/fim de km do dia (Ganhos) e o
// abastecimento (Gastos/Combustível) — os detalhes finos (valor da corrida,
// horas, viagens etc) ficam pra tela de Ganhos completa.
export async function quickLogUberDay(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  if (!date) throw new Error("Data é obrigatória.");

  const kmInicial = toIntOrNull(formData.get("kmInicial"));
  const kmFinal = toIntOrNull(formData.get("kmFinal"));
  const kmAbastecimento = toIntOrNull(formData.get("kmAbastecimento"));
  const valorCombustivel = toNumOrNull(formData.get("valorCombustivel"));

  if (kmInicial === null && kmFinal === null && kmAbastecimento === null && valorCombustivel === null) {
    throw new Error("Preencha ao menos um campo pra lançar.");
  }

  if (kmInicial !== null || kmFinal !== null) {
    await db.insert(uberEarnings).values({
      date,
      platform: "Uber",
      kmInicial,
      kmFinal,
    });
  }

  if (valorCombustivel !== null) {
    await db.insert(uberExpenses).values({
      date,
      category: "combustivel",
      amount: valorCombustivel,
      kmAbastecimento,
    });
  }

  revalidateUber();
}

// ---------- Despesas fixas do carro (revisão, seguro, IPVA...) ----------
// "Parcelada" (ex: revisão em 10x) quando installmentCount+installmentStartDate
// vêm preenchidos; senão é recorrente indefinida (ex: seguro mensal).
function parseFixedExpenseInstallment(formData: FormData) {
  const installmentCount = toIntOrNull(formData.get("installmentCount"));
  const installmentStartDate = String(formData.get("installmentStartDate") ?? "").trim() || null;
  if (!installmentCount || !installmentStartDate) return { installmentCount: null, installmentStartDate: null };
  return { installmentCount, installmentStartDate };
}

export async function createUberFixedExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  if (!description || Number.isNaN(amount)) throw new Error("Descrição e valor são obrigatórios.");

  await db.insert(uberFixedExpenses).values({
    description,
    category: parseUberCategory(formData),
    amount: amount.toFixed(2),
    ...parseFixedExpenseInstallment(formData),
  });

  revalidateUber();
}

export async function updateUberFixedExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  if (!id || !description || Number.isNaN(amount)) {
    throw new Error("Registro, descrição e valor são obrigatórios.");
  }

  await db
    .update(uberFixedExpenses)
    .set({
      description,
      category: parseUberCategory(formData),
      amount: amount.toFixed(2),
      active: formData.get("active") === "on",
      ...parseFixedExpenseInstallment(formData),
    })
    .where(eq(uberFixedExpenses.id, id));

  revalidateUber();
}

export async function deleteUberFixedExpense(id: string) {
  await db.delete(uberFixedExpenses).where(eq(uberFixedExpenses.id, id));
  revalidateUber();
}

/** Marca uma despesa fixa como paga num mês: cria o gasto de verdade em
 * uber_expenses (com data = 1º dia do mês selecionado), vinculado de volta
 * pela fixedExpenseId. Não aparece na lista de Lançamentos (fica só nas
 * telas de Despesas do carro/Resumo/Dashboard), mas entra nos totais
 * normalmente. */
export async function payUberFixedExpense(formData: FormData) {
  const fixedExpenseId = String(formData.get("fixedExpenseId") ?? "");
  const month = String(formData.get("month") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const category = parseUberCategory(formData);
  const amount = Number(formData.get("amount"));
  const parcelaNumero = toIntOrNull(formData.get("parcelaNumero"));
  if (!fixedExpenseId || !month || Number.isNaN(amount)) {
    throw new Error("Despesa fixa, mês e valor são obrigatórios.");
  }

  await db.insert(uberExpenses).values({
    date: month,
    category,
    description: description || null,
    amount: amount.toFixed(2),
    fixedExpenseId,
    parcelaNumero,
  });

  revalidateUber();
}

// ---------- Financiamento do carro ----------
export async function createUberFinancing(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const downPayment = toNumOrNull(formData.get("downPayment")) ?? "0.00";
  const installmentAmount = Number(formData.get("installmentAmount"));
  const installmentCount = toIntOrNull(formData.get("installmentCount"));
  const startDate = String(formData.get("startDate") ?? "");
  if (!description || Number.isNaN(installmentAmount) || !installmentCount || !startDate) {
    throw new Error("Descrição, valor da parcela, nº de parcelas e data de início são obrigatórios.");
  }

  await db.insert(uberFinancings).values({
    description,
    downPayment,
    installmentAmount: installmentAmount.toFixed(2),
    installmentCount,
    startDate,
  });

  revalidateUber();
}

export async function updateUberFinancing(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const downPayment = toNumOrNull(formData.get("downPayment")) ?? "0.00";
  const installmentAmount = Number(formData.get("installmentAmount"));
  const installmentCount = toIntOrNull(formData.get("installmentCount"));
  const startDate = String(formData.get("startDate") ?? "");
  if (!id || !description || Number.isNaN(installmentAmount) || !installmentCount || !startDate) {
    throw new Error("Registro, descrição, valor da parcela, nº de parcelas e data de início são obrigatórios.");
  }

  await db
    .update(uberFinancings)
    .set({
      description,
      downPayment,
      installmentAmount: installmentAmount.toFixed(2),
      installmentCount,
      startDate,
      active: formData.get("active") === "on",
    })
    .where(eq(uberFinancings.id, id));

  revalidateUber();
}

export async function deleteUberFinancing(id: string) {
  await db.delete(uberFinancings).where(eq(uberFinancings.id, id));
  revalidateUber();
}

/** Marca a parcela de um mês como paga: cria o gasto (categoria
 * "financiamento") vinculado de volta pela financingId + parcelaNumero. Não
 * aparece na lista de Lançamentos, mas entra nos totais normalmente. */
export async function payUberFinancingInstallment(formData: FormData) {
  const financingId = String(formData.get("financingId") ?? "");
  const month = String(formData.get("month") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const parcelaNumero = toIntOrNull(formData.get("parcelaNumero"));
  if (!financingId || !month || Number.isNaN(amount) || !parcelaNumero) {
    throw new Error("Financiamento, mês e valor são obrigatórios.");
  }

  await db.insert(uberExpenses).values({
    date: month,
    category: "financiamento",
    description: description || null,
    amount: amount.toFixed(2),
    financingId,
    parcelaNumero,
  });

  revalidateUber();
}
