export const UBER_CATEGORY_LABELS: Record<string, string> = {
  combustivel: "Combustível",
  manutencao: "Manutenção",
  lavagem: "Lavagem",
  seguro: "Seguro do veículo",
  ipva_licenciamento: "IPVA/Licenciamento",
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
  pedagio_estacionamento: "#65A30D",
  internet_celular: "#2563EB",
  alimentacao: "#DB2777",
  outros: "#6B7280",
};

// Categorias que aparecem no seletor de "Lançamentos" — combustível fica de
// fora porque tem tela própria (com km/litros).
export const UBER_LANCAMENTO_CATEGORIES = Object.keys(UBER_CATEGORY_LABELS).filter(
  (c) => c !== "combustivel",
);

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
