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

// Paleta pra colorir cartões/formas de pagamento dinamicamente (não tem um
// enum fixo pra isso, é texto livre em uber_expenses.paymentMethod) — cor
// atribuída por ordem alfabética do nome, ciclando se tiver mais cartões
// que cores.
const CARD_COLOR_PALETTE = [
  "#2563EB",
  "#DC2626",
  "#0D9488",
  "#7C3AED",
  "#DB2777",
  "#B45309",
  "#65A30D",
  "#334155",
];

/** Soma os gastos (qualquer categoria) por cartão/forma de pagamento
 * (uber_expenses.paymentMethod), ignorando lançamentos sem esse campo
 * preenchido. Cor atribuída de forma estável (ordem alfabética do nome). */
export function groupExpensesByCard(
  expenseRows: { paymentMethod: string | null; amount: string }[],
): { name: string; value: number; color: string }[] {
  const totals = new Map<string, number>();
  for (const e of expenseRows) {
    const card = e.paymentMethod?.trim();
    if (!card) continue;
    totals.set(card, (totals.get(card) ?? 0) + Number(e.amount));
  }
  const cardNames = Array.from(totals.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return cardNames
    .map((name, i) => ({
      name,
      value: totals.get(name) ?? 0,
      color: CARD_COLOR_PALETTE[i % CARD_COLOR_PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);
}

// Dia de fechamento de cada cartão do Uber (informado por você). Cartão
// que não estiver aqui simplesmente não aparece no bloco de faturas — o
// resto do app (Combustível, Lançamentos, o total por cartão) continua
// funcionando normal com qualquer nome de cartão, tenha fatura ou não.
export const UBER_CARD_CLOSING_DAY: Record<string, number> = {
  Amazon: 28,
  C6: 13,
  "Mercado Pago": 11,
};

/** Próxima data (YYYY-MM-DD) em que o dia de fechamento `closingDay`
 * ocorre a partir de `today` (inclusive) — ex: hoje 24/09 e fechamento
 * dia 28 → 28/09; hoje 24/09 e fechamento dia 13 → 13/10 (já passou em
 * setembro). */
export function nextClosingDate(closingDay: number, today: Date = new Date()): string {
  const y = today.getFullYear();
  const m = today.getMonth() + 1; // 1-12
  const d = today.getDate();
  const [ny, nm] = d <= closingDay ? [y, m] : m === 12 ? [y + 1, 1] : [y, m + 1];
  return `${ny}-${String(nm).padStart(2, "0")}-${String(closingDay).padStart(2, "0")}`;
}

/** Fatura em aberto de cada cartão configurado: soma tudo que já foi
 * lançado nele (o app ainda não separa fatura já fechada de fatura em
 * aberto — é tudo "a pagar na próxima data de fechamento" até você marcar
 * uma fatura como paga) e a próxima data em que ela fecha/vence. */
export function openFaturaByCard(
  allExpenseRows: { paymentMethod: string | null; amount: string }[],
  today: Date = new Date(),
): { card: string; total: number; closingDate: string }[] {
  return Object.entries(UBER_CARD_CLOSING_DAY).map(([card, closingDay]) => {
    const total = allExpenseRows
      .filter((e) => e.paymentMethod?.trim() === card)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { card, total, closingDate: nextClosingDate(closingDay, today) };
  });
}

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

// Categorias tratadas como custo fixo de posse do carro: existem
// independente de quanto se dirige naquele mês (financiamento é parcela
// fixa do carro, seguro é fixo mensal). Ficam de fora do "Lucro
// operacional", que isola só o resultado de rodar (ganhos menos os custos
// que de fato escalam com o uso: combustível, manutenção, lavagem,
// pedágio...).
export const CUSTOS_FIXOS_CARRO_CATEGORIES: readonly string[] = ["seguro", "financiamento"];

/** Separa os gastos do mês entre operacionais (escalam com o uso do carro)
 * e custos fixos de posse do carro (seguro + financiamento). */
export function splitCarExpenses(expenseRows: { category: string; amount: string }[]) {
  let operational = 0;
  let fixedCarCosts = 0;
  for (const e of expenseRows) {
    const amount = Number(e.amount);
    if (CUSTOS_FIXOS_CARRO_CATEGORIES.includes(e.category)) fixedCarCosts += amount;
    else operational += amount;
  }
  return { operational, fixedCarCosts, total: operational + fixedCarCosts };
}

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

/** Data de vencimento (YYYY-MM-DD) da parcela N de um financiamento,
 * mantendo o dia do mês da data de início (com ajuste pra meses mais
 * curtos, ex: início dia 31 num mês de 30 dias cai no dia 30). */
export function installmentDueDate(startDate: string, n: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const totalMonths = m - 1 + (n - 1);
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d, daysInTargetMonth);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
