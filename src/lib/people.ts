import { db } from "@/db";
import { appSettings } from "@/db/schema";

export type PaidBy = "lisandro" | "lety" | "casal";

export type Person = { value: PaidBy; label: string; color: string };

const PEOPLE_DEFAULTS: Person[] = [
  { value: "lisandro", label: "Lisandro", color: "#3B82F6" },
  { value: "lety", label: "Lety", color: "#D946EF" },
  { value: "casal", label: "Casal", color: "#F59E0B" },
];

const SETTING_KEY_PREFIX = "person_name_";

export function personSettingKey(person: PaidBy): string {
  return `${SETTING_KEY_PREFIX}${person}`;
}

export function initialsOf(name: string): string {
  return name.trim().slice(0, 2).replace(/^./, (letter) => letter.toUpperCase());
}

/** Pessoas com os nomes escolhidos em Configurações (ou os nomes padrão). */
export async function getPeople(): Promise<Person[]> {
  try {
    const rows = await db.select().from(appSettings);
    const namesByKey = new Map(rows.map((row) => [row.key, row.value]));
    return PEOPLE_DEFAULTS.map((person) => ({
      ...person,
      label: namesByKey.get(personSettingKey(person.value))?.trim() || person.label,
    }));
  } catch {
    // Se a tabela ainda não existir ou o banco falhar, o app continua com os nomes padrão.
    return PEOPLE_DEFAULTS;
  }
}

export function parsePaidBy(raw: FormDataEntryValue | null): PaidBy | null {
  const value = String(raw ?? "");
  return PEOPLE_DEFAULTS.some((person) => person.value === value) ? (value as PaidBy) : null;
}
