/**
 * Dicionário de bancos/instituições comuns no Brasil, com cor de marca e
 * sigla — usado pra desenhar um "logo" (badge colorido) sem depender de
 * imagens externas. Fácil de estender: é só adicionar uma chave nova.
 * Se no futuro quiserem logos de verdade, dá pra trocar o BankBadge por
 * <img src={`/banks/${bank}.svg`}> apontando pra arquivos em /public/banks.
 */
export const BANKS: Record<string, { label: string; color: string; initials: string }> = {
  bradesco: { label: "Bradesco", color: "#CC092F", initials: "BD" },
  itau: { label: "Itaú", color: "#EC7000", initials: "IT" },
  bb: { label: "Banco do Brasil", color: "#F7D117", initials: "BB" },
  caixa: { label: "Caixa", color: "#0070AD", initials: "CX" },
  santander: { label: "Santander", color: "#EC0000", initials: "ST" },
  nubank: { label: "Nubank", color: "#820AD1", initials: "NU" },
  inter: { label: "Inter", color: "#FF7A00", initials: "IN" },
  c6: { label: "C6 Bank", color: "#1B1B1B", initials: "C6" },
  mercadopago: { label: "Mercado Pago", color: "#00B1EA", initials: "MP" },
  picpay: { label: "PicPay", color: "#21C25E", initials: "PP" },
  amazon: { label: "Amazon", color: "#FF9900", initials: "AZ" },
  outro: { label: "Outro", color: "#6B7280", initials: "?" },
};

export function bankInfo(bank: string) {
  return BANKS[bank] ?? { label: bank, color: "#6B7280", initials: bank.slice(0, 2).toUpperCase() };
}

export const BANK_OPTIONS = Object.entries(BANKS).map(([key, v]) => ({
  value: key,
  label: v.label,
}));

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const channel = (shift: number) => {
    const c = (num >> shift) & 0xff;
    return Math.max(0, Math.round(c * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** Gradiente sutil (da cor do banco pra uma versão mais escura), pro fundo do cartão visual. */
export function bankCardGradient(bank: string): string {
  const { color } = bankInfo(bank);
  return `linear-gradient(135deg, ${color} 0%, ${darken(color, 0.5)} 100%)`;
}
