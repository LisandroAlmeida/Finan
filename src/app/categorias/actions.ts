"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

function revalidateEverywhere() {
  // Categorias aparecem em vários formulários (Gastos, Assinaturas, Dashboard).
  revalidatePath("/categorias");
  revalidatePath("/gastos");
  revalidatePath("/assinaturas");
  revalidatePath("/");
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3B82F6").trim();

  if (!name) throw new Error("Nome da categoria é obrigatório.");

  await db.insert(categories).values({ name, color: color || "#3B82F6" });

  revalidateEverywhere();
}

export async function updateCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#3B82F6").trim();

  if (!id || !name) throw new Error("Categoria e nome são obrigatórios.");

  await db
    .update(categories)
    .set({ name, color: color || "#3B82F6" })
    .where(eq(categories.id, id));

  revalidateEverywhere();
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch {
    throw new Error(
      "Não dá pra excluir essa categoria porque ela já tem gastos ou assinaturas lançados nela. " +
        "Edite ou exclua esses lançamentos primeiro, ou apenas renomeie a categoria.",
    );
  }

  revalidateEverywhere();
}
