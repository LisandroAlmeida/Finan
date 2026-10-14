"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { personSettingKey, type PaidBy } from "@/lib/people";

const PEOPLE_KEYS: PaidBy[] = ["lisandro", "lety", "casal"];

/** Salva os nomes exibidos de cada pessoa. Nome vazio volta ao padrão. */
export async function saveFamilyNames(formData: FormData) {
  for (const person of PEOPLE_KEYS) {
    const name = String(formData.get(person) ?? "").trim().slice(0, 30);
    const key = personSettingKey(person);
    if (name) {
      await db
        .insert(appSettings)
        .values({ key, value: name })
        .onConflictDoUpdate({ target: appSettings.key, set: { value: name } });
    } else {
      await db.delete(appSettings).where(eq(appSettings.key, key));
    }
  }
  revalidatePath("/", "layout");
}
