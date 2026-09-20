export const UBER_CATEGORY_LABELS: Record<string, string> = {
  combustivel: "Combustível",
  manutencao: "Manutenção",
  lavagem: "Lavagem",
  seguro: "Seguro do veículo",
  ipva_licenciamento: "IPVA/Licenciamento",
  financiamento: "Financiamento",
  pedagio_estacionamento: "Pedágio/Estacionamento",
  internet_celular: "Internet/Celular",
  alimentacao: "Alimentação",
  outros: "Outros",
};

export const UBER_CATEGORY_COLORS: Record<string, string> = {
  combustivel: "#DC2626",
  manutencao: "#B45309",
  lavagem: "#0891B2",
  seguro: "#7C3AED",
  ipva_licenciamento: "#334155",
  financiamento: "#0D9488",
  pedagio_estacionamento: "#65A30D",
  internet_celular: "#2563EB",
  alimentacao: "#DB2777",
  outros: "#6B7280",
};

// Categorias que aparecem no seletor de "Lançamentos" — combustível fica de
// fora porque tem tela própria (com km/litros), e financiamento fica de
// fora porque só é lançado pela tela de Financiamento (marcar como pago).
export const UBER_LANCAMENTO_CATEGORIES = Object.keys(UBER_CATEGORY_LABELS).filter(
  (c) => c !== "combustivel" && c !== "financiamento",
);

// Categorias disponíveis pra cadastrar uma despesa fixa do carro (revisão,
// seguro, IPVA...) — sem combustível (tela própria) nem financiamento
// (tem sua própria tela com contagem de parcelas).
export const UBER_FIXED_EXPENSE_CATEGORIES = Object.keys(UBER_CATEGORY_LABELS).filter(
  (c) => c !== "combustivel" && c !== "financiamento",
);

/** Diferença em meses inteiros entre duas datas "YYYY-MM..." (start <= target). */
function monthsBetween(start: string, target: string) {
  const [sy, sm] = start.slice(0, 7).split("-").map(Number);
  const [ty, tm] = target.slice(0, 7).split("-").map(Number);
  return (ty - sy) * 12 + (tm - sm);
}

/** Número da parcela (1-based) de algo parcelado (financiamento ou despesa
 * fixa parcelada) num dado mês, ou null se o mês for antes do início ou
 * depois de quitado. */
export function installmentNumberForMonth(
  item: { startDate: string; installmentCount: number },
  month: string,
): number | null {
  const n = monthsBetween(item.startDate, month) + 1;
  if (n < 1 || n > item.installmentCount) return null;
  return n;
}

/** Total original das parcelas de um financiamento (sem a entrada). */
export function financingInstallmentsTotal(financing: {
  installmentAmount: string;
  installmentCount: number;
}): number {
  return Number(financing.installmentAmount) * financing.installmentCount;
}

/** Total projetado do carro: entrada + total original das parcelas. */
export function financingProjectedTotal(financing: {
  downPayment: string;
  installmentAmount: string;
  installmentCount: number;
}): number {
  return Number(financing.downPayment) + financingInstallmentsTotal(financing);
}

/** Soma quanto já foi economizado pagando parcelas por um valor menor que o
 * original (ex: antecipação com desconto) — parcelas pagas por um valor
 * maior ou igual ao original não entram na conta. */
export function financingEarlyPaymentSavings(
  financing: { installmentAmount: string },
  payments: { amount: string }[],
): number {
  const original = Number(financing.installmentAmount);
  return payments.reduce((sum, p) => {
    const diff = original - Number(p.amount);
    return diff > 0 ? sum + diff : sum;
  }, 0);
}

/** Ganhos totais do dia = valor da corrida + promoção + gorjeta/extras.
 * Bônus fica de fora do total diário (igual a planilha original), mas entra
 * no total do mês separadamente. */
export function earningDayTotal(e: { valor: string | null; promo: string | null; gorjetaExtras: string | null }) {
  return Number(e.valor ?? 0) + Number(e.promo ?? 0) + Number(e.gorjetaExtras ?? 0);
}

export function earningMonthTotal(e: {
  valor: string | null;
  promo: string | null;
  gorjetaExtras: string | null;
  bonus: string | null;
}) {
  return earningDayTotal(e) + Number(e.bonus ?? 0);
}

export function sameMonth(date: string, month: string) {
  return date.slice(0, 7) === month.slice(0, 7);
}
