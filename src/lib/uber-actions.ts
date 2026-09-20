"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uberEarnings, uberExpenses } from "@/db/schema";

const UBER_CATEGORIES = [
  "combustivel",
  "manutencao",
  "lavagem",
  "seguro",
  "ipva_licenciamento",
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
