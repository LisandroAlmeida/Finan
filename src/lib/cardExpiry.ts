export const EXPIRY_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  return { value: month, label: String(month).padStart(2, "0") };
});

/** Próximos `yearsAhead` anos a partir do atual, garantindo que `includeYear` apareça na lista mesmo fora da janela (ex: editando um cartão com validade já cadastrada). */
export function expiryYearOptions(includeYear?: number | null, yearsAhead = 15): number[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsAhead + 1 }, (_, i) => currentYear + i);
  if (includeYear && !years.includes(includeYear)) {
    years.push(includeYear);
    years.sort((a, b) => a - b);
  }
  return years;
}
