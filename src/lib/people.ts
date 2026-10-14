export type PaidBy = "lisandro" | "lety" | "casal";

export const PAID_BY_OPTIONS: { value: PaidBy; label: string; color: string }[] = [
  { value: "lisandro", label: "Lisandro", color: "#3B82F6" },
  { value: "lety", label: "Lety", color: "#D946EF" },
  { value: "casal", label: "Casal", color: "#F59E0B" },
];

export function paidByInfo(value: string | null | undefined) {
  return PAID_BY_OPTIONS.find((option) => option.value === value) ?? null;
}

export function parsePaidBy(raw: FormDataEntryValue | null): PaidBy | null {
  const value = String(raw ?? "");
  return PAID_BY_OPTIONS.some((option) => option.value === value) ? (value as PaidBy) : null;
}
